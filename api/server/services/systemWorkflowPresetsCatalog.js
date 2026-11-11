/**
 * Catálogo Oficial Auditado de 54 Flujos Preestablecidos del Sistema WAPPY SG-SST
 * Cubre las 6 categorías oficiales y los 42 aplicativos activos de los 8 Hitos de Somos SST,
 * 100% libre de nodos en construcción y con bifurcación real Condición Si/No (Rama SÍ vs Rama NO).
 */

const SYSTEM_WORKFLOW_PRESETS_VERSION = '2026.11.10-v54-all-branches-audited';

const SYSTEM_WORKFLOW_PRESETS_CATALOG = [
  {
    "presetKey": "preset_vencimientos_emo_epp",
    "presetCategory": "salud_vencimientos",
    "name": "🩺 Alerta Temprana de Vencimientos: Exámenes Médicos (EMO), Alturas y EPP",
    "presetDescription": "Audita diariamente los expedientes del Hito 2 y Hito 3 para detectar Exámenes Médicos Ocupacionales, cursos de Trabajo en Alturas (Res. 4272) y entregas de EPP vencidos o próximos a vencer (<= 30 días). Si hay vencimientos escala a ACPM + Calendar + Gmail; si todo está vigente registra bitácora limpia en WAPPY.",
    "agentTargetName": "Médico Laboral",
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
      "extractors": [
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "somos_sst_trabajadores",
        "somos_sst_examenes",
        "somos_sst_epp"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito3_epp",
        "hito3_alturas"
      ],
      "outputs": [
        "acpm_task",
        "google_calendar",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿EMO / Alturas / EPP <= 30d?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito2_perfil_socio, hito3_epp, hito3_alturas): \"¿EMO / Alturas / EPP <= 30d?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, google_calendar, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Ejecuta una auditoría preventiva diaria sobre los colaboradores activos de la empresa (extract_sst_workers + somos_sst_examenes + somos_sst_epp) cruzando Hito 2 (Perfil Sociodemográfico y EMO — Res. 2346/2007 y Res. 1918/2009) e Hito 3 (Entregas de EPP y Trabajo Seguro en Alturas — Res. 4272/2021). Identifica exámenes periódicos, reentrenamientos de alturas o dotación/EPP vencidos o a <= 30 días de vencer. Si existen casos reales (Rama SÍ), crea tarea correctiva en ACPM, agenda recordatorio en Google Calendar y envía tabla ejecutiva (Nombre, Cédula, Cargo, Ítem y Fecha) por Gmail; si 0 casos presentan brecha (Rama NO), deja notificación de cumplimiento al 100% en WAPPY sin saturar el correo."
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
      "extractors": [
        "extract_sst_workers",
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_medlineplus_rehabilitacion",
        "somos_sst_trabajadores",
        "somos_sst_examenes"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_owas",
        "hito3_estudio_puesto",
        "hito2_condiciones_salud"
      ],
      "outputs": [
        "acpm_task",
        "somos_sst_update",
        "email_report",
        "canvas_doc",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Casos OWAS >= 3 o Restricción >= 1?",
            "ifConditionType": "numeric_threshold",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito3_owas, hito3_estudio_puesto, hito2_condiciones_salud): \"¿Casos OWAS >= 3 o Restricción >= 1?\" [modo: numeric_threshold]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, somos_sst_update, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (canvas_doc, wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_somos_sst_update": {
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
    "prompt": "Cruza las evaluaciones ergonómicas OWAS (hito3_owas), los Estudios de Puesto de Trabajo (hito3_estudio_puesto) y las Condiciones de Salud / restricciones médicas osteomusculares (hito2_condiciones_salud) de la empresa activa. Consulta guías clínicas basadas en evidencia en consultar_medlineplus_rehabilitacion para cargos con carga física o posturas forzadas. Si detectas niveles de acción OWAS 3 o 4 o trabajadores con restricción vigente sin EPT actualizado (Rama SÍ), registra plan de intervención ergonómica en ACPM y envía dictamen; si no hay hallazgos críticos (Rama NO), consolida boletín preventivo de pausas activas en LiveEditor."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental"
      ],
      "inputs": [
        "consultar_analitica_psicosocial",
        "somos_sst_empresa",
        "rule_reserva_legal"
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
          "if_router": {
            "ifConditionLabel": "¿Riesgo Alto/Muy Alto o Caso CCL?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito4_psicosocial, hito3_cocolab): \"¿Riesgo Alto/Muy Alto o Caso CCL?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, canvas_doc, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_docs, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Bajo estricta confidencialidad de historia clínica y reserva legal (Resolución 2404 de 2019 y Resolución 2764 de 2022), analiza los indicadores agregados por área del aplicativo de Riesgo Psicosocial (hito4_psicosocial), el pulso anímico (consultar_analitica_psicosocial) y el estado de reuniones trimestrales del Comité de Convivencia Laboral COCOLAB (hito3_cocolab). Si existen dominios en riesgo Alto/Muy Alto o actas trimestrales pendientes (Rama SÍ), genera plan de intervención colectiva en ACPM y documento técnico en LiveEditor; de lo contrario (Rama NO), archiva acta mensual de seguimiento de bienestar en Google Docs."
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
        "extract_sst_workers",
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
      "inputs": [
        "somos_sst_trabajadores",
        "google_antigravity"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito7_acpm"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Trabajador Inactivo o Sin ARL?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito2_perfil_socio, hito7_acpm): \"¿Trabajador Inactivo o Sin ARL?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
          "logic_loop_arl_cedulas": {
            "batchSize": 25,
            "customInstruction": "Recorre trabajador por trabajador cruzando certificado ARL y antecedentes."
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
    "prompt": "Toma el listado real de cédulas de trabajadores activos de la empresa (extract_sst_workers) y verifica los resultados capturados por scraper_agy_arl_directo y scraper_agy_antecedentes. Comprueba que cada trabajador cuente con afiliación ARL activa y soportes completos en su expediente sociodemográfico (hito2_perfil_socio). Si detectas alguna cédula sin cobertura ARL activa o inconsistencia documental (Rama SÍ), abre acción inmediata en ACPM y notifica por correo con los soportes adjuntos; si todos están activos y conformes (Rama NO), actualiza la sábana de trazabilidad en Google Sheets y notifica en WAPPY."
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
      "extractors": [
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "somos_sst_examenes",
        "somos_sst_perfiles_cargo",
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
          "if_router": {
            "ifConditionLabel": "¿Recomendación Vencida o Sin Seguimiento?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito2_condiciones_salud, hito2_perfiles_cargo, hito3_estudio_puesto): \"¿Recomendación Vencida o Sin Seguimiento?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, google_calendar, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Revisa en Condiciones de Salud y Exámenes Médicos (hito2_condiciones_salud + somos_sst_examenes) todos los casos activos con restricciones o recomendaciones médico-laborales y compáralos contra el Perfil del Cargo (hito2_perfiles_cargo) y Estudio de Puesto (hito3_estudio_puesto). Verifica fechas de control médico y cumplimiento de ajustes razonables. Si hay recomendaciones vencidas o sin acta de socialización al jefe inmediato (Rama SÍ), agenda cita de control en Google Calendar, crea tarea ACPM y envía alerta; si todos los casos están bajo control vigente (Rama NO), registra constancia en WAPPY."
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
      "extractors": [
        "extract_sst_workers",
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "somos_sst_trabajadores",
        "somos_sst_examenes",
        "subagent_analista_ausentismo"
      ],
      "includeIfNode": false,
      "hitos": [
        "hito2_oraculo_predictivo",
        "hito2_condiciones_salud",
        "hito8_predictivo"
      ],
      "outputs": [
        "canvas_doc",
        "google_sheets",
        "email_report"
      ],
      "canvasLayout": {
        "nodeConfigs": {}
      }
    },
    "prompt": "Ejecuta un corte analítico mensual de ausentismo médico y morbilidad sentida cruzando el Oráculo de Condiciones de Salud (hito2_oraculo_predictivo), Condiciones de Salud (hito2_condiciones_salud) e Inteligencia Predictiva SST (hito8_predictivo). Calcula indicadores de frecuencia, severidad e proporción de ausentismo por sistema afectado (osteomuscular, respiratorio, psicosocial, digestivo) y propone metas para los Programas de Vigilancia Epidemiológica (PVE) en un informe ejecutivo para LiveEditor, Google Sheets y correo."
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
      "extractors": [
        "extract_sst_workers",
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "somos_sst_trabajadores",
        "somos_sst_epp",
        "somos_sst_examenes"
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
          "if_router": {
            "ifConditionLabel": "¿Esquema Incompleto o Bio-Riesgo Alto?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito4_bio_ipevar, hito3_epp, hito2_condiciones_salud): \"¿Esquema Incompleto o Bio-Riesgo Alto?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_docs, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Evalúa la Matriz de Riesgo Biológico Bio-IPEVAR (hito4_bio_ipevar) junto con las entregas de EPP de bioseguridad (hito3_epp) y esquemas de inmunización registrados en Condiciones de Salud (hito2_condiciones_salud). Identifica trabajadores expuestos sin refuerzo vigente de vacunación ocupacional o controles de contención pendientes. Si existen brechas de bioseguridad (Rama SÍ), crea plan correctivo en ACPM y alerta por correo; si todo el personal expuesto cumple (Rama NO), actualiza el acta de seguimiento en Google Docs."
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
        "trigger_qr_worker"
      ],
      "extractors": [
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "somos_sst_epp",
        "somos_sst_perfiles_cargo",
        "matriz_ipevar"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_epp",
        "hito2_perfiles_cargo",
        "hito5_compras_sst"
      ],
      "outputs": [
        "acpm_task",
        "somos_sst_update",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Trabajador Sin EPP del Cargo o Vencido?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito3_epp, hito2_perfiles_cargo, hito5_compras_sst): \"¿Trabajador Sin EPP del Cargo o Vencido?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, somos_sst_update, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_somos_sst_update": {
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
    "prompt": "Cruza la matriz de EPP requeridos por cargo (hito2_perfiles_cargo + matriz_ipevar) contra el historial real de entregas firmadas por trabajador en el aplicativo de EPP (hito3_epp) y especificaciones técnicas de Compras SST (hito5_compras_sst, normas ANSI/NIOSH/ NTC). Si detectas trabajadores activos sin entrega registrada de EPP obligatorio o con reposición vencida (Rama SÍ), genera requerimiento de compra/entrega en ACPM y envía listado nominal por correo; si el 100% cuenta con EPP vigente (Rama NO), actualiza control de inventario en Google Sheets."
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
        "trigger_email"
      ],
      "extractors": [
        "extract_sst_workers",
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
        "somos_sst_trabajadores",
        "somos_sst_examenes",
        "somos_sst_perfiles_cargo"
      ],
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
          "if_router": {
            "ifConditionLabel": "¿Ingreso/Cambio Sin EMO Registrado?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito2_perfil_socio, hito2_perfiles_cargo, hito5_gestion_cambio): \"¿Ingreso/Cambio Sin EMO Registrado?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Audita las fechas de ingreso, cambios de cargo (hito5_gestion_cambio) y novedades de personal (extract_sst_workers + extract_gmail) frente a los Exámenes Médicos Ocupacionales registrados en Hito 2 (hito2_perfil_socio + somos_sst_examenes) y los exámenes exigidos por el profesiograma del Perfil de Cargo (hito2_perfiles_cargo). Si algún trabajador ingresó o cambió de actividad sin concepto médico ocupacional soporte (Rama SÍ), crea alerta prioritaria en ACPM y envía correo a Talento Humano / SST; si la conciliación está en cero brechas (Rama NO), notifica cumplimiento en WAPPY."
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
        "trigger_tenshi",
        "trigger_email"
      ],
      "extractors": [
        "extract_drive",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "google_drive",
        "google_sheets",
        "somos_sst_trabajadores"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito2_condiciones_salud"
      ],
      "outputs": [
        "somos_sst_update",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Archivos Nuevos en Carpeta Drive?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito2_perfil_socio, hito2_condiciones_salud): \"¿Archivos Nuevos en Carpeta Drive?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (somos_sst_update, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_somos_sst_update": {
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
    "prompt": "Conéctate a Google Drive (extract_drive + google_drive) y revisa la carpeta de \"Perfil Sociodemográfico y Exámenes Médicos\" comparando contra la Memoria Anti-Duplicados y la base actual de trabajadores (extract_sst_workers). Sin inventar datos: si existen hojas de cálculo o PDFs reales nuevos/modificados (Rama SÍ), actualiza los expedientes correspondientes en Hito 2 (hito2_perfil_socio y hito2_condiciones_salud) y envía resumen de cédulas sincronizadas por correo; si no hay archivos nuevos o Drive no reporta cambios (Rama NO), registra chequeo silencioso en WAPPY."
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
        "extract_drive",
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "google_antigravity",
        "google_drive",
        "somos_sst_empresa"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito1_diagnostico_0312",
        "hito2_perfil_socio",
        "hito7_acpm"
      ],
      "outputs": [
        "somos_sst_update",
        "google_sheets",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Soportes Locales Pendientes de Cargar?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito1_diagnostico_0312, hito2_perfil_socio, hito7_acpm): \"¿Soportes Locales Pendientes de Cargar?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (somos_sst_update, google_sheets, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_somos_sst_update": {
            "ifBranch": "yes"
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
          "logic_merge_local_drive_sst": {
            "customInstruction": "Unifica soportes de Carpeta Local Mac/PC, Google Drive y Somos SST."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_local_drive_sst",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "PC + Drive + SST"
          }
        ]
      }
    },
    "prompt": "Inspecciona los soportes documentales detectados en la carpeta local del equipo vía Antigravity (extract_pc_folder) y en Google Drive (extract_drive), cruzándolos con el estado actual del Diagnóstico Res. 0312 (hito1_diagnostico_0312), Perfil Sociodemográfico (hito2_perfil_socio) y Plan ACPM (hito7_acpm). Si hay evidencias nuevas listas para asentar o brechas documentales (Rama SÍ), sincroniza en Somos SST, actualiza matriz de control en Google Sheets y envía resumen; si todo está conciliado (Rama NO), envía notificación en WAPPY."
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
        "extract_drive",
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental"
      ],
      "inputs": [
        "google_drive",
        "somos_sst_empresa"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito1_politica_objetivos",
        "hito1_objetivos",
        "hito1_rhs",
        "hito1_rit"
      ],
      "outputs": [
        "somos_sst_update",
        "acpm_task",
        "email_report",
        "google_docs",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Versión Anual Vencida o Sin Firma?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito1_politica_objetivos, hito1_objetivos, hito1_rhs, hito1_rit): \"¿Versión Anual Vencida o Sin Firma?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (somos_sst_update, acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_docs, wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_somos_sst_update": {
            "ifBranch": "yes"
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
    "prompt": "Revisa en Google Drive los documentos rectores firmados del Hito 1 y compáralos con Política SST (hito1_politica_objetivos, Art. 2.2.4.6.5–7 Dec. 1072), Objetivos y Metas (hito1_objetivos), Reglamento de Higiene y Seguridad Industrial (hito1_rhs, Art. 349 CST) y Reglamento Interno de Trabajo (hito1_rit). Verifica vigencia anual, fecha y firma del Representante Legal. Si detectas documentos desactualizados o versiones nuevas en Drive por sincronizar (Rama SÍ), actualiza Somos SST y abre tarea ACPM; si están vigentes y firmados (Rama NO), deja constancia de revisión documental en Google Docs y WAPPY."
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
      "trigger": "trigger_email",
      "triggers": [
        "trigger_email",
        "schedule_cron"
      ],
      "extractors": [
        "extract_gmail",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "google_gmail",
        "somos_sst_trabajadores",
        "somos_sst_examenes"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_condiciones_salud",
        "hito7_estadisticas_atel"
      ],
      "outputs": [
        "somos_sst_update",
        "google_sheets",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Nuevas Incapacidades >= 1?",
            "ifConditionType": "numeric_threshold",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito2_condiciones_salud, hito7_estadisticas_atel): \"¿Nuevas Incapacidades >= 1?\" [modo: numeric_threshold]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (somos_sst_update, google_sheets, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_somos_sst_update": {
            "ifBranch": "yes"
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
    "prompt": "Filtra en Gmail (extract_gmail) los correos recientes relacionados con incapacidades médicas, hospitalizaciones o conceptos de EPS/ARL, validando contra la Memoria Anti-Duplicados para no procesar dos veces el mismo radicado. Si existen incapacidades reales nuevas (Rama SÍ), cruza la cédula con extract_sst_workers, actualiza el seguimiento en Condiciones de Salud (hito2_condiciones_salud) e indicadores (hito7_estadisticas_atel), registra fila contable en Google Sheets y notifica a Nómina/SST por correo (resguardando diagnóstico sensible según reserva legal); si no llegaron correos nuevos (Rama NO), finaliza con notificación breve en WAPPY."
  },
  {
    "presetKey": "preset_drive_fds_quimicos_sincronizacion",
    "presetCategory": "drive_sincronizacion",
    "name": "🧪 Sincronización Carpeta Drive \"FDS Químicos\" ➔ Inventario SGA y Registro Químico",
    "presetDescription": "Detecta nuevas Fichas de Datos de Seguridad (FDS de 16 secciones en PDF) subidas a Google Drive, extrae CAS, pictogramas SGA y controles, y actualiza los aplicativos químicos de Hito 3 y Hito 5.",
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
        "extract_drive",
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "google_drive",
        "matriz_compatibilidad",
        "consultar_pubchem_quimico"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_quimicos_sga",
        "hito5_registro_quimico"
      ],
      "outputs": [
        "somos_sst_update",
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Nueva FDS PDF o FDS > 5 Años?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito3_quimicos_sga, hito5_registro_quimico): \"¿Nueva FDS PDF o FDS > 5 Años?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (somos_sst_update, acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_somos_sst_update": {
            "ifBranch": "yes"
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
    "prompt": "Explora la carpeta de Fichas de Datos de Seguridad (FDS / MSDS) en Google Drive (extract_drive) y contrástala con el Inventario Químico SGA (hito3_quimicos_sga, Decreto 1496 de 2018) y el Registro Operativo de Sustancias (hito5_registro_quimico). Complementa número CAS y peligrosidad con consultar_pubchem_quimico. Si hay PDFs nuevos por indexar o FDS con antigüedad > 5 años (Rama SÍ), actualiza el inventario en Somos SST, crea tarea ACPM y envía reporte técnico; si no hay cambios pendientes (Rama NO), deja constancia en WAPPY."
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
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "google_drive",
        "google_gmail",
        "subagent_validador_seguridad_social"
      ],
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
          "if_router": {
            "ifConditionLabel": "¿Contratista Con Mora o Soporte Faltante?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito5_contratistas, hito5_compras_sst): \"¿Contratista Con Mora o Soporte Faltante?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
          "logic_merge_contratistas_pila": {
            "customInstruction": "Unifica planillas PILA y soportes recibidos por Google Drive y Gmail."
          },
          "logic_approval_bloqueo_contratista": {
            "approverEmail": "lider.sst@empresa.com",
            "customInstruction": "Solicita confirmación humana antes de bloquear ingreso de contratista en mora."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_contratistas_pila",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "Drive + Gmail PILA"
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
    "prompt": "Audita los soportes mensuales recibidos en Google Drive y Gmail para empresas contratistas y subcontratistas registrados en Gestión de Contratistas (hito5_contratistas) y Compras SST (hito5_compras_sst, Art. 2.2.4.6.28 Dec. 1072). Verifica planilla PILA del mes vigente, afiliación ARL según clase de riesgo de la actividad e inducción SST. Si algún contratista activo presenta documentos faltantes o vencidos (Rama SÍ), bloquea preventivamente con tarea en ACPM y envía requerimiento por correo; si todos cumplen al 100% (Rama NO), actualiza matriz de habilitación en Google Sheets y notifica en WAPPY."
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
        "extract_drive",
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental"
      ],
      "inputs": [
        "google_drive",
        "subagent_redactor_actas",
        "somos_sst_empresa"
      ],
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
        "nodeConfigs": {}
      }
    },
    "prompt": "Consulta la conformación, vigencia y compromisos de los comités paritarios en Conformación de Comités COPASST / Vigía (hito4_comites, Res. 2013 de 1986), Comité de Convivencia Laboral COCOLAB (hito3_cocolab) y compromisos abiertos en ACPM (hito7_acpm), cruzando con las actas firmadas en Google Drive. Redacta el corte mensual de gestión de comités con estado de quórum, compromisos cumplidos y orden del día sugerido para la siguiente sesión, exportándolo a LiveEditor, Google Docs y correo."
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
      "extractors": [
        "extract_sst_app",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company"
      ],
      "inputs": [
        "google_sheets",
        "somos_sst_empresa",
        "somos_sst_trabajadores"
      ],
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
        "nodeConfigs": {}
      }
    },
    "prompt": "Extrae las métricas reales en vivo de Diagnóstico Res. 0312 (hito1_diagnostico_0312), Objetivos e Indicadores SST (hito1_objetivos — indicadores de Estructura, Proceso y Resultado según Art. 2.2.4.6.19–22 Dec. 1072), Estadísticas ATEL (hito7_estadisticas_atel) y porcentaje de cierre del Kanban ACPM (hito7_acpm). Consolida una tabla limpia y estructurada lista para Google Sheets y envía notificación ejecutiva en WAPPY."
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
      "extractors": [
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "webhook_api",
        "somos_sst_trabajadores",
        "somos_sst_perfiles_cargo"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito2_perfil_socio",
        "hito2_perfiles_cargo",
        "hito5_capacitaciones"
      ],
      "outputs": [
        "somos_sst_update",
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Nuevo Ingreso Sin Inducción SST?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito2_perfil_socio, hito2_perfiles_cargo, hito5_capacitaciones): \"¿Nuevo Ingreso Sin Inducción SST?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (somos_sst_update, acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_somos_sst_update": {
            "ifBranch": "yes"
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
    "prompt": "Procesa el payload recibido por Webhook de RRHH/Nómina o el barrido diario de novedades de personal (extract_sst_workers). Verifica que cada trabajador recién vinculado esté creado en Perfil Sociodemográfico (hito2_perfil_socio), tenga asignado su Perfil de Cargo (hito2_perfiles_cargo) y cuente con programación de Inducción SG-SST (hito5_capacitaciones, Art. 2.2.4.6.11 Dec. 1072). Si detectas nuevos ingresos pendientes de inducción o examen (Rama SÍ), actualiza Somos SST, crea tarea en ACPM y notifica por correo; si no hay pendientes (Rama NO), confirma sincronización en WAPPY."
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
        "extract_drive",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "somos_sst_perfiles_cargo",
        "somos_sst_epp",
        "somos_sst_examenes"
      ],
      "includeIfNode": false,
      "hitos": [
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
        "nodeConfigs": {}
      }
    },
    "prompt": "Cuando el usuario ordene por voz o chat a Tenshi IA investigar un accidente de trabajo: 1) Extrae el FURAT de la carpeta \"Accidentes\" en Google Drive (extract_drive) y el expediente 360° del trabajador (extract_sst_workers). 2) Cruza en Somos SST la Matriz de Peligros GTC-45 (hito2_matriz_ipevar), ATS de la tarea (hito3_ats), reportes previos de Actos y Condiciones Inseguras (hito4_actos_condiciones), Capacitaciones recibidas (hito5_capacitaciones), Perfil del Cargo, EPP y EMO. 3) Ejecuta el análisis causal bajo la Resolución 1401 de 2007 (5 Porqués + Espina de Pescado Ishikawa: Causas Inmediatas y Causas Básicas), regístralo en Investigación ATEL (hito7_investigacion_atel), abre plan de acción ACPM, redacta el informe formal en LiveEditor y envíalo por Gmail y a Tenshi."
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
        "trigger_email",
        "trigger_qr_worker"
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
        "google_drive",
        "google_gmail",
        "consultar_analitica_actos_condiciones"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito7_investigacion_atel",
        "hito4_actos_condiciones",
        "hito7_acpm"
      ],
      "outputs": [
        "somos_sst_update",
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Palabra FURAT / Accidente / Grave?",
            "ifConditionType": "keyword_match",
            "ifRuleExpression": "furat, accidente, incidente, grave, mortal, insegur",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito7_investigacion_atel, hito4_actos_condiciones, hito7_acpm): \"¿Palabra FURAT / Accidente / Grave?\" [modo: keyword_match]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (somos_sst_update, acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_somos_sst_update": {
            "ifBranch": "yes"
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
    "prompt": "Revisa en Google Drive (extract_drive) y Gmail (extract_gmail) los archivos recientes de FURAT/ATEL, Inspecciones de Seguridad y Reportes QR de Actos y Condiciones Inseguras, sin inventar registros si no hay novedades reales. Si detectas accidentes, incidentes o condiciones subestándar nuevas (Rama SÍ), asienta el evento en Investigación ATEL (hito7_investigacion_atel) o Actos y Condiciones (hito4_actos_condiciones), crea acción correctiva en ACPM (hito7_acpm) y notifica por correo; si no hay reportes nuevos (Rama NO), deja confirmación silenciosa en WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "consultar_analitica_actos_condiciones",
        "matriz_ipevar"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito4_actos_condiciones",
        "hito2_matriz_ipevar",
        "hito7_acpm"
      ],
      "outputs": [
        "acpm_task",
        "somos_sst_update",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Condición Severidad Alta / Grave?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito4_actos_condiciones, hito2_matriz_ipevar, hito7_acpm): \"¿Condición Severidad Alta / Grave?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, somos_sst_update, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_somos_sst_update": {
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
    "prompt": "Analiza los reportes abiertos en el aplicativo de Actos y Condiciones Inseguras (hito4_actos_condiciones + consultar_analitica_actos_condiciones) y compáralos con los controles definidos en la Matriz de Peligros GTC-45 (hito2_matriz_ipevar). Si existen condiciones subestándar de severidad alta o repetitivas en una misma área sin cierre (Rama SÍ), genera acción correctiva prioritaria en ACPM (hito7_acpm), sugiere ajuste de controles en Somos SST y alerta por correo; si solo hay observaciones menores ya gestionadas (Rama NO), consolida trazabilidad en Google Sheets y WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "somos_sst_empresa",
        "google_calendar"
      ],
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
          "if_router": {
            "ifConditionLabel": "¿Casos Abiertos >= 1 Próximos a 15d?",
            "ifConditionType": "numeric_threshold",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito7_investigacion_atel, hito4_comites, hito7_acpm): \"¿Casos Abiertos >= 1 Próximos a 15d?\" [modo: numeric_threshold]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, google_calendar, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
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
          "logic_approval_radicar_arl_1401": {
            "approverEmail": "lider.sst@empresa.com",
            "customInstruction": "Requiere visto bueno del Representante Legal / Líder SST antes de radicar investigación Res. 1401."
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
    "prompt": "Audita todos los casos registrados en Investigación de Accidentes e Incidentes ATEL (hito7_investigacion_atel) verificando la fecha del evento frente al plazo perentorio de 15 días calendario del Artículo 4 de la Resolución 1401 de 2007, la firma del equipo investigador (jefe inmediato, COPASST de hito4_comites y responsable SG-SST) y para accidentes graves/mortales la firma de profesional con licencia SST vigente. Si algún caso lleva >= 8 días abierto o carece de firmas/plan de acción (Rama SÍ), bloquea agenda en Google Calendar, crea alerta urgente en ACPM y envía correo prioritario; si no hay investigaciones pendientes (Rama NO), notifica cero pendientes en WAPPY."
  },
  {
    "presetKey": "preset_inspeccion_equipos_alturas_certificados",
    "presetCategory": "atel_inspecciones",
    "name": "🧗 Auditoría de Equipos de Protección Contra Caídas, Eslingas, Arneses y Permisos de Alturas",
    "presetDescription": "Inspecciona la hoja de vida y certificación anual por persona competente/fabricante de arneses, eslingas, líneas de vida y anclajes conforme a la Resolución 4272 de 2021.",
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
        "trigger_qr_worker"
      ],
      "extractors": [
        "extract_sst_app",
        "scraper_agy_alto_riesgo"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "somos_sst_trabajadores",
        "somos_sst_epp"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito5_equipos_alturas",
        "hito3_alturas",
        "hito3_ats"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Equipo Sin Inspección Anual o Rechazado?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito5_equipos_alturas, hito3_alturas, hito3_ats): \"¿Equipo Sin Inspección Anual o Rechazado?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Audita el inventario de Equipos de Protección Contra Caídas (hito5_equipos_alturas), los Permisos de Trabajo en Alturas (hito3_alturas), los ATS asociados (hito3_ats) y la vigencia de certificados de entrenamiento en alturas (scraper_agy_alto_riesgo) bajo la Resolución 4272 de 2021. Identifica equipos con inspección anual vencida, impacto registrado o hallazgos preoperacionales que obliguen a retirarlos de servicio. Si detectas equipos o certificados no conformes (Rama SÍ), crea orden inmediata de bloqueo/reposición en ACPM y alerta por correo; si todo el sistema contra caídas está certificado (Rama NO), actualiza hoja de control en Google Sheets y WAPPY."
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
        "trigger_qr_worker"
      ],
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "matriz_ipevar",
        "somos_sst_epp"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_ats",
        "hito2_matriz_ipevar",
        "hito3_alturas"
      ],
      "outputs": [
        "acpm_task",
        "somos_sst_update",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿ATS Incompleto o Peligro Sin Control?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito3_ats, hito2_matriz_ipevar, hito3_alturas): \"¿ATS Incompleto o Peligro Sin Control?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, somos_sst_update, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_somos_sst_update": {
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
    "prompt": "Revisa los Análisis de Trabajo Seguro registrados en Hito 3 (hito3_ats) y Permisos de Alturas (hito3_alturas), contrastando cada paso de la tarea con los peligros y controles jerárquicos (eliminación, sustitución, ingeniería, administrativos y EPP) de la Matriz GTC-45 (hito2_matriz_ipevar). Si encuentras ATS sin firmas de ejecutantes/emisor o peligros críticos no contemplados en la Matriz IPEVAR (Rama SÍ), crea tarea correctiva en ACPM, sugiere actualización en Somos SST y notifica por correo; si todos los ATS cumplen estándar técnico (Rama NO), registra validación en WAPPY."
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
      "extractors": [
        "extract_sst_app",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "somos_sst_empresa",
        "somos_sst_trabajadores",
        "subagent_analista_ausentismo"
      ],
      "includeIfNode": false,
      "hitos": [
        "hito7_estadisticas_atel",
        "hito7_investigacion_atel",
        "hito1_objetivos"
      ],
      "outputs": [
        "somos_sst_update",
        "google_sheets",
        "canvas_doc",
        "email_report"
      ],
      "canvasLayout": {
        "nodeConfigs": {}
      }
    },
    "prompt": "Con base en el número real de trabajadores activos (extract_sst_workers) y los eventos registrados en Estadísticas ATEL (hito7_estadisticas_atel) e Investigaciones ATEL (hito7_investigacion_atel), calcula con las fórmulas exactas del Artículo 30 de la Resolución 0312 de 2019 (constante K = 240.000 o K = 100 según indicador): 1) Frecuencia de accidentalidad, 2) Severidad de accidentalidad, 3) Proporción de accidentes de trabajo mortales, 4) Prevalencia de enfermedad laboral, 5) Incidencia de enfermedad laboral y 6) Ausentismo por causa médica. Compáralos con las metas de Objetivos SST (hito1_objetivos) y entrega ficha técnica en Somos SST, Google Sheets, LiveEditor y correo."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental"
      ],
      "inputs": [
        "rule_reserva_legal",
        "subagent_chat_capacitaciones",
        "cursos_lms"
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
        "nodeConfigs": {}
      }
    },
    "prompt": "Consulta los incidentes y accidentes investigados en Investigación ATEL (hito7_investigacion_atel) y, anonimizando al 100% nombres y cédulas conforme a la Ley 1581 de 2012, diseña fichas visuales de Lecciones Aprendidas y guiones de Charlas de 5 Minutos vinculadas al Plan de Capacitación (hito5_capacitaciones). Estructura cada ficha con: Descripción objetiva del evento, Causas raíz identificadas, Controles implementados y Preguntas de reflexión para cuadrillas, exportando a LiveEditor, Google Slides y correo."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "matriz_ipevar",
        "somos_sst_empresa"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito1_participacion_ipevar",
        "hito2_matriz_ipevar",
        "hito1_oportunidades_sst"
      ],
      "outputs": [
        "somos_sst_update",
        "acpm_task",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Reporte Participativo Sin Respuesta?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito1_participacion_ipevar, hito2_matriz_ipevar, hito1_oportunidades_sst): \"¿Reporte Participativo Sin Respuesta?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (somos_sst_update, acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_somos_sst_update": {
            "ifBranch": "yes"
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
    "prompt": "Revisa las participaciones y reportes de peligros enviados por los colaboradores en Participación de Trabajadores IPEVAR (hito1_participacion_ipevar) y compáralos con la Matriz de Peligros GTC-45 (hito2_matriz_ipevar) y Oportunidades SST (hito1_oportunidades_sst). Si existen reportes ciudadanos sin valoración o sin respuesta formal al trabajador/COPASST (Rama SÍ), propón su inclusión en Matriz IPEVAR, abre seguimiento en ACPM y envía resumen por correo; si todos los reportes han sido atendidos (Rama NO), registra verificación en WAPPY."
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
        "extract_web_search",
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "web_search",
        "somos_sst_empresa",
        "skill_auditoria_normativa"
      ],
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
          "if_router": {
            "ifConditionLabel": "¿Decreto / Resolución / Circular Nueva?",
            "ifConditionType": "keyword_match",
            "ifRuleExpression": "decreto, resolución, ley, circular, mintrabajo, obligatorio",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito1_rit, hito1_rhs, hito1_diagnostico_0312): \"¿Decreto / Resolución / Circular Nueva?\" [modo: keyword_match]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, google_docs, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Consulta la actividad económica CIIU, tamaño de planta y clase de riesgo ARL de la empresa activa (somos_sst_empresa) y ejecuta búsqueda jurídica en vivo (extract_web_search + web_search) en fuentes oficiales colombianas (Ministerio del Trabajo, SUIN-Juriscol, Función Pública, Ministerio de Salud y Transporte). Evalúa si alguna norma recién expedida impacta el Reglamento Interno de Trabajo (hito1_rit), Reglamento de Higiene y Seguridad (hito1_rhs) o Estándares Mínimos (hito1_diagnostico_0312). Si detectas normativa nueva aplicable (Rama SÍ), genera boletín jurídico en Google Docs, crea plan de adecuación en ACPM y envía alerta; si no hubo cambios normativos aplicables en la semana (Rama NO), deja constancia de vigilancia legal en WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "somos_sst_empresa",
        "skill_auditoria_normativa"
      ],
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
          "if_router": {
            "ifConditionLabel": "¿Licencia o Curso 50h/20h Por Vencer?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito1_responsable, hito1_diagnostico_0312): \"¿Licencia o Curso 50h/20h Por Vencer?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, google_calendar, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Revisa la designación formal del Responsable del SG-SST (hito1_responsable) frente al número de trabajadores y nivel de riesgo ARL de la empresa (Resolución 0312 de 2019: <=10 trab. R.I–III, 11–50 trab. R.I–III, o >50 trab. / R.IV–V). Verifica: 1) Acta de asignación firmada, 2) Vigencia de la Licencia en Seguridad y Salud en el Trabajo (renovación decenal), y 3) Vigencia del Curso Virtual de 50 horas o su actualización de 20 horas cada 3 años. Si detectas vencimiento <= 60 días o perfil incompatible con el nivel de riesgo (Rama SÍ), agenda renovación en Google Calendar, abre ACPM crítico y envía correo; si todo cumple (Rama NO), deja registro en WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "somos_sst_empresa",
        "skill_auditoria_normativa"
      ],
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
          "if_router": {
            "ifConditionLabel": "¿Ítems No Cumple Res. 0312 >= 1?",
            "ifConditionType": "numeric_threshold",
            "ifRuleExpression": ">= 1",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito1_diagnostico_0312, hito1_objetivos, hito7_acpm): \"¿Ítems No Cumple Res. 0312 >= 1?\" [modo: numeric_threshold]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, canvas_doc, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
          },
          "logic_approval_plan_0312_arl": {
            "approverEmail": "lider.sst@empresa.com",
            "customInstruction": "Solicita visto bueno antes de emitir Plan de Mejoramiento Res. 0312."
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
    "prompt": "Inspecciona línea por línea la Autoevaluación de Estándares Mínimos (hito1_diagnostico_0312) según el Artículo 27 y 28 de la Resolución 0312 de 2019: Crítico (<60%, exige Plan de Mejoramiento inmediato a disposición de MinTrabajo y seguimiento ARL a los 3 meses), Moderadamente Aceptable (60%–85%, Plan a ARL en 6 meses) o Aceptable (>85%, mantener evidencias). Si el puntaje actual es <= 85% o existen estándares sin evidencia soporte (Rama SÍ), genera Plan de Mejoramiento en LiveEditor + tareas ACPM y envía informe; si supera 85% con evidencias al día (Rama NO), registra histórico mensual en Google Sheets y WAPPY."
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
      "extractors": [
        "extract_sst_app",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "somos_sst_empresa",
        "somos_sst_trabajadores"
      ],
      "includeIfNode": true,
      "hitos": [
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
          "if_router": {
            "ifConditionLabel": "¿Período Bianual <= 45d o Vacante?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito4_comites, hito3_cocolab): \"¿Período Bianual <= 45d o Vacante?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, google_calendar, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Verifica en Conformación de Comités COPASST / Vigía (hito4_comites) y Comité de Convivencia Laboral (hito3_cocolab) la fecha de elección (período legal de 2 años), paridad de miembros principales y suplentes según planta actual de trabajadores (extract_sst_workers) y si algún miembro se retiró de la empresa dejando vacante. Si faltan <= 45 días para vencer el período bianual o existe vacante sin suplente activo (Rama SÍ), programa cronograma de convocatoria/votación en Google Calendar, abre tarea ACPM y envía instructivo electoral por correo; si ambos comités están vigentes y completos (Rama NO), notifica en WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "matriz_ipevar",
        "somos_sst_perfiles_cargo"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito5_gestion_cambio",
        "hito2_matriz_ipevar",
        "hito5_capacitaciones"
      ],
      "outputs": [
        "acpm_task",
        "somos_sst_update",
        "email_report",
        "google_docs",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Cambio Abierto Sin Evaluar Riesgos?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito5_gestion_cambio, hito2_matriz_ipevar, hito5_capacitaciones): \"¿Cambio Abierto Sin Evaluar Riesgos?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, somos_sst_update, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_docs, wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_somos_sst_update": {
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
    "prompt": "Revisa los registros activos en Gestión del Cambio (hito5_gestion_cambio, Artículo 2.2.4.6.26 del Decreto 1072 de 2015) y valida que cada cambio organizacional, tecnológico, de infraestructura o normativo cuente con: 1) Identificación previa de peligros y actualización de Matriz GTC-45 (hito2_matriz_ipevar), y 2) Información/capacitación a los trabajadores afectados (hito5_capacitaciones). Si hay cambios implementados sin evaluación de riesgos cerrada (Rama SÍ), crea acción correctiva en ACPM y envía alerta; si todos los cambios tienen cierre conforme (Rama NO), actualiza informe mensual en Google Docs y WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "somos_sst_epp",
        "matriz_compatibilidad"
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
          "if_router": {
            "ifConditionLabel": "¿Compra Crítica Sin Aval Técnico SST?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito5_compras_sst, hito5_equipos_alturas, hito5_registro_quimico): \"¿Compra Crítica Sin Aval Técnico SST?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Audita las solicitudes y órdenes registradas en Compras y Adquisiciones SST (hito5_compras_sst, Art. 2.2.4.6.27 Dec. 1072) cruzándolas con Equipos de Alturas (hito5_equipos_alturas) y Registro de Productos Químicos (hito5_registro_quimico). Verifica ficha técnica, certificación ANSI/EN/NTC o FDS SGA según corresponda. Si existen adquisiciones críticas sin verificación de requisitos SST (Rama SÍ), crea tarea de validación en ACPM y notifica por correo; si el 100% cumple especificaciones (Rama NO), actualiza trazabilidad en Google Sheets y WAPPY."
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
        "extract_drive",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental"
      ],
      "inputs": [
        "google_drive",
        "somos_sst_trabajadores",
        "somos_sst_examenes",
        "somos_sst_epp"
      ],
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
          "if_router": {
            "ifConditionLabel": "¿Expediente Incompleto en Retirados/Activos?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito2_perfil_socio, hito3_epp, hito5_capacitaciones): \"¿Expediente Incompleto en Retirados/Activos?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Evalúa el cumplimiento del Artículo 2.2.4.6.13 del Decreto 1072 de 2015 (conservación controlada por mínimo 20 años) cruzando los respaldos en Google Drive (extract_drive) con los registros en Perfil Sociodemográfico/EMO (hito2_perfil_socio), Entregas de EPP (hito3_epp) y Registros de Formación y Capacitación (hito5_capacitaciones). Si detectas colaboradores sin soportes trazables de aptitud médica, entrega de EPP o inducción (Rama SÍ), abre plan de saneamiento documental en ACPM y envía listado nominal por correo; si el archivo digital está íntegro (Rama NO), actualiza índice maestro de retención en Google Sheets y WAPPY."
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
        "extract_sst_app",
        "extract_web_search"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental"
      ],
      "inputs": [
        "web_search",
        "somos_sst_empresa",
        "subagent_chat_abogado_laboral"
      ],
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
        "nodeConfigs": {},
        "extraAgents": [
          {
            "key": "agent_extra_auditor_rit",
            "agentId": "agent_consultor_sg_sst",
            "agentName": "Auditor Interno Calidad SST",
            "roleLabel": "2da IA Revisora Normativa",
            "prompt": "Revisa el borrador jurídico generado por el Agente #1 y valida que cada cláusula propuesta para el RIT y RHS sea 100% consistente con la Resolución 0312 de 2019 y la Matriz GTC-45 de la empresa."
          }
        ]
      }
    },
    "prompt": "Revisa el contenido actual del Reglamento Interno de Trabajo (hito1_rit) y del Reglamento de Higiene y Seguridad Industrial (hito1_rhs), verificando: 1) Coherencia exacta de los factores de riesgo listados en el RHS con la Matriz de Peligros GTC-45 actual (hito2_matriz_ipevar) y código CIIU; 2) Cumplimiento en el RIT de la reducción progresiva de jornada máxima legal (Ley 2101 de 2021), Ley 2191 de Desconexión Laboral, mecanismos de prevención de acoso laboral (Ley 1010) y debido proceso disciplinario. Entrega dictamen jurídico con redacción sugerida de otrosíes/actualizaciones en LiveEditor, Google Docs y correo."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "somos_sst_empresa"
      ],
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
        "nodeConfigs": {}
      }
    },
    "prompt": "Analiza el Contexto de la Organización y Partes Interesadas (hito1_dofa), la Política SST (hito1_politica_objetivos), los Objetivos e Indicadores (hito1_objetivos) y el portafolio de Oportunidades SST (hito1_oportunidades_sst). Verifica que cada amenaza externa y debilidad crítica interna tenga al menos un objetivo medible o acción estratégica CAME asociada, generando un documento ejecutivo de alineación estratégica en LiveEditor, presentación en Google Slides y resumen por correo."
  },
  {
    "presetKey": "preset_pesv_parque_automotor",
    "presetCategory": "riesgos_vial_quimico",
    "name": "🚗 Control Preoperacional PESV y Vencimientos de SOAT / Tecnomecánica / Licencias (RUNT + SIMIT)",
    "presetDescription": "Audita la Matriz PESV (Res. 20223040040595), el Parque Automotor (Hito 3) y consultas RUNT/SIMIT vía Antigravity para detectar SOAT, RTM, licencias vencidas o comparendos activos.",
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
        "trigger_qr_worker",
        "trigger_tenshi"
      ],
      "extractors": [
        "extract_sst_app",
        "scraper_agy_vial_pesv"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "matriz_pesv",
        "somos_sst_trabajadores"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_matriz_pesv",
        "hito3_vehiculos"
      ],
      "outputs": [
        "acpm_task",
        "somos_sst_update",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿SOAT/RTM/Licencia <= 30d o Comparendo?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito3_matriz_pesv, hito3_vehiculos): \"¿SOAT/RTM/Licencia <= 30d o Comparendo?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, somos_sst_update, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_somos_sst_update": {
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
          "logic_loop_placas_pesv": {
            "batchSize": 25,
            "customInstruction": "Itera cada vehículo y conductor validando SOAT, RTM y SIMIT."
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
    "prompt": "Cruza el Parque Automotor y Conductores (hito3_vehiculos), la Matriz de Riesgos Viales PESV (hito3_matriz_pesv + matriz_pesv, Resolución 20223040040595 de Mintransporte) y las verificaciones viales RUNT/SIMIT (scraper_agy_vial_pesv). Identifica vehículos con SOAT, Revisión Técnico-Mecánica o mantenimiento preventivo vencido / a <= 30 días, conductores con licencia vencida o comparendos, y riesgos viales en nivel Crítico sin control cerrado. Si existen alertas viales reales (Rama SÍ), inmoviliza preventivamente mediante tarea ACPM, actualiza Somos SST y notifica por correo; si toda la flota está al día (Rama NO), actualiza bitácora PESV en Google Sheets y WAPPY."
  },
  {
    "presetKey": "preset_quimicos_sga_pubchem",
    "presetCategory": "riesgos_vial_quimico",
    "name": "⚗️ Auditoría de Inventario Químico SGA, Fichas FDS (16 Secciones) y Compatibilidad PubChem NIH",
    "presetDescription": "Cruza el inventario de sustancias químicas (Hito 3 y Hito 5) con PubChem (NIH) y el Decreto 1496 de 2018 (SGA) para detectar productos sin FDS, sin etiquetado o con incompatibilidades de almacenamiento.",
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "matriz_compatibilidad",
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
        "somos_sst_update",
        "email_report",
        "canvas_doc",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Incompatibilidad SGA o Sustancia Sin FDS?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito3_quimicos_sga, hito5_registro_quimico, hito2_matriz_ipevar): \"¿Incompatibilidad SGA o Sustancia Sin FDS?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, somos_sst_update, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (canvas_doc, wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_somos_sst_update": {
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
    "prompt": "Audita el Inventario Químico SGA (hito3_quimicos_sga), el Registro de Productos Químicos por área (hito5_registro_quimico) y la Matriz de Compatibilidad (matriz_compatibilidad), enriqueciendo propiedades físico-químicas y toxicológicas con consultar_pubchem_quimico (NIH). Verifica etiquetado SGA (Decreto 1496 de 2018 y Resolución 773 de 2021), presencia de sustancias carcinógenas/mutágenas y choques de Clase ONU en bodega (ej. inflamables Clase 3 junto a comburentes Clase 5, o ácidos junto a bases). Si detectas incompatibilidades o faltantes de FDS/etiqueta (Rama SÍ), abre acción urgente en ACPM y envía dictamen; si el almacenamiento es 100% compatible (Rama NO), guarda constancia técnica en LiveEditor y WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company"
      ],
      "inputs": [
        "pronostico_clima_sst",
        "buscar_centros_emergencia",
        "somos_sst_empresa"
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
          "if_router": {
            "ifConditionLabel": "¿Tormenta / Viento Fuerte / UV Extremo?",
            "ifConditionType": "keyword_match",
            "ifRuleExpression": "tormenta, rayo, lluvia, viento, extremo, alerta",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito3_alturas, hito3_ats, hito6_vulnerabilidad): \"¿Tormenta / Viento Fuerte / UV Extremo?\" [modo: keyword_match]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (email_report, acpm_task). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Obtén el pronóstico meteorológico y de alertas SST en vivo para la sede activa de la empresa (pronostico_clima_sst) junto con la red de centros médicos de urgencias más cercanos (buscar_centros_emergencia). Evalúa condiciones de lluvia, tormenta eléctrica, velocidad del viento, radiación UV extrema o calor excesivo frente a los Permisos de Trabajo en Alturas (hito3_alturas), ATS de campo (hito3_ats) y Análisis de Vulnerabilidad (hito6_vulnerabilidad). Si hay alerta meteorológica que obligue a suspender alturas a cielo abierto o reforzar hidratación/protección UV (Rama SÍ), dispara correo preventivo matutino, registro ACPM y alerta WAPPY; si las condiciones son seguras y estables (Rama NO), publica únicamente parte meteorológico verde en WAPPY."
  },
  {
    "presetKey": "preset_vulnerabilidad_plan_emergencias_medevac",
    "presetCategory": "riesgos_vial_quimico",
    "name": "🚒 Revisión de Análisis de Amenazas y Vulnerabilidad (Diamante de Riesgo) + Plan de Emergencias y MEDEVAC",
    "presetDescription": "Evalúa amenazas naturales, tecnológicas y sociales en el aplicativo de Vulnerabilidad (Hito 6) y sincroniza rutas de evacuación, PONs y centros asistenciales cercanos en el Plan de Emergencias (Hito 1).",
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "buscar_centros_emergencia",
        "pronostico_clima_sst",
        "somos_sst_empresa"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito6_vulnerabilidad",
        "hito1_plan_emergencias"
      ],
      "outputs": [
        "acpm_task",
        "somos_sst_update",
        "email_report",
        "canvas_doc",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Amenaza Diamante Alta Sin PON Vigente?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito6_vulnerabilidad, hito1_plan_emergencias): \"¿Amenaza Diamante Alta Sin PON Vigente?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, somos_sst_update, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (canvas_doc, wappy_notification) dejando constancia silenciosa de cumplimiento."
          },
          "out_acpm_task": {
            "ifBranch": "yes"
          },
          "out_somos_sst_update": {
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
    "prompt": "Cruza la calificación de amenazas naturales, tecnológicas y antrópicas del Análisis de Vulnerabilidad (hito6_vulnerabilidad, Art. 2.2.4.6.25 Dec. 1072) con el Plan de Prevención, Preparación y Respuesta ante Emergencias (hito1_plan_emergencias) y el directorio actualizado de clínicas/hospitales cercanos (buscar_centros_emergencia). Verifica que cada amenaza calificada en nivel Alto o Medio cuente con Procedimiento Operativo Normalizado (PON) y cadena de llamado MEDEVAC vigente. Si existen amenazas altas sin PON o directorio desactualizado (Rama SÍ), actualiza Somos SST, abre ACPM y notifica por correo; si el plan está 100% alineado (Rama NO), genera ficha ejecutiva en LiveEditor y WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "matriz_ipevar",
        "somos_sst_empresa"
      ],
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
          "if_router": {
            "ifConditionLabel": "¿Peligro Nivel I / Crítico Sin Control?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito2_matriz_ipevar, hito1_participacion_ipevar, hito7_acpm): \"¿Peligro Nivel I / Crítico Sin Control?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, canvas_doc, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Analiza la Matriz de Identificación de Peligros, Evaluación y Valoración de los Riesgos GTC-45 (hito2_matriz_ipevar + matriz_ipevar), validando cobertura de procesos rutinarios y no rutinarios, número de expuestos, peor consecuencia, requisito legal asociado y jerarquía de controles (Eliminación, Sustitución, Controles de Ingeniería, Controles Administrativos y EPP — Art. 2.2.4.6.24 Dec. 1072). Si detectas peligros en Nivel de Riesgo I (No Aceptable) o Nivel II dependientes únicamente de EPP sin plan de intervención en ACPM (Rama SÍ), crea las tareas correctivas en ACPM, redacta dictamen en LiveEditor y envía correo; si todos los riesgos críticos están controlados (Rama NO), actualiza sábana anual IPEVAR en Google Sheets y WAPPY."
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
      "extractors": [
        "extract_sst_app",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company"
      ],
      "inputs": [
        "matriz_pesv",
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
        "nodeConfigs": {}
      }
    },
    "prompt": "Elabora el boletín operativo semanal de los Programas de Gestión de Riesgos Críticos del PESV (Paso 8 de la Resolución 20223040040595: Gestión de la Velocidad Segura, Prevención de la Fatiga, Prevención de la Distracción, Cero Alcohol/Sustancias y Protección de Actores Viales Vulnerables), integrando el estado del parque automotor (hito3_vehiculos), la Matriz PESV (hito3_matriz_pesv) y el pronóstico climático semanal (pronostico_clima_sst). Entrégalo listo en LiveEditor, correo electrónico y notificación WAPPY."
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
      "extractors": [
        "extract_sst_app",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "matriz_compatibilidad",
        "consultar_pubchem_quimico",
        "somos_sst_examenes"
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
          "if_router": {
            "ifConditionLabel": "¿Sustancia CMR (H340/H350/H360)?",
            "ifConditionType": "keyword_match",
            "ifRuleExpression": "carcinógeno, mutágeno, H340, H350, H360, tóxico, sin examen",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito3_quimicos_sga, hito2_condiciones_salud, hito3_epp): \"¿Sustancia CMR (H340/H350/H360)?\" [modo: keyword_match]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_docs, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Inspecciona en el Inventario Químico SGA (hito3_quimicos_sga + consultar_pubchem_quimico) qué productos presentan toxicidad aguda, corrosión severa o clasificación CMR (Carcinógenos, Mutágenos o Tóxicos para la Reproducción bajo la Resolución 773 de 2021) y cruza los cargos expuestos contra Condiciones de Salud / EMO (hito2_condiciones_salud) y Protección Respiratoria/Cutánea en EPP (hito3_epp). Si detectas exposición a sustancias peligrosas sin vigilancia médica específica o sin filtro respiratorio certificado (Rama SÍ), crea acción prioritaria en ACPM y alerta por correo; si todo cuenta con control integral (Rama NO), actualiza informe de higiene química en Google Docs y WAPPY."
  },
  {
    "presetKey": "preset_certificacion_tareas_alto_riesgo_mintrabajo",
    "presetCategory": "riesgos_vial_quimico",
    "name": "🏗️ Verificación Oficial de Certificados de Trabajo en Alturas en Portal MinTrabajo / SENA por Cédula",
    "presetDescription": "Consulta mediante Antigravity la validez real de los certificados de formación y reentrenamiento en Trabajo Seguro en Alturas de la cuadrilla operativa y descarga evidencias PDF/PNG.",
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
        "extract_sst_workers",
        "scraper_agy_alto_riesgo"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "somos_sst_trabajadores",
        "google_antigravity"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito3_alturas",
        "hito5_capacitaciones",
        "hito7_acpm"
      ],
      "outputs": [
        "acpm_task",
        "email_report",
        "google_sheets",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Operario Sin Certificado Alturas Vigente?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito3_alturas, hito5_capacitaciones, hito7_acpm): \"¿Operario Sin Certificado Alturas Vigente?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
          "logic_loop_cuadrilla_alturas": {
            "batchSize": 25,
            "customInstruction": "Verifica cédula por cédula el certificado de Trabajo Seguro en Alturas."
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
    "prompt": "Toma los colaboradores con funciones operativas o permisos en alturas (extract_sst_workers + hito3_alturas) y analiza las consultas oficiales capturadas por scraper_agy_alto_riesgo (Resolución 4272 de 2021: Trabajador Autorizado 32h, Reentrenamiento 8h, Coordinador 80h). Si algún trabajador programado para labores >= 2.00 metros no registra certificado vigente o requiere reentrenamiento anual/por cambio (Rama SÍ), genera restricción operativa inmediata en ACPM y envía correo con las evidencias; si toda la cuadrilla está certificada (Rama NO), actualiza matriz de habilitación en Google Sheets y WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_rag_documental"
      ],
      "inputs": [
        "buscar_centros_emergencia",
        "subagent_chat_primer_respondiente",
        "somos_sst_empresa"
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
        "nodeConfigs": {}
      }
    },
    "prompt": "A partir de las amenazas priorizadas en el Análisis de Vulnerabilidad (hito6_vulnerabilidad), el Plan de Emergencias (hito1_plan_emergencias) y los centros hospitalarios reales más cercanos (buscar_centros_emergencia), diseña el guion mensual de Ejercicio de Gabinete / Simulacro de Escritorio (minuto a minuto, roles de brigada, primeros auxilios y activación MEDEVAC) alineado al Plan Anual de Capacitación (hito5_capacitaciones). Entrégalo formateado en LiveEditor, Google Docs y correo electrónico."
  },
  {
    "presetKey": "preset_capacitaciones_lms_notebooklm",
    "presetCategory": "gerencia_auditoria",
    "name": "🎓 Avance del Plan Anual de Capacitación SST, Rutas LMS y Material Pedagógico con NotebookLM",
    "presetDescription": "Monitorea el progreso de cursos obligatorios en el LMS de WAPPY y el Plan de Capacitaciones (Hito 5 / Hito 6), generando cápsulas de refuerzo y recordatorios a trabajadores rezagados.",
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
      "extractors": [
        "extract_sst_workers",
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "cursos_lms",
        "notebooklm",
        "somos_sst_trabajadores"
      ],
      "includeIfNode": true,
      "hitos": [
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
          "if_router": {
            "ifConditionLabel": "¿Cobertura de Capacitación < 85%?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito5_capacitaciones, hito6_ruta_aprendizaje): \"¿Cobertura de Capacitación < 85%?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, google_calendar, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (canvas_doc, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
          }
        }
      }
    },
    "prompt": "Evalúa la cobertura y aprobación real del Programa Anual de Capacitación SST (hito5_capacitaciones, Art. 2.2.4.6.11 Dec. 1072), las Rutas de Aprendizaje por cargo (hito6_ruta_aprendizaje) y el progreso en cursos LMS (cursos_lms). Si la cobertura acumulada del período es < 85% o existen colaboradores con inducción/reinducción vencida (Rama SÍ), agenda jornada de nivelación en Google Calendar, abre seguimiento en ACPM y envía listado nominal por correo junto con cápsula de estudio generada con apoyo de NotebookLM; si la cobertura supera el 85% (Rama NO), guarda reporte de indicadores de formación en LiveEditor y WAPPY."
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
      "extractors": [
        "extract_sst_app",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "somos_sst_empresa",
        "subagent_sintetizador_gerencia",
        "matriz_ipevar"
      ],
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
          "logic_approval_alta_direccion": {
            "approverEmail": "lider.sst@empresa.com",
            "customInstruction": "Solicita visto bueno del Líder SG-SST antes de enviar el informe oficial a Alta Dirección."
          }
        },
        "logicNodes": [
          {
            "key": "logic_approval_alta_direccion",
            "logicType": "human_approval",
            "title": "Aprobación",
            "subtitle": "Visto Bueno Gerencia"
          }
        ]
      }
    },
    "prompt": "Prepara el Informe Ejecutivo Gerencial de cierre de mes alineado con los requisitos del Artículo 2.2.4.6.31 del Decreto 1072 de 2015 (Revisión por la Alta Dirección), consolidando datos reales de: 1) Diagnóstico de Estándares Mínimos Res. 0312 (hito1_diagnostico_0312), 2) Indicadores de accidentalidad, severidad y ausentismo (hito7_estadisticas_atel), 3) Hallazgos de Auditoría Interna (hito7_auditoria), y 4) Compromisos previos de Alta Dirección (hito7_alta_direccion). Estructúralo con resumen ejecutivo para Gerencia General en LiveEditor, diapositivas para Google Slides, correo electrónico y alerta en WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.5-flash-lite",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "somos_sst_empresa",
        "google_calendar"
      ],
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
          "if_router": {
            "ifConditionLabel": "¿Acciones ACPM Vencidas Sin Cierre?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito7_acpm, hito7_auditoria, hito1_oportunidades_sst): \"¿Acciones ACPM Vencidas Sin Cierre?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (email_report, google_calendar). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Audita el estado de todas las acciones Preventivas, Correctivas y de Mejora en el Centro de Control ACPM (hito7_acpm, Artículos 2.2.4.6.33 y 34 del Decreto 1072 de 2015), cruzándolas con Hallazgos de Auditoría (hito7_auditoria) y Oportunidades de Mejora (hito1_oportunidades_sst). Si existen acciones con fecha compromiso vencida o próximas a vencer en <= 7 días sin soporte de eficacia (Rama SÍ), envía boletín de escalamiento por responsable al correo, agenda bloque de cierre en Google Calendar y notifica en WAPPY; si el 100% está en plazo (Rama NO), actualiza indicador de eficacia ACPM en Google Sheets y WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "skill_auditoria_normativa",
        "subagent_auditor_calidad",
        "somos_sst_empresa"
      ],
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
          "if_router": {
            "ifConditionLabel": "¿No Conformidad Mayor o Auditoría >12m?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito7_auditoria, hito4_comites, hito7_acpm): \"¿No Conformidad Mayor o Auditoría >12m?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, canvas_doc, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_docs, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Inspecciona el módulo de Auditoría de Cumplimiento SG-SST (hito7_auditoria, Art. 2.2.4.6.29–30 Dec. 1072) junto con la participación del COPASST (hito4_comites) y los planes de acción ACPM (hito7_acpm). Comprueba que se haya realizado al menos una auditoría anual cubriendo todas las áreas y estándares, y revisa el estado de las No Conformidades. Si han transcurrido > 11 meses desde la última auditoría o existen No Conformidades abiertas sin análisis de causa raíz (Rama SÍ), genera plan de auditoría/cierre en LiveEditor, crea tareas ACPM y envía alerta; de lo contrario (Rama NO), archiva seguimiento mensual en Google Docs y WAPPY."
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
      "extractors": [
        "extract_sst_app",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "consultar_analitica_actos_condiciones",
        "consultar_analitica_psicosocial",
        "matriz_ipevar"
      ],
      "includeIfNode": true,
      "hitos": [
        "hito8_predictivo",
        "hito2_oraculo_predictivo",
        "hito4_actos_condiciones",
        "hito7_estadisticas_atel"
      ],
      "outputs": [
        "acpm_task",
        "canvas_doc",
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {
          "if_router": {
            "ifConditionLabel": "¿Foco Predictivo de Alto Riesgo Detectado?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito8_predictivo, hito2_oraculo_predictivo, hito4_actos_condiciones, hito7_estadisticas_atel): \"¿Foco Predictivo de Alto Riesgo Detectado?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, canvas_doc, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (wappy_notification) dejando constancia silenciosa de cumplimiento."
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
          },
          "logic_merge_predictivo_4hitos": {
            "customInstruction": "Unifica indicadores predictivos, salud, actos inseguros y ATEL antes de evaluar."
          }
        },
        "logicNodes": [
          {
            "key": "logic_merge_predictivo_4hitos",
            "logicType": "merge",
            "title": "Unir Ramas",
            "subtitle": "4 Señales SST"
          }
        ]
      }
    },
    "prompt": "Ejecuta un análisis predictivo transversal cruzando Inteligencia Predictiva SST (hito8_predictivo), Oráculo de Salud (hito2_oraculo_predictivo), tendencia de Actos y Condiciones Inseguras (hito4_actos_condiciones + consultar_analitica_actos_condiciones) y Estadísticas ATEL (hito7_estadisticas_atel). Identifica áreas o cargos donde convergen múltiples precursores de accidente (alta rotación, condiciones subestándar abiertas, fatiga o controles vencidos). Si detectas un foco de alerta temprana (Rama SÍ), genera intervención preventiva anticipada en ACPM, informe ejecutivo en LiveEditor y correo; si los indicadores precursores están estables (Rama NO), notifica estado preventivo óptimo en WAPPY."
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
      "extractors": [
        "extract_sst_workers",
        "extract_sst_app"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_antiduplicate"
      ],
      "inputs": [
        "cursos_lms",
        "somos_sst_trabajadores"
      ],
      "includeIfNode": true,
      "hitos": [
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
          "if_router": {
            "ifConditionLabel": "¿Trabajador Sin Reinducción en >12 Meses?",
            "ifConditionType": "critical_findings",
            "ifRuleExpression": "vencido, crítico, brecha, alerta, incumplimiento, hallazgo",
            "customInstruction": "Evalúa sobre los resultados de los aplicativos conectados (hito5_capacitaciones, hito6_ruta_aprendizaje, hito5_contratistas): \"¿Trabajador Sin Reinducción en >12 Meses?\" [modo: critical_findings]. Si SÍ se cumple la condición de alerta, dispara la Rama SÍ (acpm_task, email_report). Si NO hay novedades críticas (100% al día), dispara únicamente la Rama NO (google_sheets, wappy_notification) dejando constancia silenciosa de cumplimiento."
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
    "prompt": "Cruza la nómina completa de trabajadores activos (extract_sst_workers) y personal contratista permanente (hito5_contratistas) contra los registros de Capacitación (hito5_capacitaciones), Rutas de Aprendizaje (hito6_ruta_aprendizaje) y progreso LMS (cursos_lms) conforme al Parágrafo 2 del Artículo 2.2.4.6.11 del Decreto 1072 de 2015 y Estándar 1.2.2 de la Resolución 0312 de 2019. Si existen colaboradores sin inducción o cuya última reinducción supere 12 meses (Rama SÍ), crea convocatoria obligatoria en ACPM y envía listado nominal por correo; si el 100% está al día (Rama NO), actualiza matriz de cobertura en Google Sheets y WAPPY."
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
      "extractors": [
        "extract_sst_app",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.6-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company"
      ],
      "inputs": [
        "google_calendar",
        "pronostico_clima_sst",
        "somos_sst_empresa"
      ],
      "includeIfNode": false,
      "hitos": [
        "hito7_acpm",
        "hito5_capacitaciones",
        "hito4_comites"
      ],
      "outputs": [
        "email_report",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {}
      }
    },
    "prompt": "Genera el Briefing Ejecutivo Semanal de los Lunes para el líder SG-SST y la Gerencia de la empresa activa: 1) Top 5 tareas prioritarias de la semana en el Centro de Control ACPM (hito7_acpm), 2) Capacitaciones programadas (hito5_capacitaciones), 3) Sesiones de comités (hito4_comites) y eventos en Google Calendar, y 4) Clima operativo en la sede (pronostico_clima_sst). Redáctalo de forma directa, accionable y ejecutiva para correo y notificación en WAPPY."
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
      "extractors": [
        "extract_sst_app"
      ],
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
        "hito6_ruta_aprendizaje",
        "hito5_capacitaciones",
        "hito4_actos_condiciones"
      ],
      "outputs": [
        "canvas_doc",
        "google_slides",
        "wappy_notification"
      ],
      "canvasLayout": {
        "nodeConfigs": {}
      }
    },
    "prompt": "Analiza cuál fue el factor de riesgo o comportamiento inseguro más frecuente del último mes en Actos y Condiciones Inseguras (hito4_actos_condiciones + consultar_analitica_actos_condiciones) y diseña la Campaña Mensual de Promoción y Autocuidado SST conectada a la Ruta de Aprendizaje (hito6_ruta_aprendizaje) y Capacitaciones (hito5_capacitaciones), estructurando mensajes clave, piezas visuales sugeridas (google_flow / notebooklm) y presentación lista para Google Slides, LiveEditor y notificación WAPPY."
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
      "extractors": [
        "extract_sst_app",
        "extract_sst_workers"
      ],
      "aiEngine": "wappy",
      "aiModel": "gemini-3.8-flash",
      "memoryNode": "wappy_memory_company",
      "memories": [
        "wappy_memory_company",
        "wappy_memory_procedural"
      ],
      "inputs": [
        "somos_sst_empresa",
        "somos_sst_perfiles_cargo"
      ],
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
        "nodeConfigs": {}
      }
    },
    "prompt": "Conforme al Artículo 2.2.4.6.8 numeral 3 del Decreto 1072 de 2015 y al Estándar 2.6.1 de la Resolución 0312 de 2019 (Rendición de cuentas sobre el desempeño mínimo anual), consolida los resultados por rol (Responsable SG-SST en hito1_responsable, responsabilidades SST por cargo en hito2_perfiles_cargo, porcentaje de cumplimiento de acciones asignadas en hito7_acpm e insumos para hito7_alta_direccion). Genera el acta e informe estructurado de Rendición de Cuentas en LiveEditor, Google Docs y correo electrónico."
  }
];

module.exports = {
  SYSTEM_WORKFLOW_PRESETS_VERSION,
  SYSTEM_WORKFLOW_PRESETS_CATALOG,
};
