/**
 * Catálogo Oficial Auditado de 55 Flujos Preestablecidos del Sistema WAPPY SG-SST
 * Arquitectura DAG Causal de Izquierda a Derecha (estilo docs.n8n.io) + Fidelidad de Dominio 8 Hitos Reales:
 * - Cero redundancia de fuentes de datos (Inv-04 / Inv-10)
 * - Rol causal explícito en los 42 aplicativos activos de los 8 Hitos: source_read vs target_write_report (Inv-05)
 * - Compuertas deterministas pre_agent (0 tokens LLM cuando 0 brechas) y semánticas post_agent con [VEREDICTO_IF: SI|NO] (Inv-06..08)
 * - Ledger Anti-Duplicados con ventana explícita dedupWindow (Inv-09)
 * - Fidelidad estricta contra HITO_APP_NODES (8 Hitos reales) y esquemas Mongoose de Somos SST (Inv-15..17)
 */

const SYSTEM_WORKFLOW_PRESETS_VERSION = '2026.11.11-v57-8hitos-domain-verified';

const SYSTEM_WORKFLOW_PRESETS_CATALOG = [
  {
    "presetKey": "preset_vencimientos_emo_epp",
    "presetCategory": "salud_vencimientos",
    "name": "🩺 Alerta Temprana de Vencimientos: Exámenes Médicos (EMO), Alturas y EPP",
    "presetDescription": "Audita diariamente los expedientes de Hito 2 · Perfil Sociodemográfico y Hito 5 · Entrega y Seguimiento de EPP para detectar: 1) Exámenes Médicos Ocupacionales (EMO) vencidos, próximos a vencer (<= 30 días) o sin soporte, 2) Certificados y reentrenamientos anuales de Trabajo en Alturas (Res. 4272/2021) únicamente cuando sí aplica (casilla con fecha registrada), y 3) Entregas de EPP vencidas, fuera de servicio o solicitudes abiertas. Si hay brechas nuevas escala a ACPM + Calendar + Gmail; si todo está vigente registra bitácora limpia en WAPPY.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "daily",
    "scheduleConfig": {
      "hour": 7,
      "minute": 0,
      "dayOfWeek": [
        1,
        2,
        3,
        4,
        5
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 7 * * 1,2,3,4,5",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito3_epp"
      ],
      "outputs": [
        "acpm_task",
        "google_calendar",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "positions": {},
        "edges": [],
        "nodeConfigs": {
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "expiry_only",
            "expiryAuditScope": [
              "emo",
              "alturas"
            ],
            "includeLatestReport": false,
            "selectedFields": [
              "Nombre Completo",
              "Cédula / Documento",
              "Cargo",
              "Área / Proceso",
              "EPS",
              "ARL",
              "fechaExamenMedico",
              "vencimientoExamenMedico",
              "estadoExamenMedicoEMO",
              "aplicaCursoAlturas",
              "estadoCursoAlturasAutorizado",
              "estadoCursoAlturasCoordinador",
              "motivosVencimientoDetectados"
            ],
            "customInstruction": "Extrae en modo expiry_only (alcance EMO y Alturas) únicamente trabajadores activos con Exámenes Médicos Ocupacionales (EMO) vencidos, próximos a vencer en <= 30 días o sin soporte, o con Certificado/Reentrenamiento de Alturas (Res. 4272/2021) vencido o a <= 30 días exclusivamente cuando sí aplica (casilla con fecha registrada en Hito 2 · Perfil Sociodemográfico)."
          },
          "tool_hitos_hito3_epp": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "includeLatestReport": false,
            "selectedFields": [
              "Nombre Completo",
              "Cédula / Documento",
              "Cargo",
              "Elemento de Protección Personal Entregado y Norma Técnica",
              "Talla, Cantidad, Fecha de Entrega y Fecha de Próxima Reposición",
              "Motivo de Entrega y Observaciones",
              "Estado de Stock e Inventario Mínimo por Referencia",
              "Firma de Recibido e Inducción de Uso y Mantenimiento"
            ],
            "customInstruction": "Extrae en Hito 5 · Entrega y Seguimiento de EPP únicamente colaboradores con entregas de EPP vencidas, fuera de servicio, pendientes de reposición, referencias en stock crítico o solicitudes QR abiertas."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "logic_merge_vencimientos_emo_epp": {
            "mergeStrategy": "union_dedup",
            "mergeKey": "cedula",
            "customInstruction": "Unifica por número de cédula los hallazgos reales de Hito 2 · Perfil Sociodemográfico (EMO y Curso de Alturas cuando aplica) y Hito 5 · Entrega y Seguimiento de EPP conservando íntegros los hallazgos de ambas fuentes sin sobrescribir filas."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Nuevos vencimientos <= 30d?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, próximo a vencer, sin soporte, fuera de servicio",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 2 · Perfil Sociodemográfico y Hito 5 · Entrega y Seguimiento de EPP: \"¿Nuevos vencimientos <= 30d?\" [modo: critical_findings]. Si existen brechas nuevas (>= 1 tras filtro anti-duplicados de 7d), activa la Rama SÍ (acpm_task, google_calendar, email_report) e invoca al Consultor SG-SST. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_google_calendar": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_vencimientos_emo_epp",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Consolidar por Cédula"
          }
        ]
      }
    },
    "prompt": "Actúa como Consultor SG-SST y analiza exclusivamente las brechas nuevas filtradas en Etapa 2 desde Hito 2 · Perfil Sociodemográfico y Hito 5 · Entrega y Seguimiento de EPP, respetando el filtro de Memoria Anti-Duplicados (ventana 7d) y la consolidación multi-fuente sin pérdida de logic_merge. Estructura obligatoriamente tu informe ejecutivo en 3 secciones diferenciadas:\n1) Exámenes Médicos Ocupacionales (EMO — Hito 2 · Perfil Sociodemográfico, Res. 2346/2007 y Res. 1918/2009): tabla nominal con Nombre, Cédula, Cargo, EPS/ARL, Fecha Último EMO, Fecha de Vencimiento, Estado y Acción Inmediata.\n2) Certificados y Reentrenamiento Anual de Trabajo Seguro en Alturas (Res. 4272/2021 — Hito 2 · Perfil Sociodemográfico): incluye ÚNICAMENTE a los trabajadores a quienes sí les aplica trabajo en alturas (aplicaCursoAlturas = \"Sí aplica\" por tener fecha registrada en Autorizado o Coordinador; jamás marques alerta sobre casillas vacías o \"No aplica\").\n3) Entregas, Reposiciones y Solicitudes de EPP (Hito 5 · Entrega y Seguimiento de EPP): tabla nominal con elemento EPP y norma técnica, estado (Vencido / Fuera de Servicio / Requiere Reposición / Solicitud QR), talla/cantidad y fecha de reposición.\nCierra con el plan consolidado para el Centro de Control ACPM y programación de citas/reposiciones en Google Calendar."
  },
  {
    "presetKey": "preset_ergonomia_owas_medlineplus",
    "presetCategory": "salud_vencimientos",
    "name": "🦴 Vigilancia Osteomuscular (OWAS / Estudio de Puesto) y Guías MedlinePlus NIH",
    "presetDescription": "Revisa evaluaciones posturales OWAS, Estudios de Puesto de Trabajo (EPT) y restricciones médicas osteomusculares, integrando guías clínicas de MedlinePlus (NIH) para readaptación laboral.",
    "agentTargetName": "Fisioterapeuta Laboral",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 30,
      "dayOfWeek": [
        3
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "30 8 * * 3",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_medlineplus_rehabilitacion"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_owas",
        "hito3_estudio_puesto",
        "hito2_condiciones_salud"
      ],
      "outputs": [
        "acpm_task",
        "canvas_doc",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito3_owas": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Lee evaluaciones ergonómicas OWAS con categorías de acción 3 o 4 pendientes de intervención."
          },
          "tool_hitos_hito3_estudio_puesto": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Lee Estudios de Puesto de Trabajo (EPT) abiertos o con recomendaciones biomecánicas pendientes."
          },
          "tool_hitos_hito2_condiciones_salud": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Lee casos con sintomatología o restricciones osteomusculares activas bajo reserva legal."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "logic_merge_ergonomia_owas": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Cruza hallazgos posturales OWAS, Estudios de Puesto de Trabajo y restricciones osteomusculares."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Nivel OWAS >= 3 o Restricción Sin EPT?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "nivel 3, nivel 4, restricción, crítico, pendiente",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 4 · Método OWAS (Evaluación Ergonómica), Hito 4 · Estudio de Puesto de Trabajo (EPT) y hito2_condiciones_salud: \"¿Nivel OWAS >= 3 o Restricción Sin EPT?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, canvas_doc, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_canvas_doc": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_ergonomia_owas",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "OWAS + EPT + Salud"
          }
        ]
      }
    },
    "prompt": "Cruza los registros críticos detectados en Evaluaciones Posturales OWAS (Hito 4 · Método OWAS (Evaluación Ergonómica)), Estudios de Puesto de Trabajo (Hito 4 · Estudio de Puesto de Trabajo (EPT)) y Condiciones de Salud osteomusculares (hito2_condiciones_salud). Consulta pautas clínicas basadas en evidencia en MedlinePlus NIH (consultar_medlineplus_rehabilitacion) para los diagnósticos o segmentos corporales comprometidos (resguardando la reserva de historia clínica). Estructura un plan de intervención ergonómica en ingeniería/administración del puesto para ACPM, documento técnico PVE Biomecánico en LiveEditor y resumen ejecutivo por correo."
  },
  {
    "presetKey": "preset_psicosocial_ccl_bienestar",
    "presetCategory": "salud_vencimientos",
    "name": "🧠 Vigilancia de Riesgo Psicosocial (Res. 2764), Pulso Anímico y Comité de Convivencia",
    "presetDescription": "Analiza indicadores agregados de batería psicosocial (Res. 2764 de 2022), analítica de clima laboral y gestión del Comité de Convivencia Laboral (Ley 1010 / Res. 652), protegiendo estrictamente la reserva legal.",
    "agentTargetName": "Psicólogo Especialista SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 5,
      "intervalHours": 4
    },
    "cronExpression": "0 8 5 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_analitica_psicosocial"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito4_psicosocial",
        "hito3_cocolab"
      ],
      "outputs": [
        "acpm_task",
        "canvas_doc",
        "email_report",
        "google_docs",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito4_psicosocial": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae indicadores agregados por dominio/área de la Batería de Riesgo Psicosocial (Res. 2764/2022)."
          },
          "tool_hitos_hito3_cocolab": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae estado de sesiones trimestrales y gestión agregada del Comité de Convivencia Laboral (COCOLAB)."
          },
          "if_router": {
            "ifPlacement": "post_agent",
            "ifConditionLabel": "¿Riesgo Alto/Muy Alto o Caso CCL Pendiente?",
            "ifConditionType": "ai_verdict",
            "ifRuleExpression": "riesgo alto, muy alto, acta trimestral vencida, intervención prioritaria",
            "customInstruction": "Compuerta semántica Post-IA: evalúa el veredicto estructurado del Agente IA ([VEREDICTO_IF: SI] vs [VEREDICTO_IF: NO]) para \"¿Riesgo Alto/Muy Alto o Caso CCL Pendiente?\". Si el veredicto es SI, ejecuta la Rama SÍ (acpm_task, canvas_doc, email_report). Si el veredicto es NO, ejecuta únicamente la Rama NO (google_docs, wappy_notification)."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_canvas_doc": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_docs": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Bajo estricta confidencialidad y reserva legal (Resolución 2404 de 2019, Resolución 2764 de 2022 y Ley 1010 de 2006), analiza los resultados agregados por área del aplicativo de Riesgo Psicosocial (hito4_psicosocial), la analítica de pulso anímico organizacional (consultar_analitica_psicosocial) y el cumplimiento trimestral del Comité de Convivencia Laboral COCOLAB (hito3_cocolab). Jamás expongas diagnósticos individuales. Si identificas dominios intralaborales/extralaborales en nivel Alto o Muy Alto, deterioro crítico del pulso anímico o sesiones trimestrales vencidas del COCOLAB, diseña el plan de intervención psicosocial colectiva para ACPM y LiveEditor y cierra exactamente con [VEREDICTO_IF: SI]. Si todos los indicadores están en nivel bajo/medio controlado y el COCOLAB está al día, redacta el acta mensual preventiva para Google Docs y cierra exactamente con [VEREDICTO_IF: NO]."
  },
  {
    "presetKey": "preset_verificacion_arl_antecedentes_ingreso",
    "presetCategory": "salud_vencimientos",
    "name": "🛡️ Verificación en Vivo de Certificados ARL y Antecedentes en Contratación / Ingreso",
    "presetDescription": "Consulta por cédula de trabajadores activos o nuevos ingresos en portales ARL y antecedentes públicos vía Google Antigravity, descargando certificados PDF/PNG reales.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 30,
      "dayOfWeek": [
        2
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "30 7 * * 2",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_antigravity"
      ],
      "extractors": [
        "scraper_agy_arl_directo",
        "scraper_agy_antecedentes"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Lee la nómina activa e ingresos recientes desde Perfil Sociodemográfico para validar cobertura ARL."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "logic_loop_arl_cedulas": {
            "batchSize": 25,
            "iterateByField": "cedula",
            "customInstruction": "Recorre cada cédula cruzando expediente sociodemográfico contra certificados ARL y antecedentes capturados vía Antigravity."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Trabajador Sin ARL Activa o Inconsistencia?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "inactivo, sin afiliación, inconsistencia, vencido, alerta",
            "customInstruction": "Compuerta determinista Pre-IA sobre hito2_perfil_socio, scraper_agy_arl_directo y scraper_agy_antecedentes: \"¿Trabajador Sin ARL Activa o Inconsistencia?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_loop_arl_cedulas",
            "logicType": "loop",
            "title": "Iterar (Loop)",
            "subtitle": "Por cada Cédula"
          }
        ]
      }
    },
    "prompt": "Revisa los resultados de verificación en portales oficiales capturados por scraper_agy_arl_directo y scraper_agy_antecedentes cruzados con la nómina activa de Perfil Sociodemográfico (hito2_perfil_socio). Identifica colaboradores o nuevos ingresos que figuren sin cobertura ARL activa en su clase de riesgo correspondiente o con inconsistencias documentales. Para los hallazgos detectados, estructura la orden inmediata de regularización previo ingreso a labores en ACPM y el reporte ejecutivo con enlaces a los soportes PDF/PNG para envío por correo."
  },
  {
    "presetKey": "preset_seguimiento_recomendaciones_medicas",
    "presetCategory": "salud_vencimientos",
    "name": "🏥 Seguimiento de Restricciones, Recomendaciones Médicas y Reintegro Laboral",
    "presetDescription": "Monitorea trabajadores con recomendaciones médicas temporales o permanentes, reintegros post-incapacidad y compatibilidad con las demandas físicas y mentales del Perfil de Cargo.",
    "agentTargetName": "Médico Laboral",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 8 * * 1",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_medlineplus_rehabilitacion"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_condiciones_salud",
        "hito2_perfiles_cargo",
        "hito3_estudio_puesto"
      ],
      "outputs": [
        "acpm_task",
        "google_calendar",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito2_condiciones_salud": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae casos activos con restricciones o recomendaciones médico-laborales próximas a vencer o sin seguimiento."
          },
          "tool_hitos_hito2_perfiles_cargo": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae exigencias físicas, biomecánicas y ambientales del cargo asignado."
          },
          "tool_hitos_hito3_estudio_puesto": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae ajustes razonables y Estudios de Puesto de Trabajo asociados al reintegro."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "logic_merge_reintegro_laboral": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Cruza restricciones vigentes con las demandas del Perfil de Cargo y Estudios de Puesto."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Recomendación Vencida o Sin Seguimiento?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, sin seguimiento, pendiente reubicación, restricción activa",
            "customInstruction": "Compuerta determinista Pre-IA sobre hito2_condiciones_salud, hito2_perfiles_cargo y Hito 4 · Estudio de Puesto de Trabajo (EPT): \"¿Recomendación Vencida o Sin Seguimiento?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, google_calendar, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_google_calendar": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_reintegro_laboral",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Salud + Cargo + EPT"
          }
        ]
      }
    },
    "prompt": "Analiza los casos con restricciones o recomendaciones médico-laborales en brecha provenientes de Condiciones de Salud (hito2_condiciones_salud), contrastándolos con las demandas del Perfil de Cargo (hito2_perfiles_cargo) y el Estudio de Puesto de Trabajo (Hito 4 · Estudio de Puesto de Trabajo (EPT)). Apóyate en MedlinePlus NIH (consultar_medlineplus_rehabilitacion) para enriquecer las pautas funcionales de readaptación laboral sin vulnerar la reserva médica (Res. 2346/2007). Genera plan de seguimiento en ACPM, programación de control médico en Google Calendar y comunicación formal de ajustes razonables para Talento Humano y jefatura."
  },
  {
    "presetKey": "preset_oraculo_ausentismo_morbilidad",
    "presetCategory": "salud_vencimientos",
    "name": "🔮 Oráculo de Salud y Tendencias de Ausentismo / Morbilidad Sentida (Hito 2 + Hito 8)",
    "presetDescription": "Cruza diagnósticos CIE-10 agrupados, incapacidades por origen común/laboral y variables demográficas para anticipar focos de ausentismo y alimentar los PVE.",
    "agentTargetName": "Médico Laboral",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 10,
      "intervalHours": 4
    },
    "cronExpression": "30 7 10 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_medlineplus_rehabilitacion"
      ],
      "includeIfNode": false,
      "hitos": [
        "hito2_condiciones_salud",
        "hito8_predictivo",
        "hito2_oraculo_predictivo"
      ],
      "outputs": [
        "canvas_doc",
        "google_sheets",
        "email_report"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito2_condiciones_salud": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae estadísticas agregadas de diagnósticos CIE-10, morbilidad sentida y ausentismo médico."
          },
          "tool_hitos_hito8_predictivo": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae correlaciones y tendencias preventivas del motor de Inteligencia Predictiva."
          },
          "tool_hitos_hito2_oraculo_predictivo": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "generate_report",
            "generateAppReport": true,
            "customInstruction": "Consolida el corte mensual en el Oráculo de Salud y emite el Informe Oficial HTML para los PVE."
          },
          "logic_merge_oraculo_salud": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Integra morbilidad CIE-10 agregada con señales predictivas de ausentismo."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_oraculo_salud",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Morbilidad + Predictivo"
          }
        ]
      }
    },
    "prompt": "Ejecuta el corte analítico mensual de ausentismo médico y morbilidad sentida integrando Condiciones de Salud (hito2_condiciones_salud) e Inteligencia Predictiva SST (hito8_predictivo), enriquecido con guías preventivas de MedlinePlus NIH (consultar_medlineplus_rehabilitacion). Agrupa tendencias por sistema afectado (osteomuscular, respiratorio, psicosocial, cardiovascular), actualiza el Oráculo de Salud (hito2_oraculo_predictivo) y formula metas concretas para los Programas de Vigilancia Epidemiológica (PVE) con salida a LiveEditor, Google Sheets y correo."
  },
  {
    "presetKey": "preset_riesgo_biologico_vacunacion_bioipevar",
    "presetCategory": "salud_vencimientos",
    "name": "🧬 Control de Exposición a Riesgo Biológico (Bio-IPEVAR), Esquemas de Vacunación y EPP",
    "presetDescription": "Audita cargos expuestos a agentes biológicos (fluidos, residuos, atención en salud, alimentos o saneamiento), validando matriz Bio-IPEVAR, vacunación (Tétanos/Hepatitis B) y bioseguridad.",
    "agentTargetName": "Especialista en Bioseguridad",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 12,
      "intervalHours": 4
    },
    "cronExpression": "0 8 12 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_medlineplus_rehabilitacion"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito4_bio_ipevar",
        "hito3_epp",
        "hito2_condiciones_salud"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_docs",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito4_bio_ipevar": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae procesos y cargos con exposición alta o crítica en la Matriz de Riesgo Biológico Bio-IPEVAR."
          },
          "tool_hitos_hito3_epp": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica entregas vigentes de EPP de bioseguridad por cargo expuesto."
          },
          "tool_hitos_hito2_condiciones_salud": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica esquemas de inmunización ocupacional (Hepatitis B, Tétanos, Influenza) pendientes o vencidos."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Esquema Vacunal Incompleto o Bio-Riesgo Alto?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "incompleto, vencido, sin refuerzo, riesgo biológico alto",
            "customInstruction": "Compuerta determinista Pre-IA sobre hito4_bio_ipevar, Hito 5 · Entrega y Seguimiento de EPP y hito2_condiciones_salud: \"¿Esquema Vacunal Incompleto o Bio-Riesgo Alto?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_docs, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_docs": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Audita las brechas de bioseguridad detectadas al cruzar la Matriz de Riesgo Biológico Bio-IPEVAR (hito4_bio_ipevar), las entregas de barreras y EPP específicos (Hito 5 · Entrega y Seguimiento de EPP) y el seguimiento de inmunización ocupacional en Condiciones de Salud (hito2_condiciones_salud), consultando lineamientos preventivos en MedlinePlus NIH (consultar_medlineplus_rehabilitacion). Detalla los cargos y trabajadores con refuerzos vacunales pendientes o controles de contención incompletos para su cierre inmediato en ACPM y notificación por correo."
  },
  {
    "presetKey": "preset_auditoria_dotacion_reposicion_epp",
    "presetCategory": "salud_vencimientos",
    "name": "🦺 Control Cuatrimestral de Dotación Legal (CST Art. 230) y Reposición Técnica de EPP",
    "presetDescription": "Verifica las entregas legales de dotación y la vida útil técnica de los Elementos de Protección Personal (cascos, dieléctricos, protección respiratoria, auditiva y visual) frente a los peligros del cargo.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 45,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 15,
      "intervalHours": 4
    },
    "cronExpression": "45 7 15 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito3_epp",
        "hito2_perfiles_cargo",
        "hito5_compras_sst"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito3_epp": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae entregas firmadas vencidas, faltantes por cargo y stock crítico de EPP."
          },
          "tool_hitos_hito2_perfiles_cargo": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae matriz de EPP obligatorios definidos en cada Perfil de Cargo."
          },
          "tool_hitos_hito5_compras_sst": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae órdenes de adquisición y avales técnicos ANSI/NIOSH/NTC de EPP."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Trabajador Sin EPP del Cargo o Vencido?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "sin entrega, vencido, stock agotado, reposición pendiente",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 5 · Entrega y Seguimiento de EPP, hito2_perfiles_cargo y hito5_compras_sst: \"¿Trabajador Sin EPP del Cargo o Vencido?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Evalúa las brechas de dotación legal (CST Art. 230) y reposición técnica de Elementos de Protección Personal (Ley 9 de 1979 y Dec. 1072 Art. 2.2.4.6.24) cruzando el aplicativo de EPP (Hito 5 · Entrega y Seguimiento de EPP), los requisitos por puesto en Perfiles de Cargo (hito2_perfiles_cargo) y las especificaciones técnicas en Compras SST (hito5_compras_sst). Genera el listado nominal de entregas/reposiciones urgentes y requerimientos de compra certificada (ANSI/NIOSH/NTC) para ACPM y correo electrónico."
  },
  {
    "presetKey": "preset_examenes_ingreso_egreso_periodicos",
    "presetCategory": "salud_vencimientos",
    "name": "📋 Conciliación de Profesiograma: Exámenes de Ingreso, Periódicos, Cambio de Ocupación y Egreso",
    "presetDescription": "Verifica que todo nuevo ingreso tenga concepto de aptitud previo al inicio de labores, que los cambios de cargo cuenten con valoración médica y que los retiros tengan orden de examen de egreso.",
    "agentTargetName": "Médico Laboral",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 15,
      "dayOfWeek": [
        4
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "15 7 * * 4",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_gmail"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito2_perfiles_cargo",
        "hito5_gestion_cambio"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae ingresos recientes, retiros y periodicidad EMO en Perfil Sociodemográfico."
          },
          "tool_hitos_hito2_perfiles_cargo": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae profesiograma y valoraciones médicas exigidas por cargo."
          },
          "tool_hitos_hito5_gestion_cambio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae traslados o cambios de ocupación que exigen valoración médica previa."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "logic_merge_profesiograma_emo": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Cruza ingresos, cambios de cargo y correos de IPS contra el profesiograma vigente."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Ingreso, Cambio o Retiro Sin EMO?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "sin examen, ingreso sin aptitud, cambio sin valoración, vencido",
            "customInstruction": "Compuerta determinista Pre-IA sobre extract_gmail, hito2_perfil_socio, hito2_perfiles_cargo y hito5_gestion_cambio: \"¿Ingreso, Cambio o Retiro Sin EMO?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_profesiograma_emo",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Nómina + Profesiograma"
          }
        ]
      }
    },
    "prompt": "Concilia las novedades de ingreso, cambio de ocupación (hito5_gestion_cambio), retiros y certificados recibidos por correo (extract_gmail) frente a los Exámenes Médicos Ocupacionales asentados en Perfil Sociodemográfico (hito2_perfil_socio — Res. 2346/2007) y las pruebas complementarias exigidas en Perfiles de Cargo (hito2_perfiles_cargo). Para cada brecha detectada, estructura tarea prioritaria en ACPM y alerta nominal para Talento Humano y SST."
  },
  {
    "presetKey": "preset_drive_sociodemografico_emo",
    "presetCategory": "drive_sincronizacion",
    "name": "📂 Sincronizar Carpeta Google Drive ➔ Perfil Sociodemográfico y Conceptos Médicos",
    "presetDescription": "Vigila la carpeta de Talento Humano / SST en Google Drive, detecta encuestas sociodemográficas o PDFs de conceptos de aptitud médica nuevos e inyecta las actualizaciones en Somos SST sin duplicar cédulas.",
    "agentTargetName": "Médico Laboral",
    "scheduleType": "daily",
    "scheduleConfig": {
      "hour": 18,
      "minute": 0,
      "dayOfWeek": [
        1,
        2,
        3,
        4,
        5
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 18 * * 1,2,3,4,5",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_drive"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito2_condiciones_salud"
      ],
      "outputs": [
        "google_sheets",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "extractor_extract_drive": {
            "driveFolderName": "Perfil Sociodemográfico y EMO",
            "onlyNewFiles": true,
            "customInstruction": "Detecta hojas de cálculo o PDFs nuevos de encuestas sociodemográficas y conceptos médicos de aptitud."
          },
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Sincroniza datos demográficos y fechas de concepto de aptitud EMO por cédula sin duplicar registros."
          },
          "tool_hitos_hito2_condiciones_salud": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Actualiza recomendaciones, restricciones y hallazgos agregados de salud ocupacional."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "all"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Archivos Nuevos de EMO/Demografía en Drive?",
            "ifConditionType": "new_external_items",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Compuerta determinista Pre-IA sobre extract_drive (Carpeta Perfil Sociodemográfico y EMO): \"¿Archivos Nuevos de EMO/Demografía en Drive?\" [modo: new_external_items]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (google_sheets, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_google_sheets": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Procesa exclusivamente los archivos nuevos detectados por extract_drive en la carpeta \"Perfil Sociodemográfico y Exámenes Médicos\" que no figuren en la Memoria Anti-Duplicados. Extrae con exactitud los campos reales (cédula, nombre, cargo, tipo de evaluación médica, fecha, concepto de aptitud y recomendaciones) sin inventar información, actualiza los expedientes en Perfil Sociodemográfico (hito2_perfil_socio) y Condiciones de Salud (hito2_condiciones_salud), registra trazabilidad en Google Sheets y envía resumen ejecutivo por correo."
  },
  {
    "presetKey": "preset_antigravity_cloud_bridge",
    "presetCategory": "drive_sincronizacion",
    "name": "🚀 Puente Antigravity + Carpeta Local Mac/PC & Drive ➔ Auditoría Integral 7 Hitos",
    "presetDescription": "Conecta documentos locales del computador (vía Google Antigravity) y carpetas de Google Drive para conciliar soportes masivos contra los aplicativos de Gobernanza, Sociodemográfico y ACPM.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 17,
      "minute": 0,
      "dayOfWeek": [
        5
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 17 * * 5",
    "workflowNodes": {
      "trigger": "trigger_antigravity",
      "triggers": [
        "trigger_antigravity",
        "schedule_cron"
      ],
      "extractors": [
        "extract_pc_folder",
        "extract_drive"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito1_diagnostico_0312",
        "hito2_perfil_socio",
        "hito7_acpm"
      ],
      "outputs": [
        "google_sheets",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito1_diagnostico_0312": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Lee estándares mínimos Res. 0312 pendientes de soporte documental."
          },
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Asienta soportes individuales conciliados desde PC/Drive."
          },
          "tool_hitos_hito7_acpm": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Actualiza evidencias de cierre en acciones ACPM abiertas."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "logic_merge_local_drive_sst": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Unifica archivos nuevos de Carpeta Local Mac/PC, Google Drive y brechas del Diagnóstico Res. 0312."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Soportes Nuevos en PC/Drive por Conciliar?",
            "ifConditionType": "new_external_items",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Compuerta determinista Pre-IA sobre extract_pc_folder, extract_drive y hito1_diagnostico_0312: \"¿Soportes Nuevos en PC/Drive por Conciliar?\" [modo: new_external_items]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (google_sheets, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_google_sheets": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_local_drive_sst",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "PC + Drive + 0312"
          }
        ]
      }
    },
    "prompt": "Inspecciona los soportes documentales nuevos detectados en la carpeta local del equipo vía Antigravity (extract_pc_folder) y en Google Drive (extract_drive), cruzándolos con los ítems pendientes del Diagnóstico Res. 0312 (hito1_diagnostico_0312). Clasifica cada evidencia real y sincroniza las actualizaciones pertinentes hacia Perfil Sociodemográfico (hito2_perfil_socio) y Plan ACPM (hito7_acpm), consolidando sábana de auditoría en Google Sheets y reporte por correo."
  },
  {
    "presetKey": "preset_drive_hito1_gobernanza_import",
    "presetCategory": "drive_sincronizacion",
    "name": "🏛️ Importador Inteligente Drive ➔ Gobernanza Hito 1 (Política, Objetivos, RHS y RIT)",
    "presetDescription": "Lee documentos maestros firmados en Google Drive (Política SST, Objetivos, Reglamento de Higiene y Seguridad Industrial y Reglamento Interno de Trabajo) y mantiene al día los aplicativos del Hito 1.",
    "agentTargetName": "Abogado Laboral",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 2,
      "intervalHours": 4
    },
    "cronExpression": "0 8 2 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_drive"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_rag_documental"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito1_politica_objetivos",
        "hito1_objetivos",
        "hito1_rhs",
        "hito1_rit"
      ],
      "outputs": [
        "acpm_task",
        "google_docs",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "extractor_extract_drive": {
            "driveFolderName": "Gobernanza SG-SST Hito 1",
            "onlyNewFiles": true,
            "customInstruction": "Vigila versiones firmadas de Política SST, Objetivos, RHS y RIT en Google Drive."
          },
          "tool_hitos_hito1_politica_objetivos": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "write_and_report",
            "generateAppReport": true,
            "customInstruction": "Actualiza vigencia, fecha y firma de la Política SG-SST y genera Informe Oficial."
          },
          "tool_hitos_hito1_objetivos": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Sincroniza Objetivos y Metas anuales del SG-SST."
          },
          "tool_hitos_hito1_rhs": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Actualiza Reglamento de Higiene y Seguridad Industrial (Art. 349 CST)."
          },
          "tool_hitos_hito1_rit": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Actualiza Reglamento Interno de Trabajo vigente."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "all"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Documentos Nuevos de Gobernanza en Drive >= 1?",
            "ifConditionType": "new_external_items",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Compuerta determinista Pre-IA sobre extract_drive (Carpeta Gobernanza SG-SST Hito 1): \"¿Documentos Nuevos de Gobernanza en Drive >= 1?\" [modo: new_external_items]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, google_docs, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_google_docs": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Analiza los documentos rectores nuevos o actualizados extraídos desde Google Drive (extract_drive) correspondientes a Gobernanza Hito 1: Política SST (hito1_politica_objetivos — Art. 2.2.4.6.5–7 Dec. 1072), Objetivos y Metas (hito1_objetivos), Reglamento de Higiene y Seguridad Industrial (hito1_rhs — Art. 349 CST) y Reglamento Interno de Trabajo (hito1_rit). Verifica fecha, revisión anual y firma del Representante Legal, sincroniza los aplicativos de destino y si falta firma o requisito legal abre seguimiento en ACPM junto con acta en Google Docs y correo."
  },
  {
    "presetKey": "preset_gmail_incapacidades_radicacion_eps_arl",
    "presetCategory": "drive_sincronizacion",
    "name": "📧 Triaje de Correos Gmail ➔ Radicación de Incapacidades Médicas (EPS / ARL) y Ausentismo",
    "presetDescription": "Escanea correos entrantes en Gmail con asuntos de incapacidades médicas, licencias o transcripciones EPS/ARL, extrae días y código CIE-10 y actualiza Condiciones de Salud y Estadísticas.",
    "agentTargetName": "Médico Laboral",
    "scheduleType": "daily",
    "scheduleConfig": {
      "hour": 9,
      "minute": 0,
      "dayOfWeek": [
        1,
        2,
        3,
        4,
        5
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 9 * * 1,2,3,4,5",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_email"
      ],
      "extractors": [
        "extract_gmail"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "consultar_medlineplus_rehabilitacion"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito2_condiciones_salud",
        "hito7_estadisticas_atel"
      ],
      "outputs": [
        "google_sheets",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "extractor_extract_gmail": {
            "emailSubjectFilter": "Incapacidad OR Licencia OR Transcripción EPS OR ARL",
            "onlyWithAttachments": false,
            "customInstruction": "Filtra correos entrantes con radicados o certificados de incapacidad médica EPS/ARL."
          },
          "tool_hitos_hito2_condiciones_salud": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Registra incapacidad, días y seguimiento de reintegro bajo reserva legal."
          },
          "tool_hitos_hito7_estadisticas_atel": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Actualiza indicadores acumulados de ausentismo por causa médica."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "all"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Nuevos Correos de Incapacidad EPS/ARL >= 1?",
            "ifConditionType": "new_external_items",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Compuerta determinista Pre-IA sobre extract_gmail (filtrados por Memoria Anti-Duplicados): \"¿Nuevos Correos de Incapacidad EPS/ARL >= 1?\" [modo: new_external_items]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (google_sheets, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_google_sheets": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          },
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "all",
            "includeLatestReport": false,
            "customInstruction": "Extrae en Hito 2 · Perfil Sociodemográfico el censo activo de trabajadores (cédula, nombre, cargo, área, EPS, ARL y fecha de ingreso) como fuente maestra de contraste."
          }
        },
        "positions": {},
        "edges": []
      }
    },
    "prompt": "Procesa los correos nuevos de incapacidades médicas, licencias o transcripciones EPS/ARL capturados por extract_gmail y cruza la cédula del trabajador contra la nómina activa (Hito 2 · Perfil Sociodemográfico). Extrae fecha de inicio, fecha fin, días de incapacidad, origen (común/laboral) y grupo CIE-10 (consultando tiempos orientativos de recuperación en consultar_medlineplus_rehabilitacion). Actualiza Condiciones de Salud (hito2_condiciones_salud) y Estadísticas ATEL/Ausentismo (hito7_estadisticas_atel), consolida fila contable en Google Sheets y notifica a Nómina/SST protegiendo el diagnóstico sensible conforme a la reserva legal."
  },
  {
    "presetKey": "preset_drive_fds_quimicos_sincronizacion",
    "presetCategory": "drive_sincronizacion",
    "name": "🧪 Sincronización Carpeta Drive \"FDS Químicos\" ➔ Inventario SGA y Registro Químico",
    "presetDescription": "Detecta nuevas Fichas de Datos de Seguridad (FDS de 16 secciones en PDF) subidas a Google Drive, extrae CAS, pictogramas SGA y controles, y actualiza los aplicativos químicos de Hito 1 (Matriz de Compatibilidad Química SGA) y Hito 5 (Inventario de Productos Químicos).",
    "agentTargetName": "Ingeniero Químico SST",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 10,
      "minute": 0,
      "dayOfWeek": [
        2
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 10 * * 2",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_drive"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "consultar_pubchem_quimico"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_quimicos_sga",
        "hito5_registro_quimico"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "extractor_extract_drive": {
            "driveFolderName": "FDS Químicos",
            "fileTypeFilter": "pdf",
            "onlyNewFiles": true,
            "customInstruction": "Detecta nuevas Fichas de Datos de Seguridad (FDS de 16 secciones) cargadas en Google Drive."
          },
          "tool_hitos_hito3_quimicos_sga": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_report",
            "generateAppReport": true,
            "customInstruction": "Indexa sustancia, CAS, pictogramas SGA, frases H/P y compatibilidad química."
          },
          "tool_hitos_hito5_registro_quimico": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Actualiza el registro operativo de sustancias por área y vigencia de FDS."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "all"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Nuevas Fichas FDS PDF en Drive >= 1?",
            "ifConditionType": "new_external_items",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Compuerta determinista Pre-IA sobre extract_drive (Carpeta FDS Químicos): \"¿Nuevas Fichas FDS PDF en Drive >= 1?\" [modo: new_external_items]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Lee las nuevas Fichas de Datos de Seguridad (FDS de 16 secciones) detectadas en Google Drive (extract_drive) y contrasta número CAS, peligrosidad GHS, frases H/P y EPP recomendados con PubChem NIH (consultar_pubchem_quimico) bajo el Decreto 1496 de 2018 y Resolución 773 de 2021. Registra y actualiza el Inventario Químico SGA (Hito 1 · Matriz de Compatibilidad Química (SGA)) y el Registro Operativo Químico (hito5_registro_quimico); si alguna FDS supera 5 años de antigüedad o presenta incompatibilidad crítica de almacenamiento, genera acción en ACPM y reporte técnico por correo."
  },
  {
    "presetKey": "preset_drive_contratistas_seguridad_social_pila",
    "presetCategory": "drive_sincronizacion",
    "name": "👷 Recepción en Drive/Gmail de Planillas PILA y Soportes SST de Contratistas (Hito 5)",
    "presetDescription": "Revisa mensualmente las carpetas de contratistas y proveedores críticos en Drive/Gmail verificando pago de seguridad social (ARL, EPS, AFP), certificados de alturas e inducción SST antes de autorizar ingreso.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 3,
      "intervalHours": 4
    },
    "cronExpression": "30 7 3 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_email"
      ],
      "extractors": [
        "extract_drive",
        "extract_gmail"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito5_contratistas",
        "hito5_compras_sst"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito5_contratistas": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae listado de empresas contratistas activas, personal en obra y estado de habilitación SST."
          },
          "tool_hitos_hito5_compras_sst": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae contratos y órdenes de servicio críticos sujetos al Art. 2.2.4.6.28 Dec. 1072."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "logic_merge_contratistas_pila": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Unifica planillas PILA recibidas por Drive y Gmail con el padrón de contratistas activos."
          },
          "logic_approval_bloqueo_contratista": {
            "approverEmail": "lider.sst@empresa.com",
            "customInstruction": "Solicita confirmación humana del Líder SG-SST antes de notificar restricción de ingreso a contratista en mora."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Contratista Con Mora PILA o Soporte Faltante?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "mora, vencido, sin planilla, soporte faltante, sin ARL",
            "customInstruction": "Compuerta determinista Pre-IA sobre extract_drive, extract_gmail, hito5_contratistas y hito5_compras_sst: \"¿Contratista Con Mora PILA o Soporte Faltante?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_contratistas_pila",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Drive + Gmail + Hito 5"
          },
          {
            "key": "logic_approval_bloqueo_contratista",
            "logicType": "human_approval",
            "title": "Aprobación",
            "subtitle": "Visto Bueno SST"
          }
        ]
      }
    },
    "prompt": "Cruza las planillas PILA y certificados SST recibidos en Google Drive (extract_drive) y Gmail (extract_gmail) contra las empresas registradas en Gestión de Contratistas (hito5_contratistas) y Compras SST (hito5_compras_sst — Art. 2.2.4.6.28 Dec. 1072). Verifica pago vigente de ARL según clase de riesgo de la actividad, EPS, AFP, certificados de alturas e inducción SST. Para todo contratista con mora o soporte faltante, estructura requerimiento formal y tarea preventiva de control de acceso en ACPM (sujeto a Visto Bueno SST)."
  },
  {
    "presetKey": "preset_drive_actas_copasst_cocolab_archivo",
    "presetCategory": "drive_sincronizacion",
    "name": "🗂️ Consolidación Mensual de Actas Firmadas COPASST y COCOLAB ➔ Archivo Documental Drive",
    "presetDescription": "Verifica las reuniones mensuales del COPASST (Dec. 614 / Res. 2013 de 1986) y trimestrales del COCOLAB, generando acta ejecutiva y respaldo automático en Google Docs y Sheets.",
    "agentTargetName": "Redactor de Actas SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 16,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 25,
      "intervalHours": 4
    },
    "cronExpression": "0 16 25 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_drive"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental"
      ],
      "inputs": [],
      "includeIfNode": false,
      "hitos": [
        "hito4_comites",
        "hito3_cocolab",
        "hito7_acpm"
      ],
      "outputs": [
        "canvas_doc",
        "google_docs",
        "email_report"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito4_comites": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae conformación, quórum y actas mensuales del COPASST / Vigía SST (Res. 2013/1986)."
          },
          "tool_hitos_hito3_cocolab": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae sesiones trimestrales y seguimiento preventivo del Comité de Convivencia Laboral."
          },
          "tool_hitos_hito7_acpm": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae compromisos abiertos delegados a los comités en el tablero ACPM."
          },
          "logic_merge_actas_comites": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Consolida actas en Drive con el estado de COPASST, COCOLAB y compromisos ACPM."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_actas_comites",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "COPASST + CCL + Drive"
          }
        ]
      }
    },
    "prompt": "Consolida el estado mensual de gestión de comités cruzando Conformación y Actas de COPASST / Vigía (Hito 3 · COPASST / Vigía de SST — Res. 2013 de 1986), Comité de Convivencia Laboral COCOLAB (hito3_cocolab — Res. 652 y 1356 de 2012), compromisos en ACPM (hito7_acpm) y soportes firmados en Google Drive (extract_drive). Redacta el informe mensual con verificación de quórum, avance de compromisos y orden del día sugerido para la próxima sesión en LiveEditor, Google Docs y correo."
  },
  {
    "presetKey": "preset_sheets_maestro_indicadores_sgsst",
    "presetCategory": "drive_sincronizacion",
    "name": "📊 Exportación Semanal de Tablero Maestro de Indicadores SG-SST ➔ Google Sheets",
    "presetDescription": "Extrae cada viernes el avance real de estructura, proceso y resultado del SG-SST y actualiza automáticamente el libro gerencial en Google Sheets.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 17,
      "minute": 30,
      "dayOfWeek": [
        5
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "30 17 * * 5",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company"
      ],
      "inputs": [],
      "includeIfNode": false,
      "hitos": [
        "hito1_diagnostico_0312",
        "hito1_objetivos",
        "hito7_estadisticas_atel",
        "hito7_acpm"
      ],
      "outputs": [
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito1_diagnostico_0312": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae porcentaje global y por ciclo PHVA de Estándares Mínimos Res. 0312."
          },
          "tool_hitos_hito1_objetivos": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae cumplimiento de indicadores de Estructura, Proceso y Resultado."
          },
          "tool_hitos_hito7_estadisticas_atel": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae indicadores mensuales de accidentalidad, enfermedad laboral y ausentismo."
          },
          "tool_hitos_hito7_acpm": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae tasa de eficacia y cierre oportuno de acciones ACPM."
          },
          "logic_merge_indicadores_sheets": {
            "mergeStrategy": "append_all",
            "customInstruction": "Unifica los KPIs de los 4 módulos rectores en una sola estructura tabular semanal."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_indicadores_sheets",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Unificar KPIs PHVA"
          }
        ]
      }
    },
    "prompt": "Consolida las métricas reales extraídas de Diagnóstico Res. 0312 (hito1_diagnostico_0312), Objetivos e Indicadores de Estructura, Proceso y Resultado (hito1_objetivos — Art. 2.2.4.6.19–22 Dec. 1072), Estadísticas ATEL (hito7_estadisticas_atel) y eficacia de cierre en ACPM (hito7_acpm). Entrega una matriz ejecutiva limpia lista para sincronizar en el tablero gerencial de Google Sheets junto con notificación resumen en WAPPY."
  },
  {
    "presetKey": "preset_webhook_erp_novedades_nomina_sst",
    "presetCategory": "drive_sincronizacion",
    "name": "🔗 Webhook / Integración Nómina & Talento Humano ➔ Altas, Retiros y Perfil de Cargo SST",
    "presetDescription": "Recibe eventos automáticos por Webhook desde sistemas externos de RRHH/ERP (ingresos, traslados de sede, ascensos o retiros) y sincroniza trabajadores, perfiles e inducciones SST.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "daily",
    "scheduleConfig": {
      "hour": 19,
      "minute": 0,
      "dayOfWeek": [
        1,
        2,
        3,
        4,
        5
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 19 * * 1,2,3,4,5",
    "workflowNodes": {
      "trigger": "trigger_webhook",
      "triggers": [
        "trigger_webhook",
        "schedule_cron"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "webhook_api"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfiles_cargo",
        "hito2_perfil_socio",
        "hito5_capacitaciones"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito2_perfiles_cargo": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Consulta competencias, peligros y profesiograma del cargo reportado en la novedad RRHH."
          },
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Registra altas, traslados o retiros en Perfil Sociodemográfico."
          },
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Asigna ruta de Inducción SG-SST obligatoria al nuevo ingreso o cambio de cargo."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "if_router": {
            "ifPlacement": "post_agent",
            "ifConditionLabel": "¿Nuevo Ingreso o Traslado Requiere Inducción/EMO?",
            "ifConditionType": "ai_verdict",
            "ifRuleExpression": "nuevo ingreso, alta, ascenso, traslado de sede, pendiente inducción",
            "customInstruction": "Compuerta semántica Post-IA: evalúa el veredicto estructurado del Agente IA ([VEREDICTO_IF: SI] vs [VEREDICTO_IF: NO]) para \"¿Nuevo Ingreso o Traslado Requiere Inducción/EMO?\". Si el veredicto es SI, ejecuta la Rama SÍ (acpm_task, email_report). Si el veredicto es NO, ejecuta únicamente la Rama NO (wappy_notification)."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Procesa el evento entrante de RRHH/ERP (webhook_api) contrastando el cargo del colaborador con Perfiles de Cargo (hito2_perfiles_cargo). Si existen novedades reales de vinculación, traslado o ascenso, sincroniza el expediente en Perfil Sociodemográfico (hito2_perfil_socio), programa Inducción SG-SST en Capacitaciones (Hito 6 · Programa de Capacitación SG-SST — Art. 2.2.4.6.11 Dec. 1072), genera seguimiento de examen preocupacional/entrega de EPP en ACPM y cierra exactamente con [VEREDICTO_IF: SI]. Si el evento no contiene altas ni cambios pendientes por gestionar, confirma sincronización limpia y cierra exactamente con [VEREDICTO_IF: NO]."
  },
  {
    "presetKey": "preset_drive_furat_investigacion_correo",
    "presetCategory": "atel_inspecciones",
    "name": "📂 Carpeta Drive (FURAT) ➔ Investigación en Aplicativo ATEL (Res. 1401) ➔ Informe Oficial al Correo",
    "presetDescription": "Vigila la carpeta \"Accidentes / FURAT\" en Google Drive (con lectura digital y OCR IA para escaneados), envía los datos al aplicativo Investigación ATEL para registrar el caso, ejecuta el análisis IA propio del aplicativo (5 Porqués + Ishikawa SVG + Árbol de Causas + Firmas), extrae el Informe Oficial HTML y lo envía por correo.",
    "agentTargetName": "Investigador ATEL",
    "scheduleType": "daily",
    "scheduleConfig": {
      "hour": 7,
      "minute": 15,
      "dayOfWeek": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "15 7 * * 1,2,3,4,5,6",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_drive"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito7_investigacion_atel"
      ],
      "outputs": [
        "email_report",
        "acpm_task",
        "canvas_doc",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "extractor_extract_drive": {
            "driveFolderName": "Accidentes",
            "fileTypeFilter": "pdf",
            "onlyNewFiles": true,
            "customInstruction": "Vigila la carpeta \"Accidentes\" / \"FURAT\" en Google Drive y filtra únicamente reportes FURAT nuevos no investigados."
          },
          "tool_hitos_hito7_investigacion_atel": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_report",
            "generateAppReport": true,
            "customInstruction": "1) Mapea los 23 campos del FURAT cruzando cédula con Trabajadores 360°, 2) Registra el expediente en InvestigacionAtelData, 3) Ejecuta Análisis IA Res. 1401 (5 Porqués + Ishikawa SVG + Árbol de Causas + Firmas) y 4) Emite el Informe Oficial HTML para correo y LiveEditor."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "all"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Nuevo FURAT en Drive sin investigar?",
            "ifConditionType": "new_external_items",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Compuerta determinista Pre-IA sobre extract_drive (Carpeta Accidentes / FURAT con filtro Anti-Duplicados permanente): \"¿Nuevo FURAT en Drive sin investigar?\" [modo: new_external_items]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (email_report, acpm_task, canvas_doc) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_email_report": {
            "ifBranch": "yes",
            "emailSubject": "🚨 Informe Oficial de Investigación ATEL (Res. 1401) — FURAT Procesado desde Drive"
          },
          "out_acpm_task": {
            "ifBranch": "yes",
            "kanbanStatus": "todo",
            "kanbanPriority": "high",
            "kanbanActionType": "correctiva",
            "kanbanDueDays": 10,
            "kanbanTaskTitle": "Ejecutar plan de intervención ATEL antes de 15 días calendario (Res. 1401)"
          },
          "out_canvas_doc": {
            "ifBranch": "yes",
            "documentTitle": "Informe Oficial Investigación ATEL (Res. 1401 de 2007)"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Procesa únicamente los archivos FURAT nuevos detectados en la carpeta \"Accidentes\" / \"FURAT\" de Google Drive (extract_drive) que superaron la compuerta Pre-IA y la Memoria Anti-Duplicados. Sin inventar ni simular datos: 1) Extrae los 23 campos estructurados del FURAT (lectura digital u OCR IA para escaneados: identificación del trabajador, fecha y hora del siniestro, lugar, actividad, agente del accidente, mecanismo, parte del cuerpo afectada, naturaleza de la lesión, días de incapacidad y relato completo). 2) Ejecuta el análisis causal técnico exigido por la Resolución 1401 de 2007 (Metodología de los 5 Porqués, Espina de Pescado Ishikawa separando Causas Inmediatas [Actos y Condiciones Subestándar] y Causas Básicas [Factores Personales y Factores del Trabajo], y Árbol de Causas). 3) Registra el expediente en Investigación ATEL (hito7_investigacion_atel) generando el Informe Oficial HTML con bloque de firmas del Equipo Investigador para su despacho automático a Gmail, LiveEditor y plan de acción ACPM dentro del plazo legal de 15 días calendario."
  },
  {
    "presetKey": "preset_voz_tenshi_furat_investigacion_atel_360",
    "presetCategory": "atel_inspecciones",
    "name": "🎙️ Orden por Voz a Tenshi ➔ FURAT en Drive ➔ Investigación de Accidente ATEL 360° (Res. 1401)",
    "presetDescription": "Al pedirle por voz a Tenshi investigar un accidente laboral, descarga el FURAT de Google Drive, cruza Matriz GTC-45, ATS, Actos/Condiciones, Capacitaciones, Perfil de Cargo, EPP y EMO, aplica 5 Porqués + Ishikawa en Investigación ATEL y entrega informe completo.",
    "agentTargetName": "Investigador ATEL",
    "scheduleType": "daily",
    "scheduleConfig": {
      "hour": 8,
      "minute": 0,
      "dayOfWeek": [
        1,
        2,
        3,
        4,
        5
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 8 * * 1,2,3,4,5",
    "workflowNodes": {
      "trigger": "trigger_tenshi",
      "triggers": [
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_drive"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": false,
      "hitos": [
        "hito2_perfil_socio",
        "hito2_matriz_ipevar",
        "hito3_ats",
        "hito4_actos_condiciones",
        "hito5_capacitaciones",
        "hito7_investigacion_atel"
      ],
      "outputs": [
        "canvas_doc",
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae expediente sociodemográfico, antigüedad en el cargo y vigencia EMO del trabajador accidentado."
          },
          "tool_hitos_hito2_matriz_ipevar": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae valoración previa del peligro y controles existentes en la Matriz GTC-45."
          },
          "tool_hitos_hito3_ats": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae Análisis de Trabajo Seguro (ATS) elaborados para la tarea involucrada."
          },
          "tool_hitos_hito4_actos_condiciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae antecedentes de condiciones o actos subestándar reportados en el área."
          },
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae historial de inducción y entrenamiento específico del colaborador."
          },
          "tool_hitos_hito7_investigacion_atel": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_report",
            "generateAppReport": true,
            "customInstruction": "Registra la investigación 360° bajo Res. 1401 y genera el Informe Oficial HTML."
          },
          "logic_merge_atel_360": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Unifica el FURAT de Google Drive con los 5 módulos de trazabilidad previa del trabajador y del área."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_atel_360",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "FURAT + Contexto 360°"
          }
        ]
      }
    },
    "prompt": "Al recibir la orden por voz o chat en Tenshi IA para investigar un accidente laboral: 1) Lee el FURAT desde Google Drive (extract_drive) y cruza la trazabilidad 360° pre-extraída de Perfil Sociodemográfico y EMO (hito2_perfil_socio), Matriz de Peligros GTC-45 (Hito 1 · Matriz IPEVR (GTC 45)), ATS de la actividad (Hito 5 · Análisis de Trabajo Seguro (ATS)), reportes previos de Actos y Condiciones Inseguras (Hito 6 · Reporte de Actos y Condiciones) y Capacitaciones certificadas (Hito 6 · Programa de Capacitación SG-SST). 2) Desarrolla la investigación integral conforme a la Resolución 1401 de 2007 (5 Porqués + Diagrama de Ishikawa + medidas en Fuente, Medio e Individuo), regístrala en Investigación ATEL (hito7_investigacion_atel) emitiendo el Informe Oficial HTML y despáchalo a LiveEditor, ACPM, Gmail y notificación en WAPPY."
  },
  {
    "presetKey": "preset_drive_atel_inspecciones",
    "presetCategory": "atel_inspecciones",
    "name": "🚨 Triaje de Reportes ATEL (FURAT), Inspecciones de Campo y Actos Inseguros",
    "presetDescription": "Revisa reportes nuevos de accidentes/incidentes laborales (FURAT) y checklists de inspecciones en Google Drive, Gmail o QR de trabajadores, registrándolos en ATEL (Hito 7) y ACPM.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "daily",
    "scheduleConfig": {
      "hour": 7,
      "minute": 30,
      "dayOfWeek": [
        1,
        2,
        3,
        4,
        5
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "30 7 * * 1,2,3,4,5",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_email"
      ],
      "extractors": [
        "extract_drive",
        "extract_gmail"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "consultar_analitica_actos_condiciones"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito7_investigacion_atel",
        "hito4_actos_condiciones"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito7_investigacion_atel": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_report",
            "generateAppReport": true,
            "customInstruction": "Registra nuevos eventos ATEL/incidentes recibidos por Drive o Gmail."
          },
          "tool_hitos_hito4_actos_condiciones": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Asienta hallazgos de listas de chequeo e inspecciones planeadas."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "all"
          },
          "logic_merge_drive_gmail_inspecciones": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Consolida formatos de inspección y reportes de incidentes entrantes desde Drive y Gmail."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Nuevos Reportes ATEL o Inspecciones >= 1?",
            "ifConditionType": "new_external_items",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Compuerta determinista Pre-IA sobre extract_drive y extract_gmail: \"¿Nuevos Reportes ATEL o Inspecciones >= 1?\" [modo: new_external_items]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_drive_gmail_inspecciones",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Drive + Gmail Campo"
          }
        ]
      }
    },
    "prompt": "Clasifica los archivos y correos nuevos detectados en Google Drive (extract_drive) y Gmail (extract_gmail) correspondientes a reportes de incidentes/accidentes o listas de inspección planeada (NTC 4114), enriqueciendo patrones de recurrencia con consultar_analitica_actos_condiciones. Sin inventar eventos: asienta los accidentes/incidentes en Investigación ATEL (hito7_investigacion_atel) y los hallazgos locativos/operativos en Actos y Condiciones Inseguras (Hito 6 · Reporte de Actos y Condiciones), generando tareas correctivas en ACPM y alerta ejecutiva por correo."
  },
  {
    "presetKey": "preset_qr_actos_condiciones_cierre_acpm",
    "presetCategory": "atel_inspecciones",
    "name": "📱 Recepción Instantánea QR en Terreno: Actos y Condiciones Inseguras ➔ Clasificación GTC-45",
    "presetDescription": "Procesa los reportes ciudadanos enviados desde celular vía código QR por operarios y visitantes, clasifica severidad según GTC-45 y escala condiciones de alto potencial.",
    "agentTargetName": "Profesional de Campo SST",
    "scheduleType": "daily",
    "scheduleConfig": {
      "hour": 12,
      "minute": 0,
      "dayOfWeek": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 12 * * 1,2,3,4,5,6",
    "workflowNodes": {
      "trigger": "trigger_qr_worker",
      "triggers": [
        "trigger_qr_worker",
        "schedule_cron"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_analitica_actos_condiciones",
        "pronostico_clima_sst"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_matriz_ipevar",
        "hito4_actos_condiciones"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito2_matriz_ipevar": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Consulta peligros y controles existentes del área reportada según GTC-45."
          },
          "tool_hitos_hito4_actos_condiciones": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_report",
            "generateAppReport": true,
            "customInstruction": "Registra y clasifica el reporte QR en terreno y emite ficha técnica de intervención cuando es crítico."
          },
          "if_router": {
            "ifPlacement": "post_agent",
            "ifConditionLabel": "¿Peligro Crítico / Alto Potencial GTC-45?",
            "ifConditionType": "ai_verdict",
            "ifRuleExpression": "riesgo alto, peligro inminente, nivel I, condición crítica",
            "customInstruction": "Compuerta semántica Post-IA: evalúa el veredicto estructurado del Agente IA ([VEREDICTO_IF: SI] vs [VEREDICTO_IF: NO]) para \"¿Peligro Crítico / Alto Potencial GTC-45?\". Si el veredicto es SI, ejecuta la Rama SÍ (acpm_task, email_report). Si el veredicto es NO, ejecuta únicamente la Rama NO (google_sheets, wappy_notification)."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Recibe el reporte ciudadano enviado por código QR desde terreno y clasifícalo técnicamente según la Guía Técnica Colombiana GTC-45 contrastándolo con la Matriz de Peligros vigente (Hito 1 · Matriz IPEVR (GTC 45)), la recurrencia histórica del área (consultar_analitica_actos_condiciones) y las condiciones climáticas actuales si es a cielo abierto (pronostico_clima_sst). Si la condición o acto subestándar representa peligro crítico, alto potencial de lesión grave o riesgo Nivel I/II sin control eficaz, regístralo en Actos y Condiciones Inseguras (Hito 6 · Reporte de Actos y Condiciones), escala acción correctiva inmediata a ACPM y correo y cierra exactamente con [VEREDICTO_IF: SI]. Si corresponde a una observación preventiva menor o de bajo riesgo ya controlada, deja trazabilidad para Google Sheets/WAPPY y cierra exactamente con [VEREDICTO_IF: NO]."
  },
  {
    "presetKey": "preset_plazo_legal_15dias_res1401_arl",
    "presetCategory": "atel_inspecciones",
    "name": "⏱️ Centinela Legal de 15 Días Calendario (Res. 1401 Art. 4): Investigaciones ATEL y Remisión ARL",
    "presetDescription": "Vigila el contador regresivo de 15 días calendario posteriores a cualquier accidente de trabajo o incidente grave para evitar sanciones por extemporaneidad en la investigación y remisión a la ARL.",
    "agentTargetName": "Abogado Laboral",
    "scheduleType": "daily",
    "scheduleConfig": {
      "hour": 7,
      "minute": 15,
      "dayOfWeek": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "15 7 * * 1,2,3,4,5,6",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito7_investigacion_atel",
        "hito4_comites",
        "hito7_acpm"
      ],
      "outputs": [
        "acpm_task",
        "google_calendar",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito7_investigacion_atel": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae investigaciones ATEL abiertas o sin firmas completas próximas al límite de 15 días calendario."
          },
          "tool_hitos_hito4_comites": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae integrantes activos del COPASST habilitados para integrar el equipo investigador."
          },
          "tool_hitos_hito7_acpm": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica medidas preventivas/correctivas derivadas del accidente."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "24h"
          },
          "logic_approval_radicar_arl_1401": {
            "approverEmail": "lider.sst@empresa.com",
            "customInstruction": "Requiere visto bueno del Representante Legal / Líder SG-SST para cierre y remisión formal a la ARL."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Casos ATEL Abiertos Próximos al Límite 15d?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "abierto, pendiente firma, próximo a vencer, extemporáneo",
            "customInstruction": "Compuerta determinista Pre-IA sobre hito7_investigacion_atel, Hito 3 · COPASST / Vigía de SST y hito7_acpm: \"¿Casos ATEL Abiertos Próximos al Límite 15d?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, google_calendar, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_google_calendar": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_approval_radicar_arl_1401",
            "logicType": "human_approval",
            "title": "Aprobación",
            "subtitle": "Firma Rep. Legal"
          }
        ]
      }
    },
    "prompt": "Audita los expedientes en brecha de Investigación de Accidentes e Incidentes ATEL (hito7_investigacion_atel) frente al plazo legal improrrogable de 15 días calendario del Artículo 4 de la Resolución 1401 de 2007. Verifica conformación y firmas del Equipo Investigador (jefe inmediato, representante COPASST de Hito 3 · COPASST / Vigía de SST, responsable SG-SST y profesional con licencia SST vigente para casos graves/mortales) y plan de acción en ACPM (hito7_acpm). Genera cronograma urgente de cierre en Google Calendar, tarea crítica en ACPM y alerta prioritaria por correo."
  },
  {
    "presetKey": "preset_inspeccion_equipos_alturas_certificados",
    "presetCategory": "atel_inspecciones",
    "name": "🧗 Auditoría de Equipos de Protección Contra Caídas, Eslingas, Arneses y Dotación EPP (Hito 5)",
    "presetDescription": "Inspecciona en Hito 5 la hoja de vida y certificación anual por persona competente/fabricante de arneses, eslingas, líneas de vida, anclajes y EPP contra caídas conforme a la Resolución 4272 de 2021.",
    "agentTargetName": "Especialista en Tareas Críticas",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 6,
      "minute": 45,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "45 6 * * 1",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "scraper_agy_alto_riesgo"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito5_equipos_alturas",
        "hito3_epp"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "positions": {},
        "edges": [],
        "nodeConfigs": {
          "tool_hitos_hito5_equipos_alturas": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "includeLatestReport": false,
            "customInstruction": "Extrae en Hito 5 · Hoja de Vida Equipos de Alturas arneses, eslingas, conectores y líneas de vida con inspección anual vencida o hallazgos de deterioro."
          },
          "tool_hitos_hito3_epp": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "includeLatestReport": false,
            "customInstruction": "Extrae en Hito 5 · Entrega y Seguimiento de EPP cascos con barbuquejo, guantes y elementos de protección contra caídas vencidos o fuera de servicio."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Equipo Contra Caídas o EPP Vencido/Rechazado?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, rechazado, fuera de servicio, sin inspección anual, impacto, sin certificado",
            "customInstruction": "Compuerta determinista Pre-IA sobre scraper_agy_alto_riesgo, Hito 5 · Hoja de Vida Equipos de Alturas y Hito 5 · Entrega y Seguimiento de EPP: \"¿Equipo Contra Caídas o EPP Vencido/Rechazado?\" [modo: critical_findings]. Si existen registros nuevos en brecha (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Evalúa las no conformidades detectadas en Hito 5 · Hoja de Vida Equipos de Alturas, Hito 5 · Entrega y Seguimiento de EPP y la validación de certificados técnicos en portales oficiales (scraper_agy_alto_riesgo) conforme a la Resolución 4272 de 2021. Para todo arnés, eslinga, casco con barbuquejo o anclaje sin aval anual de persona competente/fabricante, vencido o con daño estructural, ordena retiro inmediato de servicio en ACPM y envía dictamen técnico por correo."
  },
  {
    "presetKey": "preset_validacion_ats_tareas_alto_riesgo",
    "presetCategory": "atel_inspecciones",
    "name": "⚡ Auditoría de Calidad de ATS (Análisis de Trabajo Seguro) y Controles Operacionales en Campo",
    "presetDescription": "Verifica que las tareas no rutinarias y de alto riesgo (alturas, espacios confinados, energías peligrosas, caliente, izajes) cuenten con ATS completo, firmas y controles alineados con GTC-45.",
    "agentTargetName": "Especialista en Tareas Críticas",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 30,
      "dayOfWeek": [
        3
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "30 7 * * 3",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito3_ats",
        "hito2_matriz_ipevar",
        "hito3_alturas"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito3_ats": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae Análisis de Trabajo Seguro (ATS) con firmas incompletas o pasos sin controles definidos."
          },
          "tool_hitos_hito2_matriz_ipevar": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae valoración GTC-45 y controles jerárquicos exigidos para tareas críticas."
          },
          "tool_hitos_hito3_alturas": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae permisos de tareas de alto riesgo vinculados."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿ATS Sin Firmas o Peligro Crítico Sin Control?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "incompleto, sin firma, peligro sin control, crítico",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 5 · Análisis de Trabajo Seguro (ATS), Hito 1 · Matriz IPEVR (GTC 45) y Hito 5 · Permiso de Trabajo en Alturas: \"¿ATS Sin Firmas o Peligro Crítico Sin Control?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Audita la calidad técnica de los Análisis de Trabajo Seguro con hallazgos en Hito 5 · Análisis de Trabajo Seguro (ATS) y Hito 5 · Permiso de Trabajo en Alturas frente a la jerarquía de controles establecida en Hito 1 · Matriz IPEVR (GTC 45). Señala tareas críticas (alturas, energías peligrosas, espacios confinados, trabajo en caliente o izajes) con firmas faltantes o controles insuficientes y genera plan correctivo inmediato en ACPM y correo."
  },
  {
    "presetKey": "preset_estadisticas_atel_art30_res0312",
    "presetCategory": "atel_inspecciones",
    "name": "📈 Cálculo Mensual de Los 6 Indicadores Mínimos ATEL (Res. 0312 Art. 30): Frecuencia, Severidad y Mortalidad",
    "presetDescription": "Calcula mensualmente Frecuencia de Accidentalidad, Severidad, Proporción de Accidentes Mortales, Prevalencia e Incidencia de Enfermedad Laboral y Ausentismo por Causa Médica.",
    "agentTargetName": "Analista de Datos SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 4,
      "intervalHours": 4
    },
    "cronExpression": "0 8 4 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": false,
      "hitos": [
        "hito2_perfil_socio",
        "hito7_investigacion_atel",
        "hito1_objetivos",
        "hito7_estadisticas_atel"
      ],
      "outputs": [
        "google_sheets",
        "canvas_doc",
        "email_report"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito7_investigacion_atel": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae total mensual/anual de accidentes de trabajo, severidad y mortalidad."
          },
          "tool_hitos_hito1_objetivos": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae metas máximas tolerables fijadas en los Objetivos del SG-SST."
          },
          "tool_hitos_hito7_estadisticas_atel": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "write_and_report",
            "generateAppReport": true,
            "customInstruction": "Actualiza los 6 indicadores mínimos del Art. 30 Res. 0312 y genera el Informe Oficial HTML."
          },
          "logic_merge_art30_atel": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Unifica denominador de trabajadores activos con eventos ATEL y metas anuales."
          },
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "all",
            "includeLatestReport": false,
            "customInstruction": "Extrae en Hito 2 · Perfil Sociodemográfico el censo activo de trabajadores (cédula, nombre, cargo, área, EPS, ARL y fecha de ingreso) como fuente maestra de contraste."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_art30_atel",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Nómina + ATEL + Metas"
          }
        ],
        "positions": {},
        "edges": []
      }
    },
    "prompt": "Con el denominador real de trabajadores activos (Hito 2 · Perfil Sociodemográfico) y los eventos registrados en Investigaciones ATEL (hito7_investigacion_atel), calcula exactamente los 6 indicadores mínimos del Artículo 30 de la Resolución 0312 de 2019 (aplicando las constantes normativas K = 100 y K = 240.000 según indicador): 1) Frecuencia de accidentalidad, 2) Severidad de accidentalidad, 3) Proporción de accidentes de trabajo mortales, 4) Prevalencia de enfermedad laboral, 5) Incidencia de enfermedad laboral y 6) Ausentismo por causa médica. Compáralos contra Objetivos SST (hito1_objetivos), asienta el corte en Estadísticas ATEL (hito7_estadisticas_atel) y exporta a Google Sheets, LiveEditor y correo."
  },
  {
    "presetKey": "preset_lecciones_aprendidas_atel_difusion",
    "presetCategory": "atel_inspecciones",
    "name": "📣 Generador de Lecciones Aprendidas \"En 1 Página\" Post-Incidente / ATEL ➔ Charla 5 Minutos",
    "presetDescription": "Transforma las investigaciones ATEL cerradas en boletines pedagógicos de Lección Aprendida (Qué pasó, Por qué pasó, Qué nunca debemos repetir) sin exponer datos personales del accidentado.",
    "agentTargetName": "Instructor de Capacitaciones SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 9,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 18,
      "intervalHours": 4
    },
    "cronExpression": "0 9 18 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "cursos_lms",
        "notebooklm"
      ],
      "includeIfNode": false,
      "hitos": [
        "hito7_investigacion_atel",
        "hito5_capacitaciones"
      ],
      "outputs": [
        "canvas_doc",
        "google_slides",
        "email_report"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito7_investigacion_atel": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae causas raíz y controles de investigaciones ATEL e incidentes cerrados."
          },
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Programa sesión de difusión de Lección Aprendida / Charla de 5 Minutos."
          }
        }
      }
    },
    "prompt": "Toma los casos cerrados de Investigación ATEL (hito7_investigacion_atel) y, anonimizando al 100% nombres, cédulas y datos sensibles conforme a la Ley 1581 de 2012, diseña boletines pedagógicos de \"Lección Aprendida en 1 Página\" y guiones de Charlas de 5 Minutos apoyándote en cursos_lms y notebooklm. Registra la actividad de divulgación en el Plan de Capacitación (Hito 6 · Programa de Capacitación SG-SST) y entrega las piezas listas en LiveEditor, Google Slides y correo electrónico."
  },
  {
    "presetKey": "preset_participacion_trabajadores_peligros_ipevar",
    "presetCategory": "atel_inspecciones",
    "name": "🗣️ Buzón Participativo de Peligros Reportados por Trabajadores (Hito 1) ➔ Matriz GTC-45",
    "presetDescription": "Conecta los peligros y sugerencias de mejora reportados directamente por los trabajadores (Estándar 2.11.1 / Art. 2.2.4.6.15 Dec. 1072) con la Matriz IPEVAR y las Oportunidades de Mejora SST.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 11,
      "minute": 0,
      "dayOfWeek": [
        4
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 11 * * 4",
    "workflowNodes": {
      "trigger": "trigger_qr_worker",
      "triggers": [
        "trigger_qr_worker",
        "schedule_cron"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito1_participacion_ipevar",
        "hito2_matriz_ipevar",
        "hito1_oportunidades_sst"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito1_participacion_ipevar": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae reportes participativos de peligros y sugerencias SST enviados por los trabajadores."
          },
          "tool_hitos_hito2_matriz_ipevar": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Incorpora o actualiza peligros validados en la Matriz GTC-45."
          },
          "tool_hitos_hito1_oportunidades_sst": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Registra oportunidades de mejora continua derivadas de la participación."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "if_router": {
            "ifPlacement": "post_agent",
            "ifConditionLabel": "¿Reporte Participativo Requiere Ajuste GTC-45?",
            "ifConditionType": "ai_verdict",
            "ifRuleExpression": "peligro no valorado, sin respuesta al trabajador, riesgo relevante",
            "customInstruction": "Compuerta semántica Post-IA: evalúa el veredicto estructurado del Agente IA ([VEREDICTO_IF: SI] vs [VEREDICTO_IF: NO]) para \"¿Reporte Participativo Requiere Ajuste GTC-45?\". Si el veredicto es SI, ejecuta la Rama SÍ (acpm_task, email_report). Si el veredicto es NO, ejecuta únicamente la Rama NO (wappy_notification)."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Evalúa las participaciones y reportes de peligros enviados por los colaboradores en Participación de Trabajadores IPEVAR (hito1_participacion_ipevar — Estándar 2.11.1 Res. 0312 y Art. 2.2.4.6.15 Dec. 1072). Si existen reportes sin respuesta formal o peligros reales aún no contemplados, propón su valoración en la Matriz GTC-45 (Hito 1 · Matriz IPEVR (GTC 45)) y Oportunidades SST (hito1_oportunidades_sst), abre seguimiento en ACPM, prepara retroalimentación al trabajador/COPASST por correo y cierra exactamente con [VEREDICTO_IF: SI]. Si todas las participaciones ya fueron respondidas y gestionadas, confirma cumplimiento y cierra exactamente con [VEREDICTO_IF: NO]."
  },
  {
    "presetKey": "preset_radar_matriz_legal",
    "presetCategory": "legal_cumplimiento",
    "name": "⚖️ Radar Normativo Semanal MinTrabajo / SUIN-Juriscol ➔ Reglamentos (RIT / RHS) y Estándares 0312",
    "presetDescription": "Busca en vivo en la web nuevas leyes, decretos, resoluciones y circulares del Ministerio del Trabajo aplicables al código CIIU y nivel de riesgo de tu empresa.",
    "agentTargetName": "Abogado Laboral",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 8 * * 1",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_web_search"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito1_rit",
        "hito1_rhs",
        "hito1_diagnostico_0312"
      ],
      "outputs": [
        "acpm_task",
        "google_docs",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "extractor_extract_web_search": {
            "targetUrl": "site:mintrabajo.gov.co OR site:suin-juriscol.gov.co OR site:funcionpublica.gov.co",
            "customInstruction": "Busca decretos, resoluciones y circulares laborales/SST recientes en portales oficiales de Colombia."
          },
          "tool_hitos_hito1_rit": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Lee cláusulas vigentes del Reglamento Interno de Trabajo."
          },
          "tool_hitos_hito1_rhs": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Lee factores de riesgo y normas citadas en el Reglamento de Higiene y Seguridad."
          },
          "tool_hitos_hito1_diagnostico_0312": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Lee cumplimiento del estándar de Matriz Legal en Res. 0312."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "if_router": {
            "ifPlacement": "post_agent",
            "ifConditionLabel": "¿Nueva Norma Oficial Aplicable al CIIU Empresa?",
            "ifConditionType": "ai_verdict",
            "ifRuleExpression": "decreto aplicable, resolución obligatoria, circular mintrabajo, modificación legal",
            "customInstruction": "Compuerta semántica Post-IA: evalúa el veredicto estructurado del Agente IA ([VEREDICTO_IF: SI] vs [VEREDICTO_IF: NO]) para \"¿Nueva Norma Oficial Aplicable al CIIU Empresa?\". Si el veredicto es SI, ejecuta la Rama SÍ (acpm_task, google_docs, email_report). Si el veredicto es NO, ejecuta únicamente la Rama NO (wappy_notification)."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_google_docs": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Contrasta los hallazgos normativos oficiales obtenidos en vivo por extract_web_search (Ministerio del Trabajo, SUIN-Juriscol, Función Pública, MinSalud y MinTransporte) con el código CIIU, tamaño de planta y clase de riesgo ARL provistos por la Memoria de Empresa, así como el estado actual del RIT (hito1_rit), RHS (hito1_rhs) y Estándares Mínimos (hito1_diagnostico_0312). Si existe una ley, decreto, resolución o circular nueva aplicable a la empresa no alertada previamente, redacta boletín jurídico de impacto en Google Docs, crea plan de adecuación en ACPM y cierra exactamente con [VEREDICTO_IF: SI]. Si no se expidieron normas nuevas aplicables en el período, deja constancia de vigilancia legal y cierra exactamente con [VEREDICTO_IF: NO]."
  },
  {
    "presetKey": "preset_licencia_responsable_sgsst_curso50h",
    "presetCategory": "legal_cumplimiento",
    "name": "🎓 Vigilancia de Licencia SST Vigente y Curso Virtual 50h / Reentrenamiento 20h del Responsable SG-SST",
    "presetDescription": "Audita el cumplimiento de los artículos 4, 10 y 17 de la Resolución 0312 de 2019 y Resolución 4927 / Circular 0093 sobre perfil, licencia ocupacional y actualización de 20 horas cada 3 años del líder SG-SST.",
    "agentTargetName": "Abogado Laboral",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 15,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "15 8 1 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito1_responsable",
        "hito1_diagnostico_0312"
      ],
      "outputs": [
        "acpm_task",
        "google_calendar",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito1_responsable": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae acta de asignación, vigencia de Licencia SST decenal y Curso Virtual 50h / actualización trienal 20h."
          },
          "tool_hitos_hito1_diagnostico_0312": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae calificación de los estándares 1.1.1 y 1.1.2 de la Resolución 0312 de 2019."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Licencia SST o Curso 50h/20h <= 60d?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, próximo a vencer, sin licencia, perfil insuficiente, sin curso 20h",
            "customInstruction": "Compuerta determinista Pre-IA sobre hito1_responsable y hito1_diagnostico_0312: \"¿Licencia SST o Curso 50h/20h <= 60d?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, google_calendar, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_google_calendar": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Audita la idoneidad legal del Responsable del SG-SST (hito1_responsable) y su reflejo en el Diagnóstico Res. 0312 (hito1_diagnostico_0312) según el tamaño de planta y clase de riesgo ARL de la empresa (Artículos 4, 10 y 17 de la Resolución 0312 de 2019 y Circular 0093 / Res. 4927 sobre reentrenamiento virtual de 20 horas cada 3 años). Ante vencimientos próximos (<= 60 días), falta de acta firmada o incompatibilidad de perfil profesional, programa renovación en Google Calendar, abre tarea crítica en ACPM y envía dictamen jurídico por correo."
  },
  {
    "presetKey": "preset_autoevaluacion_0312_plan_anual_arl",
    "presetCategory": "legal_cumplimiento",
    "name": "📋 Semáforo Mensual de Autoevaluación de Estándares Mínimos (Res. 0312: <60% Crítico, 60–85% Moderado, >85% Aceptable)",
    "presetDescription": "Evalúa el puntaje real de los Estándares Mínimos Res. 0312 de 2019 y verifica que todo ítem en \"No Cumple\" tenga Plan de Mejoramiento vinculado en ACPM para reporte anual MinTrabajo / ARL.",
    "agentTargetName": "Auditor Interno Calidad SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 20,
      "intervalHours": 4
    },
    "cronExpression": "30 7 20 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito1_diagnostico_0312",
        "hito1_objetivos",
        "hito7_acpm"
      ],
      "outputs": [
        "acpm_task",
        "canvas_doc",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito1_diagnostico_0312": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae puntaje global y estándares calificados como No Cumple o sin evidencia."
          },
          "tool_hitos_hito1_objetivos": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae metas del Plan Anual de Trabajo vinculadas al cierre de brechas 0312."
          },
          "tool_hitos_hito7_acpm": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica si cada estándar incumplido cuenta con acción de mejoramiento activa."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "logic_approval_plan_0312_arl": {
            "approverEmail": "lider.sst@empresa.com",
            "customInstruction": "Solicita visto bueno del Responsable SG-SST antes de oficializar el Plan de Mejoramiento Res. 0312."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Puntaje Res. 0312 <= 85% o Ítem No Cumple?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "no cumple, crítico, moderado, menor a 85%, sin evidencia",
            "customInstruction": "Compuerta determinista Pre-IA sobre hito1_diagnostico_0312, hito1_objetivos y hito7_acpm: \"¿Puntaje Res. 0312 <= 85% o Ítem No Cumple?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, canvas_doc, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_canvas_doc": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_approval_plan_0312_arl",
            "logicType": "human_approval",
            "title": "Aprobación",
            "subtitle": "Aval Plan ARL 0312"
          }
        ]
      }
    },
    "prompt": "Evalúa las brechas detectadas en la Autoevaluación de Estándares Mínimos (hito1_diagnostico_0312) frente a los criterios de los Artículos 27 y 28 de la Resolución 0312 de 2019 (<60% Crítico, 60%–85% Moderadamente Aceptable, >85% Aceptable), cruzándolas con Objetivos SST (hito1_objetivos) y acciones abiertas en ACPM (hito7_acpm). Estructura el Plan de Mejoramiento oficial con actividades concretas, responsable, plazo y recursos para LiveEditor, ACPM y remisión a ARL/Gerencia por correo."
  },
  {
    "presetKey": "preset_vigencia_eleccion_copasst_cocolab_2anos",
    "presetCategory": "legal_cumplimiento",
    "name": "🗳️ Control Legal de Período Bianual (2 Años) de Elección de COPASST / Vigía y COCOLAB",
    "presetDescription": "Audita la fecha de conformación y elección de representantes del empleador y de los trabajadores en COPASST (Dec. 1295 Art. 63) y COCOLAB (Res. 652 y 1356 de 2012) anticipando la convocatoria electoral.",
    "agentTargetName": "Abogado Laboral",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 7,
      "intervalHours": 4
    },
    "cronExpression": "30 8 7 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito4_comites",
        "hito3_cocolab"
      ],
      "outputs": [
        "acpm_task",
        "google_calendar",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito4_comites": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae fecha de elección bianual y miembros principales/suplentes del COPASST o Vigía SST."
          },
          "tool_hitos_hito3_cocolab": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae fecha de conformación bianual e integrantes activos del COCOLAB."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Período Bianual <= 45d o Vacante por Retiro?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, próximo a vencer, vacante, retirado, sin paridad",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 2 · Perfil Sociodemográfico, Hito 3 · COPASST / Vigía de SST y hito3_cocolab: \"¿Período Bianual <= 45d o Vacante por Retiro?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, google_calendar, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_google_calendar": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          },
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "all",
            "includeLatestReport": false,
            "customInstruction": "Extrae en Hito 2 · Perfil Sociodemográfico el censo activo de trabajadores (cédula, nombre, cargo, área, EPS, ARL y fecha de ingreso) como fuente maestra de contraste."
          }
        },
        "positions": {},
        "edges": []
      }
    },
    "prompt": "Verifica la vigencia legal del período bianual (2 años) y la paridad de representantes principales y suplentes en COPASST / Vigía (Hito 3 · COPASST / Vigía de SST — Dec. 1295 Art. 63 y Res. 2013/1986) y Comité de Convivencia Laboral (hito3_cocolab — Res. 652 y 1356 de 2012), contrastando contra la planta activa de trabajadores (Hito 2 · Perfil Sociodemográfico) para detectar vacantes por retiro. Agenda cronograma electoral en Google Calendar, crea tarea en ACPM y envía instructivo de convocatoria por correo."
  },
  {
    "presetKey": "preset_gestion_del_cambio_art26_dec1072",
    "presetCategory": "legal_cumplimiento",
    "name": "🔄 Auditoría de Gestión del Cambio (Dec. 1072 Art. 2.2.4.6.26): Nuevos Procesos, Maquinaria, Sedes o Normas",
    "presetDescription": "Evalúa todos los cambios internos (nuevos cargos, equipos, horarios, remodelaciones) o externos (legislación, evolución del conocimiento SST) verificando su impacto en IPEVAR y capacitación.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 9,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 14,
      "intervalHours": 4
    },
    "cronExpression": "0 9 14 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito5_gestion_cambio",
        "hito2_matriz_ipevar",
        "hito5_capacitaciones"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_docs",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito5_gestion_cambio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae proyectos o cambios internos/externos abiertos sin evaluación de riesgos cerrada."
          },
          "tool_hitos_hito2_matriz_ipevar": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Verifica actualización de peligros GTC-45 asociados al cambio."
          },
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Verifica socialización y entrenamiento al personal impactado por el cambio."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Cambio Abierto Sin Evaluar Peligros GTC-45?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "abierto, sin evaluación, sin capacitación, brecha, vencido",
            "customInstruction": "Compuerta determinista Pre-IA sobre hito5_gestion_cambio, Hito 1 · Matriz IPEVR (GTC 45) y Hito 6 · Programa de Capacitación SG-SST: \"¿Cambio Abierto Sin Evaluar Peligros GTC-45?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_docs, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_docs": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Audita los procesos abiertos en Gestión del Cambio (hito5_gestion_cambio — Artículo 2.2.4.6.26 del Decreto 1072 de 2015) verificando que toda nueva máquina, sede, proceso, horario o cambio normativo cuente con valoración previa en la Matriz GTC-45 (Hito 1 · Matriz IPEVR (GTC 45)) y capacitación al personal impactado (Hito 6 · Programa de Capacitación SG-SST). Genera plan de cierre correctivo en ACPM y reporte ejecutivo por correo para los cambios inconclusos."
  },
  {
    "presetKey": "preset_compras_adquisiciones_criterios_sst_art27",
    "presetCategory": "legal_cumplimiento",
    "name": "🛒 Auditoría de Adquisiciones y Compras Críticas con Especificaciones SST (Dec. 1072 Art. 2.2.4.6.27)",
    "presetDescription": "Garantiza que las compras de maquinaria, sustancias químicas, equipos de alturas y EPP cumplan especificaciones normativas SST antes de su puesta en operación.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 10,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 16,
      "intervalHours": 4
    },
    "cronExpression": "0 10 16 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "consultar_pubchem_quimico"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito5_compras_sst",
        "hito5_equipos_alturas",
        "hito5_registro_quimico"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito5_compras_sst": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae adquisiciones críticas pendientes de aval o especificación normativa SST."
          },
          "tool_hitos_hito5_equipos_alturas": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica certificaciones ANSI/EN/NTC en equipos contra caídas adquiridos."
          },
          "tool_hitos_hito5_registro_quimico": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica existencia de FDS de 16 secciones en insumos químicos comprados."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Compra Crítica Sin Aval Técnico SST?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "sin aval, sin certificación, sin FDS, pendiente, incumplimiento",
            "customInstruction": "Compuerta determinista Pre-IA sobre hito5_compras_sst, hito5_equipos_alturas y hito5_registro_quimico: \"¿Compra Crítica Sin Aval Técnico SST?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Revisa las compras y adquisiciones en brecha detectadas en Compras SST (hito5_compras_sst — Art. 2.2.4.6.27 Dec. 1072), cruzándolas con Equipos de Alturas (hito5_equipos_alturas), Registro Químico (hito5_registro_quimico) y verificación de peligrosidad en PubChem NIH (consultar_pubchem_quimico). Exige ficha técnica certificada ANSI/EN/NTC o FDS SGA previo ingreso a operación mediante tarea en ACPM y notificación al área de Compras."
  },
  {
    "presetKey": "preset_conservacion_documental_20anos_art13",
    "presetCategory": "legal_cumplimiento",
    "name": "🗄️ Auditoría de Conservación Documental por 20 Años (Dec. 1072 Art. 2.2.4.6.13)",
    "presetDescription": "Verifica la integridad de los 4 grupos documentales de conservación obligatoria mínima por 20 años a partir del retiro del trabajador (conceptos EMO, EPP, mediciones/IPEVAR y capacitación).",
    "agentTargetName": "Auditor Interno Calidad SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 11,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 22,
      "intervalHours": 4
    },
    "cronExpression": "0 11 22 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_drive"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_rag_documental"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito3_epp",
        "hito5_capacitaciones"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica trazabilidad de conceptos de aptitud médica de ingreso, periódicos y egreso."
          },
          "tool_hitos_hito3_epp": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica soportes firmados de suministro de Elementos de Protección Personal."
          },
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica registros de formación, entrenamiento e inducción SST."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "logic_merge_retencion_20anos": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Cruza respaldos de Google Drive con expedientes EMO, EPP y Capacitación sujetos a retención de 20 años."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Expediente Incompleto en Retención 20 Años?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "incompleto, sin soporte, faltante, brecha documental",
            "customInstruction": "Compuerta determinista Pre-IA sobre extract_drive, hito2_perfil_socio, Hito 5 · Entrega y Seguimiento de EPP y Hito 6 · Programa de Capacitación SG-SST: \"¿Expediente Incompleto en Retención 20 Años?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_retencion_20anos",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Drive + 3 Series 20a"
          }
        ]
      }
    },
    "prompt": "Audita el cumplimiento del Artículo 2.2.4.6.13 del Decreto 1072 de 2015 (conservación controlada mínima por 20 años contados a partir del retiro del trabajador) contrastando el repositorio en Google Drive (extract_drive) con Perfil Sociodemográfico/EMO (hito2_perfil_socio), Entregas de EPP (Hito 5 · Entrega y Seguimiento de EPP) y Registros de Capacitación (Hito 6 · Programa de Capacitación SG-SST). Detalla los expedientes con soportes faltantes para saneamiento en ACPM y reporte nominal por correo."
  },
  {
    "presetKey": "preset_auditoria_reglamento_interno_rit_rhs_ley2101",
    "presetCategory": "legal_cumplimiento",
    "name": "📜 Revisión Jurídica de RIT y Reglamento de Higiene (RHS): Jornada Laboral (Ley 2101), Acoso y Desconexión",
    "presetDescription": "Audita cláusulas del Reglamento Interno de Trabajo (RIT) y Reglamento de Higiene y Seguridad Industrial (RHS) frente a reducción gradual de jornada (Ley 2101), desconexión laboral (Ley 2191) y riesgos vigentes.",
    "agentTargetName": "Abogado Laboral",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 45,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 9,
      "intervalHours": 4
    },
    "cronExpression": "45 8 9 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_web_search"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": false,
      "hitos": [
        "hito1_rit",
        "hito1_rhs",
        "hito2_matriz_ipevar"
      ],
      "outputs": [
        "canvas_doc",
        "google_docs",
        "email_report"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito1_rit": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae articulado actual del Reglamento Interno de Trabajo."
          },
          "tool_hitos_hito1_rhs": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae riesgos listados y datos empresariales del Reglamento de Higiene y Seguridad."
          },
          "tool_hitos_hito2_matriz_ipevar": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae peligros reales vigentes de la Matriz GTC-45 para contrastar con el RHS."
          }
        },
        "extraAgents": [
          {
            "key": "agent_extra_auditor_rit",
            "agentId": "agent_consultor_sg_sst",
            "agentName": "Auditor Interno Calidad SST",
            "aiModel": "gemini-3.6-flash",
            "roleLabel": "2da IA Revisora Normativa",
            "prompt": "Revisa el dictamen jurídico generado por el Agente #1 y valida que cada cláusula propuesta para el RIT y RHS sea 100% consistente con la Resolución 0312 de 2019, el CST y la Matriz GTC-45 vigente."
          }
        ]
      }
    },
    "prompt": "Ejecuta revisión jurídica integral del Reglamento Interno de Trabajo (hito1_rit) y del Reglamento de Higiene y Seguridad Industrial (hito1_rhs) frente a la jurisprudencia/normativa vigente consultada en extract_web_search: 1) Alineación exacta de los subgrupos de riesgo del RHS con la Matriz GTC-45 actual (Hito 1 · Matriz IPEVR (GTC 45)) y código CIIU; 2) Adecuación del RIT a la reducción progresiva de jornada máxima legal (Ley 2101 de 2021), desconexión laboral (Ley 2191 de 2022), prevención de acoso laboral (Ley 1010 de 2006) y debido proceso disciplinario. Entrega borrador de actualización en LiveEditor, Google Docs y correo."
  },
  {
    "presetKey": "preset_contexto_dofa_partes_interesadas_objetivos",
    "presetCategory": "legal_cumplimiento",
    "name": "🧭 Alineación Estratégica Contexto DOFA + Partes Interesadas ➔ Política y Objetivos SG-SST",
    "presetDescription": "Cruza las fortalezas, debilidades, oportunidades, amenazas (DOFA/CAME) y expectativas de stakeholders con los Objetivos del SG-SST y Oportunidades de Mejora.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 9,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 6,
      "intervalHours": 4
    },
    "cronExpression": "30 9 6 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": false,
      "hitos": [
        "hito1_dofa",
        "hito1_politica_objetivos",
        "hito1_objetivos",
        "hito1_oportunidades_sst"
      ],
      "outputs": [
        "canvas_doc",
        "google_slides",
        "email_report"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito1_dofa": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae análisis de contexto DOFA/CAME y necesidades de partes interesadas."
          },
          "tool_hitos_hito1_politica_objetivos": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae compromisos rectores de la Política SG-SST."
          },
          "tool_hitos_hito1_objetivos": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae objetivos e indicadores medibles vigentes."
          },
          "tool_hitos_hito1_oportunidades_sst": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "generate_report",
            "generateAppReport": true,
            "customInstruction": "Consolida oportunidades estratégicas CAME y genera el Informe Oficial de Alineación."
          },
          "logic_merge_estrategia_dofa": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Cruza fortalezas, debilidades, amenazas y oportunidades con la Política y Objetivos SST."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_estrategia_dofa",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "DOFA + Política + Metas"
          }
        ]
      }
    },
    "prompt": "Cruza el Contexto de la Organización y Partes Interesadas (hito1_dofa), la Política SG-SST (hito1_politica_objetivos) y los Objetivos e Indicadores (hito1_objetivos), verificando que toda debilidad interna o amenaza externa crítica cuente con estrategia CAME y meta medible asociada. Actualiza el portafolio en Oportunidades SST (hito1_oportunidades_sst) y entrega informe ejecutivo en LiveEditor, presentación en Google Slides y resumen por correo."
  },
  {
    "presetKey": "preset_pesv_parque_automotor",
    "presetCategory": "riesgos_vial_quimico",
    "name": "🚗 Control Preoperacional PESV y Vencimientos de SOAT / Tecnomecánica / Licencias (RUNT + SIMIT)",
    "presetDescription": "Audita Hito 1 · Matriz de Riesgos Viales (PESV — Res. 20223040040595), Hito 5 · Hoja de Vida Automotores (PESV) y consultas RUNT/SIMIT vía Antigravity para detectar SOAT, RTM, licencias vencidas o comparendos activos.",
    "agentTargetName": "Coordinador de Seguridad Vial",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 0,
      "dayOfWeek": [
        1,
        5
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 7 * * 1,5",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [
        "scraper_agy_vial_pesv"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito3_matriz_pesv",
        "hito3_vehiculos"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito3_matriz_pesv": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae riesgos viales críticos y controles pendientes en la Matriz PESV (Res. 20223040040595)."
          },
          "tool_hitos_hito3_vehiculos": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae flota automotor y conductores con SOAT, RTM, mantenimiento o licencia vencida / <= 30 días."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "logic_loop_placas_pesv": {
            "batchSize": 25,
            "iterateByField": "placa",
            "customInstruction": "Itera cada vehículo y conductor cruzando vencimientos PESV contra consultas RUNT y SIMIT."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿SOAT / RTM / Licencia <= 30d o Comparendo?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, próximo a vencer, comparendo, multa, falla preoperacional",
            "customInstruction": "Compuerta determinista Pre-IA sobre scraper_agy_vial_pesv, Hito 1 · Matriz de Riesgos Viales (PESV) y Hito 5 · Hoja de Vida Automotores (PESV): \"¿SOAT / RTM / Licencia <= 30d o Comparendo?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_loop_placas_pesv",
            "logicType": "loop",
            "title": "Iterar (Loop)",
            "subtitle": "Por Placa / Licencia"
          }
        ]
      }
    },
    "prompt": "Analiza las alertas viales detectadas en Parque Automotor y Conductores (Hito 5 · Hoja de Vida Automotores (PESV)), Matriz de Riesgos Viales PESV (Hito 1 · Matriz de Riesgos Viales (PESV) — Resolución 20223040040595 de MinTransporte) y consultas oficiales RUNT/SIMIT capturadas por scraper_agy_vial_pesv. Para todo vehículo con SOAT/RTM vencido o <= 30 días y conductor con licencia vencida o comparendos activos, genera orden preventiva de restricción de rodamiento en ACPM y reporte detallado con soportes por correo."
  },
  {
    "presetKey": "preset_quimicos_sga_pubchem",
    "presetCategory": "riesgos_vial_quimico",
    "name": "⚗️ Auditoría de Inventario Químico SGA, Fichas FDS (16 Secciones) y Compatibilidad PubChem NIH",
    "presetDescription": "Cruza el inventario de sustancias químicas (Hito 1 · Matriz de Compatibilidad Química SGA y Hito 5 · Inventario de Productos Químicos) con PubChem (NIH) y el Decreto 1496 de 2018 (SGA) para detectar productos sin FDS, sin etiquetado o con incompatibilidades de almacenamiento.",
    "agentTargetName": "Ingeniero Químico SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 8,
      "intervalHours": 4
    },
    "cronExpression": "30 8 8 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_pubchem_quimico"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_quimicos_sga",
        "hito5_registro_quimico",
        "hito2_matriz_ipevar"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "canvas_doc",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito3_quimicos_sga": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae sustancias sin etiquetado SGA completo o con choques de compatibilidad química."
          },
          "tool_hitos_hito5_registro_quimico": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae productos en uso con FDS faltante o vencida (> 5 años)."
          },
          "tool_hitos_hito2_matriz_ipevar": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae controles de ventilación, contención y EPP para riesgo químico."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Sustancia Sin FDS/SGA o Choque en Bodega?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "sin FDS, incompatible, vencido, sin etiquetado SGA, peligro químico",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 1 · Matriz de Compatibilidad Química (SGA), hito5_registro_quimico y Hito 1 · Matriz IPEVR (GTC 45): \"¿Sustancia Sin FDS/SGA o Choque en Bodega?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (canvas_doc, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_canvas_doc": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Audita las brechas químicas detectadas en Inventario SGA y Compatibilidad (Hito 1 · Matriz de Compatibilidad Química (SGA) — Decreto 1496 de 2018 y Resolución 773 de 2021), Registro Operativo Químico (hito5_registro_quimico) y Matriz GTC-45 (Hito 1 · Matriz IPEVR (GTC 45)), enriqueciendo propiedades toxicológicas y de inflamabilidad/reactividad con PubChem NIH (consultar_pubchem_quimico). Señala choques de Clase ONU en almacenamiento, envases sin etiqueta SGA o FDS vencidas y crea plan correctivo en ACPM y correo."
  },
  {
    "presetKey": "preset_clima_emergencias_alturas",
    "presetCategory": "riesgos_vial_quimico",
    "name": "🌦️ Pronóstico Climático SST Matutino (OpenWeather) y Alerta Operativa para Alturas / Campo",
    "presetDescription": "Consulta cada mañana el clima real (lluvia, tormenta eléctrica, ráfagas de viento, índice UV y estrés térmico) en la ciudad de la empresa y emite controles para Trabajo en Alturas e izajes.",
    "agentTargetName": "Especialista en Riesgo Climático",
    "scheduleType": "daily",
    "scheduleConfig": {
      "hour": 6,
      "minute": 30,
      "dayOfWeek": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "30 6 * * 1,2,3,4,5,6",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "pronostico_clima_sst",
        "buscar_centros_emergencia"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_alturas",
        "hito3_ats",
        "hito6_vulnerabilidad"
      ],
      "outputs": [
        "email_report",
        "acpm_task",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito3_alturas": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Lee permisos de trabajo en alturas programados a cielo abierto."
          },
          "tool_hitos_hito3_ats": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Lee tareas críticas en campo sensibles a condiciones atmosféricas."
          },
          "tool_hitos_hito6_vulnerabilidad": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Lee amenazas hidrometeorológicas calificadas en la sede."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "24h"
          },
          "if_router": {
            "ifPlacement": "post_agent",
            "ifConditionLabel": "¿Tormenta, Viento Fuerte o UV Extremo Hoy?",
            "ifConditionType": "ai_verdict",
            "ifRuleExpression": "tormenta eléctrica, ráfagas fuertes, lluvia intensa, radiación UV extrema",
            "customInstruction": "Compuerta semántica Post-IA: evalúa el veredicto estructurado del Agente IA ([VEREDICTO_IF: SI] vs [VEREDICTO_IF: NO]) para \"¿Tormenta, Viento Fuerte o UV Extremo Hoy?\". Si el veredicto es SI, ejecuta la Rama SÍ (email_report, acpm_task). Si el veredicto es NO, ejecuta únicamente la Rama NO (wappy_notification)."
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Consulta en tiempo real el pronóstico meteorológico SST de la sede activa (pronostico_clima_sst) y los centros médicos de urgencias cercanos (buscar_centros_emergencia), cruzándolos con los Permisos de Alturas (Hito 5 · Permiso de Trabajo en Alturas), ATS de campo (Hito 5 · Análisis de Trabajo Seguro (ATS)) y Vulnerabilidad (Hito 1 · Análisis de Vulnerabilidad). Si pronosticas tormenta eléctrica, lluvias intensas, ráfagas de viento riesgosas para trabajo en alturas/izajes o estrés térmico/UV extremo, emite orden preventiva de suspensión temporal o refuerzo de controles en ACPM y correo matutino y cierra exactamente con [VEREDICTO_IF: SI]. Si el clima es estable y seguro para las labores programadas, emite parte meteorológico verde y cierra exactamente con [VEREDICTO_IF: NO]."
  },
  {
    "presetKey": "preset_vulnerabilidad_plan_emergencias_medevac",
    "presetCategory": "riesgos_vial_quimico",
    "name": "🚒 Revisión de Análisis de Amenazas y Vulnerabilidad (Diamante de Riesgo) + Plan de Emergencias y MEDEVAC",
    "presetDescription": "Evalúa amenazas naturales, tecnológicas y sociales en Hito 1 · Análisis de Vulnerabilidad y sincroniza rutas de evacuación, PONs y centros asistenciales cercanos en Hito 1 · Plan de Emergencias.",
    "agentTargetName": "Comandante de Emergencias SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 9,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 11,
      "intervalHours": 4
    },
    "cronExpression": "0 9 11 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "buscar_centros_emergencia",
        "pronostico_clima_sst"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito6_vulnerabilidad",
        "hito1_plan_emergencias"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "canvas_doc",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito6_vulnerabilidad": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae amenazas naturales, tecnológicas y sociales calificadas como Altas o Críticas en el Diamante de Riesgo."
          },
          "tool_hitos_hito1_plan_emergencias": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica existencia y vigencia de PONs, rutas de evacuación y cadena MEDEVAC."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Amenaza Diamante Alta Sin PON o MEDEVAC Vigente?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "amenaza alta, crítico, sin PON, MEDEVAC desactualizado, vencido",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 1 · Análisis de Vulnerabilidad y hito1_plan_emergencias: \"¿Amenaza Diamante Alta Sin PON o MEDEVAC Vigente?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (canvas_doc, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_canvas_doc": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Contrasta las amenazas críticas del Análisis de Vulnerabilidad (Hito 1 · Análisis de Vulnerabilidad — Art. 2.2.4.6.25 Dec. 1072) con los Procedimientos Operativos Normalizados (PON) y cadena de socorro del Plan de Emergencias (hito1_plan_emergencias), validando hospitales, clínicas y estaciones de bomberos reales cercanos mediante buscar_centros_emergencia y condiciones climáticas con pronostico_clima_sst. Genera las acciones de actualización de PONs/MEDEVAC en ACPM y reporte técnico por correo."
  },
  {
    "presetKey": "preset_matriz_gtc45_controles_criticos",
    "presetCategory": "riesgos_vial_quimico",
    "name": "🎯 Auditoría de Matriz de Peligros GTC-45 (IPEVAR): Riesgos Nivel I (No Aceptables) y Controles de Ingeniería",
    "presetDescription": "Inspecciona la Matriz IPEVAR (GTC-45:2012) identificando peligros con Nivel de Riesgo I (No Aceptable) o Nivel II (Aceptable con Control Específico) que carezcan de intervención en la fuente o medio.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 13,
      "intervalHours": 4
    },
    "cronExpression": "0 8 13 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito2_matriz_ipevar",
        "hito1_participacion_ipevar",
        "hito7_acpm"
      ],
      "outputs": [
        "acpm_task",
        "canvas_doc",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito2_matriz_ipevar": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae peligros GTC-45 en Nivel de Riesgo I (No Aceptable) o Nivel II sin controles en fuente/medio."
          },
          "tool_hitos_hito1_participacion_ipevar": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae peligros reportados por trabajadores pendientes de cierre."
          },
          "tool_hitos_hito7_acpm": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica si cada riesgo Nivel I/II posee plan de intervención activo."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Peligro GTC-45 Nivel I / II Sin Control en Fuente?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "no aceptable, nivel I, crítico, sin control de ingeniería, brecha",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 1 · Matriz IPEVR (GTC 45), hito1_participacion_ipevar y hito7_acpm: \"¿Peligro GTC-45 Nivel I / II Sin Control en Fuente?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, canvas_doc, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_canvas_doc": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Inspecciona los peligros críticos extraídos de la Matriz GTC-45 (Hito 1 · Matriz IPEVR (GTC 45)) junto con Participación de Trabajadores (hito1_participacion_ipevar) y planes en ACPM (hito7_acpm). Evalúa bajo el Artículo 2.2.4.6.24 del Decreto 1072 de 2015 qué riesgos Nivel I (No Aceptables) o Nivel II dependen exclusivamente de EPP sin controles de eliminación, sustitución o ingeniería, y formula el plan técnico de intervención para ACPM, LiveEditor y correo."
  },
  {
    "presetKey": "preset_pesv_fatiga_velocidad_rutas_seguras",
    "presetCategory": "riesgos_vial_quimico",
    "name": "🛣️ Programa de Gestión de Velocidad Segura y Prevención de la Fatiga (PESV Paso 8 / Res. 20223040040595)",
    "presetDescription": "Cruza jornadas de conducción, condiciones climáticas en corredores viales y riesgos críticos de la Matriz PESV para emitir boletín semanal de seguridad vial a conductores.",
    "agentTargetName": "Coordinador de Seguridad Vial",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 6,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "30 6 * * 1",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company"
      ],
      "inputs": [
        "pronostico_clima_sst",
        "buscar_centros_emergencia"
      ],
      "includeIfNode": false,
      "hitos": [
        "hito3_matriz_pesv",
        "hito3_vehiculos",
        "hito5_capacitaciones"
      ],
      "outputs": [
        "canvas_doc",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito3_matriz_pesv": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae rutas y factores de riesgo vial priorizados en el PESV."
          },
          "tool_hitos_hito3_vehiculos": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae flota activa y conductores asignados."
          },
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae capacitaciones de manejo defensivo y seguridad vial."
          },
          "logic_merge_pesv_paso8": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Integra riesgos de ruta PESV, estado de flota y formación vial semanal."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_pesv_paso8",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "PESV + Flota + Clima"
          }
        ]
      }
    },
    "prompt": "Elabora el boletín operativo semanal de los 5 Programas de Gestión de Riesgos Críticos del PESV (Paso 8 de la Resolución 20223040040595: Velocidad Segura, Prevención de la Fatiga, Cero Distracción, Cero Alcohol/Sustancias y Protección de Actores Viales Vulnerables), integrando la Matriz PESV (Hito 1 · Matriz de Riesgos Viales (PESV)), el Parque Automotor (Hito 5 · Hoja de Vida Automotores (PESV)), Capacitaciones viales (Hito 6 · Programa de Capacitación SG-SST), pronóstico climático en ruta (pronostico_clima_sst) y puntos de atención de urgencias (buscar_centros_emergencia). Entrégalo en LiveEditor, correo y notificación WAPPY."
  },
  {
    "presetKey": "preset_vigilancia_carcinogenos_quimicos_res773",
    "presetCategory": "riesgos_vial_quimico",
    "name": "☣️ Vigilancia de Agentes Químicos Carcinógenos, Mutágenos y Tóxicos Crónicos (Res. 773 de 2021 + EMO)",
    "presetDescription": "Cruza las frases H (H340, H350, H360, H372) del inventario químico SGA con los trabajadores expuestos por cargo y sus exámenes médicos periódicos específicos (espirometría, biomarcadores).",
    "agentTargetName": "Ingeniero Químico SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 9,
      "minute": 15,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 17,
      "intervalHours": 4
    },
    "cronExpression": "15 9 17 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_pubchem_quimico",
        "consultar_medlineplus_rehabilitacion"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_quimicos_sga",
        "hito2_condiciones_salud",
        "hito3_epp"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_docs",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito3_quimicos_sga": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae inventario de agentes químicos, números CAS e indicaciones de peligro H."
          },
          "tool_hitos_hito2_condiciones_salud": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae cobertura de vigilancia médica periódica específica (espirometría, biomarcadores)."
          },
          "tool_hitos_hito3_epp": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae suministro de protección respiratoria y dérmica certificada."
          },
          "logic_merge_cmr_res773": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Cruza inventario químico SGA con vigilancia epidemiológica y entregas de EPP respiratorio/dérmico."
          },
          "if_router": {
            "ifPlacement": "post_agent",
            "ifConditionLabel": "¿Exposición a Sustancia CMR Sin Vigilancia Médica?",
            "ifConditionType": "ai_verdict",
            "ifRuleExpression": "carcinógeno, mutágeno, H340, H350, H360, tóxico crónico sin vigilancia",
            "customInstruction": "Compuerta semántica Post-IA: evalúa el veredicto estructurado del Agente IA ([VEREDICTO_IF: SI] vs [VEREDICTO_IF: NO]) para \"¿Exposición a Sustancia CMR Sin Vigilancia Médica?\". Si el veredicto es SI, ejecuta la Rama SÍ (acpm_task, email_report). Si el veredicto es NO, ejecuta únicamente la Rama NO (google_docs, wappy_notification)."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_docs": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_cmr_res773",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "SGA + Salud + EPP"
          }
        ]
      }
    },
    "prompt": "Verifica en el Inventario Químico SGA (Hito 1 · Matriz de Compatibilidad Química (SGA)) apoyándote en PubChem NIH (consultar_pubchem_quimico) y MedlinePlus NIH (consultar_medlineplus_rehabilitacion) qué sustancias presentan clasificación CMR (Carcinógenos, Mutágenos o Tóxicos para la Reproducción: frases H340, H350, H360 o toxicidad específica en órganos diana H372 bajo la Resolución 773 de 2021) y cruza los cargos expuestos con Condiciones de Salud (hito2_condiciones_salud) y protección respiratoria/cutánea en EPP (Hito 5 · Entrega y Seguimiento de EPP). Si detectas exposición sin vigilancia médica específica o sin control adecuado, crea plan prioritario en ACPM y correo y cierra exactamente con [VEREDICTO_IF: SI]. Si no existen brechas frente a agentes CMR, documenta el seguimiento en Google Docs y cierra exactamente con [VEREDICTO_IF: NO]."
  },
  {
    "presetKey": "preset_certificacion_tareas_alto_riesgo_mintrabajo",
    "presetCategory": "riesgos_vial_quimico",
    "name": "🏗️ Verificación Oficial de Certificados de Trabajo en Alturas en Portal MinTrabajo / SENA por Cédula",
    "presetDescription": "Consulta mediante Antigravity la validez real de los certificados de formación y reentrenamiento anual en Trabajo Seguro en Alturas registrados en Hito 2 · Perfil Sociodemográfico y Hito 6 · Programa de Capacitación SG-SST, descargando evidencias PDF/PNG.",
    "agentTargetName": "Especialista en Tareas Críticas",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 6,
      "intervalHours": 4
    },
    "cronExpression": "0 7 6 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_antigravity"
      ],
      "extractors": [
        "scraper_agy_alto_riesgo"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito5_capacitaciones"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "positions": {},
        "edges": [],
        "nodeConfigs": {
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "expiry_only",
            "expiryAuditScope": [
              "alturas"
            ],
            "includeLatestReport": false,
            "selectedFields": [
              "Nombre Completo",
              "Cédula / Documento",
              "Cargo",
              "Área / Proceso",
              "ARL",
              "aplicaCursoAlturas",
              "fechaCursoAlturasAutorizado",
              "estadoCursoAlturasAutorizado",
              "fechaCursoAlturasCoordinador",
              "estadoCursoAlturasCoordinador",
              "motivosVencimientoDetectados"
            ],
            "customInstruction": "Extrae en modo expiry_only (alcance alturas) únicamente trabajadores activos a quienes sí les aplica Trabajo en Alturas (fecha registrada en Autorizado o Coordinador en Hito 2 · Perfil Sociodemográfico) cuyo certificado anual esté vencido o próximo a vencer (<= 30 días)."
          },
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "includeLatestReport": false,
            "customInstruction": "Extrae en Hito 6 · Programa de Capacitación SG-SST programación pendiente de entrenamientos y reentrenamientos anuales de tareas críticas."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "logic_loop_cuadrilla_alturas": {
            "batchSize": 25,
            "iterateByField": "cedula",
            "customInstruction": "Verifica cédula por cédula la validez del certificado en MinTrabajo Centros de Entrenamiento y SENA Sofía Plus."
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Operario con Curso Alturas Vencido o <= 30d?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, próximo a vencer, sin registro en mintrabajo, reentrenamiento pendiente",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 2 · Perfil Sociodemográfico (alcance alturas), scraper_agy_alto_riesgo y Hito 6 · Programa de Capacitación SG-SST: \"¿Operario con Curso Alturas Vencido o <= 30d?\" [modo: critical_findings]. Si existen brechas nuevas (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_loop_cuadrilla_alturas",
            "logicType": "loop",
            "title": "Iterar (Loop)",
            "subtitle": "Por Operario Alturas"
          }
        ]
      }
    },
    "prompt": "Cruza únicamente los trabajadores con certificado o reentrenamiento de Trabajo Seguro en Alturas vencido o próximo a vencer (<= 30 días) en Hito 2 · Perfil Sociodemográfico (exclusivamente cuando aplicaCursoAlturas = \"Sí aplica\") y las brechas de Hito 6 · Programa de Capacitación SG-SST contra las consultas oficiales en MinTrabajo y SENA Sofía Plus capturadas por scraper_agy_alto_riesgo bajo la Resolución 4272 de 2021 (Jefe de Área 8h, Trabajador Autorizado 32h, Reentrenamiento anual 8h, Coordinador 80h). Para cualquier operario con curso o reentrenamiento vencido o sin registro oficial vigente, emite restricción inmediata de ascenso en ACPM y reporte nominal con evidencias PDF/PNG por correo."
  },
  {
    "presetKey": "preset_simulacion_emergencia_gabinete_medevac",
    "presetCategory": "riesgos_vial_quimico",
    "name": "🆘 Ejercicio Mensual de Gabinete y Actualización de Cadena de Socorro MEDEVAC por Sede",
    "presetDescription": "Genera mensualmente un escenario práctico de escritorio (incendio, sismo, derrame químico o emergencia médica grave) adaptado a los peligros reales de la empresa para entrenar líderes de evacuación.",
    "agentTargetName": "Comandante de Emergencias SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 10,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 24,
      "intervalHours": 4
    },
    "cronExpression": "30 10 24 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental"
      ],
      "inputs": [
        "buscar_centros_emergencia"
      ],
      "includeIfNode": false,
      "hitos": [
        "hito1_plan_emergencias",
        "hito6_vulnerabilidad",
        "hito5_capacitaciones"
      ],
      "outputs": [
        "canvas_doc",
        "google_docs",
        "email_report"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito1_plan_emergencias": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae estructura de brigada, rutas de evacuación y PONs de la sede."
          },
          "tool_hitos_hito6_vulnerabilidad": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae amenazas priorizadas en el Diamante de Riesgo."
          },
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Registra el ejercicio mensual de gabinete en el Plan de Capacitación."
          }
        }
      }
    },
    "prompt": "Con base en las amenazas priorizadas del Análisis de Vulnerabilidad (Hito 1 · Análisis de Vulnerabilidad), el Plan de Prevención, Preparación y Respuesta ante Emergencias (hito1_plan_emergencias) y la red real de hospitales/clínicas cercanas (buscar_centros_emergencia), diseña el guion mensual de Ejercicio de Gabinete / Simulacro de Escritorio (cronología minuto a minuto, comando de incidente, primeros auxilios, evacuación y activación MEDEVAC). Regístralo en el Plan de Capacitación (Hito 6 · Programa de Capacitación SG-SST) y entrégalo en LiveEditor, Google Docs y correo."
  },
  {
    "presetKey": "preset_capacitaciones_lms_notebooklm",
    "presetCategory": "gerencia_auditoria",
    "name": "🎓 Avance del Plan Anual de Capacitación SST, Rutas LMS y Material Pedagógico con NotebookLM",
    "presetDescription": "Monitorea el progreso de cursos obligatorios en el LMS de WAPPY, Hito 6 · Programa de Capacitación SG-SST y Rutas de Aprendizaje (Hito 6) frente al censo activo de Hito 2 · Perfil Sociodemográfico, generando cápsulas de refuerzo y recordatorios a trabajadores rezagados.",
    "agentTargetName": "Instructor de Capacitaciones SST",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 9,
      "minute": 0,
      "dayOfWeek": [
        2
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 9 * * 2",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "cursos_lms",
        "notebooklm"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito5_capacitaciones",
        "hito6_ruta_aprendizaje"
      ],
      "outputs": [
        "acpm_task",
        "google_calendar",
        "email_report",
        "canvas_doc",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae ejecución, asistencia y evaluación del Programa Anual de Capacitación SST."
          },
          "tool_hitos_hito6_ruta_aprendizaje": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae brechas de avance en las mallas formativas por cargo."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Cobertura de Capacitación < 85% o Rezagados?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "cobertura menor a 85%, vencido, pendiente evaluación, rezagado",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 2 · Perfil Sociodemográfico, Hito 6 · Programa de Capacitación SG-SST y hito6_ruta_aprendizaje: \"¿Cobertura de Capacitación < 85% o Rezagados?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, google_calendar, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (canvas_doc, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_google_calendar": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_canvas_doc": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          },
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "all",
            "includeLatestReport": false,
            "customInstruction": "Extrae en Hito 2 · Perfil Sociodemográfico el censo activo de trabajadores (cédula, nombre, cargo, área, EPS, ARL y fecha de ingreso) como fuente maestra de contraste."
          }
        },
        "positions": {},
        "edges": []
      }
    },
    "prompt": "Mide el cumplimiento y eficacia del Programa Anual de Capacitación SST (Hito 6 · Programa de Capacitación SG-SST — Art. 2.2.4.6.11 Dec. 1072) y las Rutas de Aprendizaje (hito6_ruta_aprendizaje) frente a la planta activa (Hito 2 · Perfil Sociodemográfico) y el avance en Academia WAPPY LMS (cursos_lms). Para los temas o cargos con cobertura < 85%, genera cápsula de refuerzo pedagógico apoyada en notebooklm, agenda sesión de nivelación en Google Calendar, abre seguimiento en ACPM y envía listado nominal por correo."
  },
  {
    "presetKey": "preset_auditoria_0312_alta_direccion",
    "presetCategory": "gerencia_auditoria",
    "name": "🏛️ Informe Ejecutivo Mensual para Revisión por la Alta Dirección (Dec. 1072 Art. 2.2.4.6.31)",
    "presetDescription": "Consolida las 24 entradas normativas de la Revisión por la Alta Dirección, resultados de Auditoría Interna, cumplimiento Res. 0312 y accidentalidad ATEL en informe ejecutivo y presentación.",
    "agentTargetName": "Sintetizador Ejecutivo Gerencia",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 28,
      "intervalHours": 4
    },
    "cronExpression": "30 7 28 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": false,
      "hitos": [
        "hito1_diagnostico_0312",
        "hito7_estadisticas_atel",
        "hito7_auditoria",
        "hito7_alta_direccion"
      ],
      "outputs": [
        "canvas_doc",
        "google_slides",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito1_diagnostico_0312": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae cumplimiento global y por estándar de la Resolución 0312 de 2019."
          },
          "tool_hitos_hito7_estadisticas_atel": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae accidentalidad, severidad, enfermedad laboral y ausentismo del período."
          },
          "tool_hitos_hito7_auditoria": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae hallazgos y no conformidades de Auditoría Interna."
          },
          "tool_hitos_hito7_alta_direccion": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "write_and_report",
            "generateAppReport": true,
            "customInstruction": "Consolida las 24 entradas del Art. 2.2.4.6.31 Dec. 1072 y emite el Informe Oficial HTML para Alta Dirección."
          },
          "logic_merge_alta_direccion": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Consolida indicadores normativos 0312, siniestralidad ATEL y resultados de auditoría."
          },
          "logic_approval_alta_direccion": {
            "approverEmail": "lider.sst@empresa.com",
            "customInstruction": "Solicita visto bueno del Líder SG-SST antes de despachar el informe oficial a Gerencia General."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_alta_direccion",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "0312 + ATEL + Auditoría"
          },
          {
            "key": "logic_approval_alta_direccion",
            "logicType": "human_approval",
            "title": "Aprobación",
            "subtitle": "Visto Bueno Gerencia"
          }
        ]
      }
    },
    "prompt": "Estructura el Informe Ejecutivo Mensual de Revisión por la Alta Dirección conforme a las 24 entradas obligatorias del Artículo 2.2.4.6.31 del Decreto 1072 de 2015, integrando el Diagnóstico de Estándares Mínimos Res. 0312 (hito1_diagnostico_0312), Estadísticas de Accidentalidad y Ausentismo (hito7_estadisticas_atel) y Auditoría de Cumplimiento (hito7_auditoria). Actualiza el expediente ejecutivo y genera el Informe Oficial HTML en Revisión por la Alta Dirección (hito7_alta_direccion), exportándolo tras Visto Bueno a LiveEditor, Google Slides, correo gerencial y WAPPY."
  },
  {
    "presetKey": "preset_cierre_acciones_acpm_vencidas_kanban",
    "presetCategory": "gerencia_auditoria",
    "name": "📌 Control Semanal de Acciones Preventivas, Correctivas y de Mejora (ACPM — Art. 2.2.4.6.33 y 34)",
    "presetDescription": "Rastrea todas las tareas abiertas en el tablero Kanban ACPM (Hito 7) originadas por inspecciones, ATEL, auditorías o Res. 0312, escalando acciones vencidas sin evidencia de cierre eficaz.",
    "agentTargetName": "Auditor Interno Calidad SST",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 8 * * 1",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito7_acpm",
        "hito7_auditoria",
        "hito1_oportunidades_sst"
      ],
      "outputs": [
        "email_report",
        "google_calendar",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito7_acpm": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae tarjetas ACPM con fecha compromiso vencida o <= 7 días sin soporte de cierre eficaz."
          },
          "tool_hitos_hito7_auditoria": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae no conformidades de auditoría pendientes de verificación."
          },
          "tool_hitos_hito1_oportunidades_sst": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae acciones estratégicas de mejora con retraso."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "7d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Acciones ACPM Vencidas o <= 7d Sin Evidencia?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, atrasado, sin cierre, sin evidencia de eficacia",
            "customInstruction": "Compuerta determinista Pre-IA sobre hito7_acpm, hito7_auditoria y hito1_oportunidades_sst: \"¿Acciones ACPM Vencidas o <= 7d Sin Evidencia?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (email_report, google_calendar) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_calendar": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Audita las acciones Preventivas, Correctivas y de Mejora vencidas o próximas a vencer detectadas en el Centro de Control ACPM (hito7_acpm — Artículos 2.2.4.6.33 y 34 del Decreto 1072 de 2015), cruzadas con Auditoría Interna (hito7_auditoria) y Oportunidades SST (hito1_oportunidades_sst). Agrupa los pendientes por responsable y criticidad, agenda sesión de seguimiento de cierre en Google Calendar y despacha boletín ejecutivo de escalamiento por correo."
  },
  {
    "presetKey": "preset_programa_auditoria_interna_anual_copasst",
    "presetCategory": "gerencia_auditoria",
    "name": "🔍 Preparación y Seguimiento de Auditoría Interna Anual del SG-SST con Participación del COPASST",
    "presetDescription": "Verifica el alcance completo de la Auditoría Interna anual (Art. 2.2.4.6.29 y 30 Dec. 1072), idoneidad e independencia del auditor, participación del COPASST y cierre de No Conformidades.",
    "agentTargetName": "Auditor Interno Calidad SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 9,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 19,
      "intervalHours": 4
    },
    "cronExpression": "30 9 19 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": true,
      "hitos": [
        "hito7_auditoria",
        "hito4_comites",
        "hito7_acpm"
      ],
      "outputs": [
        "acpm_task",
        "canvas_doc",
        "email_report",
        "google_docs",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito7_auditoria": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae fecha de última auditoría anual, alcance y No Conformidades abiertas."
          },
          "tool_hitos_hito4_comites": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Verifica participación de integrantes del COPASST en la planificación y auditoría."
          },
          "tool_hitos_hito7_acpm": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Verifica análisis de causa raíz y cierre de No Conformidades."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿No Conformidad Mayor o Auditoría > 11 Meses?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "no conformidad, auditoría vencida, sin causa raíz, abierto",
            "customInstruction": "Compuerta determinista Pre-IA sobre hito7_auditoria, Hito 3 · COPASST / Vigía de SST y hito7_acpm: \"¿No Conformidad Mayor o Auditoría > 11 Meses?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, canvas_doc, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_docs, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_canvas_doc": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_docs": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        }
      }
    },
    "prompt": "Evalúa el cumplimiento del Programa de Auditoría Anual del SG-SST (hito7_auditoria — Artículos 2.2.4.6.29 y 30 del Decreto 1072 de 2015) con participación del COPASST (Hito 3 · COPASST / Vigía de SST) y trazabilidad de cierre en ACPM (hito7_acpm). Ante auditoría próxima a cumplir 12 meses o No Conformidades abiertas sin cierre verificado, estructura el programa/plan de cierre con análisis de causa raíz en LiveEditor, crea tareas en ACPM y envía alerta ejecutiva por correo."
  },
  {
    "presetKey": "preset_inteligencia_predictiva_hito8_riesgo_360",
    "presetCategory": "gerencia_auditoria",
    "name": "🧠 Motor Predictivo 360° (Hito 8): Cruce Preventivo de Peligros, Actos Inseguros, Salud y ATEL",
    "presetDescription": "Correlaciona patrones de condiciones inseguras recurrentes, ausentismo, vencimientos y riesgos altos para predecir en qué proceso o sede podría ocurrir el próximo evento ATEL.",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 7 * * 1",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_analitica_actos_condiciones",
        "consultar_analitica_psicosocial"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_oraculo_predictivo",
        "hito4_actos_condiciones",
        "hito7_estadisticas_atel",
        "hito8_predictivo"
      ],
      "outputs": [
        "acpm_task",
        "canvas_doc",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito2_oraculo_predictivo": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae alertas tempranas de morbilidad y fatiga por área."
          },
          "tool_hitos_hito4_actos_condiciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae concentración de actos y condiciones inseguras recurrentes."
          },
          "tool_hitos_hito7_estadisticas_atel": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae tasas históricas de frecuencia y severidad por proceso."
          },
          "tool_hitos_hito8_predictivo": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "generate_report",
            "generateAppReport": true,
            "customInstruction": "Registra el pronóstico preventivo 360° y emite el Informe Oficial de Alerta Predictiva."
          },
          "logic_merge_predictivo_4hitos": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Unifica precursores de salud, condiciones subestándar en campo e historial ATEL."
          },
          "if_router": {
            "ifPlacement": "post_agent",
            "ifConditionLabel": "¿Foco Predictivo de Alto Riesgo ATEL Detectado?",
            "ifConditionType": "ai_verdict",
            "ifRuleExpression": "convergencia de precursores, foco crítico, alta probabilidad de accidente",
            "customInstruction": "Compuerta semántica Post-IA: evalúa el veredicto estructurado del Agente IA ([VEREDICTO_IF: SI] vs [VEREDICTO_IF: NO]) para \"¿Foco Predictivo de Alto Riesgo ATEL Detectado?\". Si el veredicto es SI, ejecuta la Rama SÍ (acpm_task, canvas_doc, email_report). Si el veredicto es NO, ejecuta únicamente la Rama NO (wappy_notification)."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_canvas_doc": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_predictivo_4hitos",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "3 Señales Precursoras"
          }
        ]
      }
    },
    "prompt": "Ejecuta correlación predictiva transversal integrando el Oráculo de Salud (hito2_oraculo_predictivo), los reportes de Actos y Condiciones Inseguras (Hito 6 · Reporte de Actos y Condiciones + consultar_analitica_actos_condiciones), el clima psicosocial agregado (consultar_analitica_psicosocial) y las Estadísticas ATEL (hito7_estadisticas_atel). Si identificas un proceso, cargo o sede donde convergen múltiples precursores de siniestralidad, consolida el dictamen en Inteligencia Predictiva SST (hito8_predictivo), genera intervención preventiva anticipada en ACPM y LiveEditor y cierra exactamente con [VEREDICTO_IF: SI]. Si todos los precursores permanecen estables y bajo control, informa estado preventivo óptimo y cierra exactamente con [VEREDICTO_IF: NO]."
  },
  {
    "presetKey": "preset_induccion_reinduccion_anual_art11",
    "presetCategory": "gerencia_auditoria",
    "name": "🔄 Control de Inducción de Ingreso y Reinducción Anual Obligatoria a Todos los Trabajadores (Art. 2.2.4.6.11 Par. 2)",
    "presetDescription": "Audita que el 100% de trabajadores (independiente de su forma de contratación o antigüedad) haya recibido inducción inicial y reinducción anual en SG-SST con evaluación aprobada.",
    "agentTargetName": "Instructor de Capacitaciones SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 30,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 10,
      "intervalHours": 4
    },
    "cronExpression": "30 8 10 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "cursos_lms"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito5_capacitaciones",
        "hito6_ruta_aprendizaje",
        "hito5_contratistas"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae soportes de inducción inicial y fecha de última reinducción anual SST."
          },
          "tool_hitos_hito6_ruta_aprendizaje": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae evaluaciones pendientes en la malla de inducción/reinducción."
          },
          "tool_hitos_hito5_contratistas": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "customInstruction": "Extrae personal contratista permanente pendiente de inducción SST."
          },
          "sub_memory_wappy_memory_antiduplicate": {
            "dedupWindow": "30d"
          },
          "if_router": {
            "ifPlacement": "pre_agent",
            "ifConditionLabel": "¿Trabajador Sin Inducción o Reinducción > 12m?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "sin inducción, reinducción vencida, mayor a 12 meses, contratista sin inducción",
            "customInstruction": "Compuerta determinista Pre-IA sobre Hito 2 · Perfil Sociodemográfico, Hito 6 · Programa de Capacitación SG-SST, hito6_ruta_aprendizaje y hito5_contratistas: \"¿Trabajador Sin Inducción o Reinducción > 12m?\" [modo: critical_findings]. Si existen registros/ítems nuevos que cumplen la condición (>= 1 tras filtro anti-duplicados), activa la Rama SÍ (acpm_task, email_report) e invoca al Agente IA. Si hay 0 novedades (100% al día), corta directo a la Rama NO (google_sheets, wappy_notification) ahorrando el 100% de tokens LLM."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_email_report": {
            "ifBranch": "yes"
          },
          "out_google_sheets": {
            "ifBranch": "no"
          },
          "out_wappy_notification": {
            "ifBranch": "no"
          },
          "tool_hitos_hito2_perfil_socio": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "recordFilterMode": "critical_only",
            "includeLatestReport": false,
            "customInstruction": "Extrae en Hito 2 · Perfil Sociodemográfico el censo activo de trabajadores (cédula, nombre, cargo, área, EPS, ARL y fecha de ingreso) como fuente maestra de contraste."
          }
        },
        "positions": {},
        "edges": []
      }
    },
    "prompt": "Cruza la nómina activa (Hito 2 · Perfil Sociodemográfico) y contratistas permanentes (hito5_contratistas) contra los registros de Capacitación (Hito 6 · Programa de Capacitación SG-SST), Rutas de Aprendizaje (hito6_ruta_aprendizaje) y avance en Academia LMS (cursos_lms) bajo el Parágrafo 2 del Artículo 2.2.4.6.11 del Decreto 1072 de 2015 y Estándar 1.2.2 de la Resolución 0312 de 2019. Genera convocatoria nominal obligatoria en ACPM y correo para todo colaborador sin inducción o con reinducción > 12 meses."
  },
  {
    "presetKey": "preset_briefing_ejecutivo_lunes_tenshi",
    "presetCategory": "gerencia_auditoria",
    "name": "☀️ Briefing Ejecutivo de los Lunes 7:00 AM: Prioridades de la Semana en SG-SST + Agenda Calendar",
    "presetDescription": "Entrega cada lunes a primera hora el resumen ejecutivo de la semana: vencimientos próximos, tareas ACPM críticas, capacitaciones agendadas, clima operativo y reuniones de comités.",
    "agentTargetName": "🐱 Tenshi Avatar (Voz y Orquestador 3D)",
    "scheduleType": "weekly",
    "scheduleConfig": {
      "hour": 7,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 7 * * 1",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company"
      ],
      "inputs": [
        "pronostico_clima_sst"
      ],
      "includeIfNode": false,
      "hitos": [
        "hito7_acpm",
        "hito5_capacitaciones",
        "hito4_comites"
      ],
      "outputs": [
        "email_report",
        "google_calendar",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito7_acpm": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae tareas ACPM prioritarias y vencimientos de la semana."
          },
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae capacitaciones y entrenamientos programados en la semana."
          },
          "tool_hitos_hito4_comites": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae sesiones programadas y compromisos de COPASST / Vigía."
          },
          "logic_merge_briefing_lunes": {
            "mergeStrategy": "append_all",
            "customInstruction": "Consolida prioridades semanales de ACPM, capacitaciones y comités."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_briefing_lunes",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "ACPM + Cap. + Comités"
          }
        ]
      }
    },
    "prompt": "Prepara el Briefing Ejecutivo Semanal de los Lunes 7:00 AM para el Líder SG-SST y la Gerencia: 1) Top 5 acciones críticas de la semana en el Centro de Control ACPM (hito7_acpm), 2) Sesiones formativas agendadas en Capacitaciones (Hito 6 · Programa de Capacitación SG-SST), 3) Compromisos y reuniones del COPASST (Hito 3 · COPASST / Vigía de SST), y 4) Pronóstico climático operativo para tareas en sede/campo (pronostico_clima_sst). Entrégalo de forma ejecutiva y accionable en Gmail, Google Calendar y notificación WAPPY."
  },
  {
    "presetKey": "preset_campana_audiovisual_mensual_autocuidado_flow",
    "presetCategory": "gerencia_auditoria",
    "name": "🎬 Diseño Mensual de Campaña Visual y Cápsula de Autocuidado SST (Google Flow + NotebookLM + Slides)",
    "presetDescription": "Diseña cada mes la campaña preventiva enfocada en el principal riesgo o tendencia de actos inseguros de la empresa, creando guion, presentación y piezas pedagógicas.",
    "agentTargetName": "Productor de Contenidos SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 10,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 1,
      "intervalHours": 4
    },
    "cronExpression": "0 10 1 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental"
      ],
      "inputs": [
        "google_flow",
        "notebooklm",
        "consultar_analitica_actos_condiciones"
      ],
      "includeIfNode": false,
      "hitos": [
        "hito4_actos_condiciones",
        "hito5_capacitaciones",
        "hito6_ruta_aprendizaje"
      ],
      "outputs": [
        "canvas_doc",
        "google_slides",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito4_actos_condiciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae tendencias del mes en actos y condiciones inseguras."
          },
          "tool_hitos_hito5_capacitaciones": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae eje temático mensual del Programa Anual de Capacitación."
          },
          "tool_hitos_hito6_ruta_aprendizaje": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "write_register",
            "appActionMode": "write_and_update",
            "generateAppReport": false,
            "customInstruction": "Publica la cápsula mensual de autocuidado en la Ruta de Aprendizaje."
          }
        }
      }
    },
    "prompt": "Identifica el factor de riesgo o comportamiento inseguro más frecuente del último mes en Actos y Condiciones Inseguras (Hito 6 · Reporte de Actos y Condiciones + consultar_analitica_actos_condiciones) alineado con el Plan de Capacitaciones (Hito 6 · Programa de Capacitación SG-SST). Diseña la Campaña Mensual de Autocuidado SST con guion audiovisual y prompts visuales (google_flow), cápsula pedagógica fundamentada en protocolos internos (notebooklm), actualización en Ruta de Aprendizaje (hito6_ruta_aprendizaje) y entrega en LiveEditor, Google Slides y WAPPY."
  },
  {
    "presetKey": "preset_rendicion_cuentas_anual_responsables_art8",
    "presetCategory": "gerencia_auditoria",
    "name": "🏆 Evaluación Semestral de Rendición de Cuentas en SST por Roles y Jefaturas (Dec. 1072 Art. 2.2.4.6.8 Num. 3)",
    "presetDescription": "Evalúa la rendición de cuentas interna de todos aquellos a quienes se les hayan delegado responsabilidades en el SG-SST (líderes de proceso, COPASST, brigada, coordinador SST).",
    "agentTargetName": "Consultor SG-SST",
    "scheduleType": "monthly",
    "scheduleConfig": {
      "hour": 8,
      "minute": 0,
      "dayOfWeek": [
        1
      ],
      "dayOfMonth": 27,
      "intervalHours": 4
    },
    "cronExpression": "0 8 27 * *",
    "workflowNodes": {
      "trigger": "schedule_cron",
      "triggers": [
        "schedule_cron",
        "trigger_tenshi"
      ],
      "extractors": [],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [],
      "includeIfNode": false,
      "hitos": [
        "hito1_responsable",
        "hito2_perfiles_cargo",
        "hito7_acpm",
        "hito7_alta_direccion"
      ],
      "outputs": [
        "canvas_doc",
        "google_docs",
        "email_report"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "tool_hitos_hito1_responsable": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae indicadores de gestión del Responsable del SG-SST."
          },
          "tool_hitos_hito2_perfiles_cargo": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae responsabilidades específicas en SST asignadas por cargo y jefatura."
          },
          "tool_hitos_hito7_acpm": {
            "hitoRole": "source_read",
            "hitoOperationMode": "read_only",
            "customInstruction": "Extrae porcentaje de cumplimiento de acciones por responsable asignado."
          },
          "tool_hitos_hito7_alta_direccion": {
            "hitoRole": "target_write_report",
            "hitoOperationMode": "audit_and_update",
            "appActionMode": "generate_report",
            "generateAppReport": true,
            "customInstruction": "Consolida el informe oficial de Rendición de Cuentas para la Alta Dirección."
          },
          "logic_merge_rendicion_art8": {
            "mergeStrategy": "union_dedup",
            "customInstruction": "Cruza responsabilidades SST delegadas por cargo contra el desempeño real en ACPM."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_rendicion_art8",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Roles + Cargos + ACPM"
          }
        ]
      }
    },
    "prompt": "En cumplimiento del Artículo 2.2.4.6.8 numeral 3 del Decreto 1072 de 2015 y el Estándar 2.6.1 de la Resolución 0312 de 2019 (Rendición de cuentas interna mínima anual de todos los roles con responsabilidades delegadas en el SG-SST), evalúa el desempeño del Responsable SG-SST (hito1_responsable), las obligaciones SST por jefatura/puesto en Perfiles de Cargo (hito2_perfiles_cargo) y la tasa efectiva de cierre en ACPM (hito7_acpm). Registra el consolidado en Alta Dirección (hito7_alta_direccion) y emite el acta oficial en LiveEditor, Google Docs y correo electrónico."
  }
];

module.exports = {
  SYSTEM_WORKFLOW_PRESETS_VERSION,
  SYSTEM_WORKFLOW_PRESETS_CATALOG,
};
