# Mapa Oficial de Herramientas MCP `wappy` y Normativa Colombiana SG-SST

Este catálogo agrupa las herramientas expuestas por el servidor MCP `wappy` por módulo funcional de **Somos SST / WAPPY IA** junto con su fundamento jurídico vigente en Colombia.

---

## 0. Gobernanza Multi-Empresa, Contexto y Diagnóstico 360°

| Herramienta MCP | Propósito Operativo | Regla de Oro |
| :--- | :--- | :--- |
| `wappy_consultar_perfil_empresa` | Lee razón social, NIT, CIIU, clase de riesgo ARL (I–V), número de trabajadores y sede activa. | **Ejecutar SIEMPRE primero** antes de cualquier operación SG-SST. |
| `wappy_actualizar_perfil_empresa` | Actualiza datos maestros de la empresa activa. | No sobrescribir campos existentes con vacíos. |
| `wappy_consultar_empresas` | Lista todas las empresas administradas por el usuario/consultor. | Usar cuando el usuario mencione otra empresa por nombre o NIT. |
| `wappy_activar_empresa` | Cambia la empresa activa en sesión (`companyId`). | Confirmar razón social y NIT tras activar. |
| `wappy_crear_empresa` / `wappy_eliminar_empresa` | Alta o baja de empresas (eliminación solo con confirmación explícita). | Exigir confirmación expresa del usuario antes de eliminar. |
| `wappy_resumen_general_360` | Panorama integral de trabajadores, riesgos, 0312, ATEL, EPP y tareas pendientes. | Ideal como primera lectura ejecutiva. |
| `wappy_obtener_briefing_ejecutivo` | Resumen gerencial priorizado con alertas críticas del día. | Excelente para informes a Gerencia / Alta Dirección. |
| `wappy_consultar_contexto_dofa` / `wappy_guardar_contexto_dofa` | Análisis de contexto interno/externo y matriz DOFA estratégica. | Articulado con Plan de Trabajo Anual e ISO 45001 Cap. 4. |
| `wappy_consultar_subusuarios` | Consulta líderes/responsables y accesos delegados en la cuenta. | Útil para asignar responsables reales en planes ACPM. |

---

## Hito 1 — Evaluación Inicial, Estándares Mínimos y Matriz Legal
**Marco Legal:** *Decreto 1072 de 2015 (Arts. 2.2.4.6.8, 2.2.4.6.16) · Resolución 0312 de 2019 (7, 21 o 60 Estándares).*

- **Autoevaluación 0312:**
  - `wappy_consultar_diagnostico_0312`: Obtiene calificación acumulada (`CRÍTICO < 60%`, `MODERADO 60%–85%`, `ACEPTABLE > 85%`), estado por ciclo PHVA y brechas.
  - `wappy_evaluar_estandar_0312`: Califica un ítem específico con justificación documental y modo de verificación.
- **Matriz de Requisitos Legales:**
  - `wappy_consultar_matriz_legal`
  - `wappy_registrar_requisito_legal`
  - `wappy_actualizar_requisito_legal`
  - `wappy_eliminar_requisito_legal`
- **Importación Documental Drive:**
  - `wappy_importar_hito1_drive`: Importa diagnósticos o matrices previas desde Google Drive de la empresa activa.

---

## Hito 2 — Talento Humano, Perfil Sociodemográfico y Riesgo Psicosocial
**Marco Legal:** *Decreto 1072 de 2015 (Art. 2.2.4.6.12) · Resolución 2764 de 2022 (Batería Psicosocial) · Resolución 2346 de 2007 / 1918 de 2009 (Evaluaciones Médicas).*

- **Gestión de Trabajadores:**
  - `wappy_consultar_trabajadores`: Lista nómina activa/retirada con cédula, cargo, EPS, ARL, AFP y fecha de nacimiento.
  - `wappy_registrar_trabajador` / `wappy_actualizar_trabajador`
  - `wappy_retirar_trabajador` / `wappy_reactivar_trabajador` / `wappy_eliminar_trabajador`
  - `wappy_investigar_trabajador_360`: Cruza expediente interno y validaciones externas del trabajador.
  - `wappy_importar_trabajadores_drive`: Importación masiva sociodemográfica desde Google Sheets / Excel en Drive.
- **Perfiles de Cargo y Clima/Psicosocial:**
  - `wappy_consultar_perfiles_cargo` / `wappy_guardar_perfil_cargo` / `wappy_eliminar_perfil_cargo`
  - `wappy_analitica_psicosocial_animo`: Analítica agregada de estado anímico y alertas preventivas psicosociales.

---

## Hito 3 — Identificación de Peligros GTC 45, Seguridad Vial PESV y Químicos SGA
**Marco Legal:** *GTC 45 (2012-06-20) · Resolución 20223040040595 de 2022 (PESV) · Ley 320 de 1996 & Decreto 1496 de 2018 (SGA ONU).*

- **Matriz IPEVR GTC 45:**
  - `wappy_consultar_matriz_gtc45`
  - `wappy_alimentar_matriz_gtc45` *(Calcula `NP = ND × NE`, `NR = NP × NC`, aceptabilidad y jerarquía de controles: Eliminación, Sustitución, Ingeniería, Administrativos, EPP).*
  - `wappy_actualizar_riesgo_gtc45` / `wappy_eliminar_riesgo_gtc45`
- **Plan Estratégico de Seguridad Vial (PESV):**
  - `wappy_consultar_matriz_pesv` / `wappy_alimentar_matriz_pesv` / `wappy_actualizar_riesgo_pesv` / `wappy_eliminar_riesgo_pesv`
  - `wappy_consultar_vehiculos` / `wappy_registrar_vehiculo` / `wappy_actualizar_vehiculo` / `wappy_eliminar_vehiculo` *(Control de SOAT, Revisión Técnico-Mecánica y mantenimientos preventivos).*
- **Riesgo Químico e Inventario SGA:**
  - `wappy_consultar_inventario_quimico` / `wappy_registrar_producto_quimico` / `wappy_actualizar_producto_quimico` / `wappy_eliminar_producto_quimico`
  - `wappy_consultar_compatibilidad_quimica` / `wappy_guardar_compatibilidad_quimica`
  - `wappy_consultar_pubchem_quimico`: Consulta datos toxicológicos, CAS y pictogramas GHS en PubChem (NIH).

---

## Hito 4 — Plan de Trabajo Anual, Capacitación, LMS y Comités Paritarios
**Marco Legal:** *Resolución 2013 de 1986 (COPASST) · Resoluciones 652 y 1356 de 2012 & Ley 1010 de 2006 (Comité de Convivencia Laboral).*

- **Cronograma Anual y Tareas SST:**
  - `wappy_consultar_cronograma_sst` / `wappy_crear_actividad_cronograma` / `wappy_actualizar_estado_tarea` / `wappy_eliminar_tarea_cronograma`
- **Programa de Capacitación y Academia LMS:**
  - `wappy_consultar_capacitaciones` / `wappy_programar_capacitacion` / `wappy_actualizar_capacitacion` / `wappy_eliminar_capacitacion`
  - `wappy_consultar_cursos_lms` / `wappy_crear_curso_lms` / `wappy_actualizar_curso_lms` / `wappy_eliminar_curso_lms` / `wappy_consultar_progreso_cursos`
- **COPASST, Vigía SST, CCL y Brigada:**
  - `wappy_consultar_comites` / `wappy_registrar_miembro_comite` / `wappy_eliminar_miembro_comite`

---

## Hito 5 — Controles Operacionales: EPP, Alturas, ATS y Ergonomía (OWAS / PVE)
**Marco Legal:** *Ley 9 de 1979 · Resolución 2400 de 1979 · Resolución 4272 de 2021 (Trabajo Seguro en Alturas).*

- **Entrega de EPP:** `wappy_consultar_epp` / `wappy_registrar_entrega_epp` / `wappy_eliminar_entrega_epp`
- **Trabajo en Alturas y Tareas de Alto Riesgo:**
  - `wappy_consultar_equipos_alturas` / `wappy_registrar_equipo_alturas` / `wappy_eliminar_equipo_alturas`
  - `wappy_consultar_permisos_alturas` / `wappy_guardar_permiso_alturas`
  - `wappy_consultar_ats` / `wappy_guardar_ats` *(Análisis de Trabajo Seguro paso a paso).*
- **Ergonomía y Biomecánica:**
  - `wappy_consultar_estudios_puesto` / `wappy_registrar_estudio_puesto` / `wappy_actualizar_estudio_puesto` / `wappy_eliminar_estudio_puesto`
  - `wappy_consultar_evaluaciones_owas` / `wappy_guardar_evaluacion_owas` *(Nivel de acción postural 1 a 4).*

---

## Hito 6 — Prevención, Preparación y Respuesta ante Emergencias
**Marco Legal:** *Decreto 1072 de 2015 (Art. 2.2.4.6.25) · Ley 1523 de 2012.*

- `wappy_consultar_vulnerabilidad` / `wappy_guardar_vulnerabilidad` *(Metodología Diamante de Riesgo: Amenazas Naturales, Tecnológicas y Sociales).*
- `wappy_buscar_centros_emergencia`: Geolocalización de IPS, clínicas, bomberos y centros de urgencias cercanos a la sede.
- `wappy_pronostico_clima_sst`: Pronóstico meteorológico e índice UV para trabajos a cielo abierto, izajes y alturas.

---

## Hito 7 — Gestión de ATEL, Actos/Condiciones Inseguras y Rehabilitación
**Marco Legal:** *Resolución 1401 de 2007 (Investigación de Incidentes y Accidentes de Trabajo) · Resolución 0312 de 2019 Art. 30 (6 Indicadores Mínimos: Frecuencia, Severidad, Proporción Mortalidad, Prevalencia EL, Incidencia EL, Ausentismo).*

- **Casos e Indicadores ATEL:**
  - `wappy_consultar_casos_atel` / `wappy_registrar_caso_atel` / `wappy_actualizar_caso_atel` / `wappy_eliminar_caso_atel`
  - `wappy_consultar_estadisticas_atel` / `wappy_guardar_estadisticas_atel`
- **Reporte de Actos y Condiciones Subestándar:**
  - `wappy_consultar_reportes_actos_condiciones` / `wappy_registrar_reporte_acto_condicion` / `wappy_actualizar_reporte_acto_condicion` / `wappy_eliminar_reporte_acto_condicion`
  - `wappy_analitica_actos_condiciones`
- **Reintegro y Pausas Activas Basadas en Evidencia:**
  - `wappy_consultar_medlineplus_rehabilitacion`: Consulta CIE-10 en MedlinePlus (NIH) y protocolos ergonómicos.

---

## Hito 8 — Auditoría, Revisión por la Alta Dirección y Documentación Viva
**Marco Legal:** *Decreto 1072 de 2015 (Arts. 2.2.4.6.29 al 2.2.4.6.34).*

- **Auditorías y Hallazgos ACPM:**
  - `wappy_consultar_auditorias` / `wappy_registrar_hallazgo_auditoria` / `wappy_actualizar_hallazgo_auditoria` / `wappy_eliminar_hallazgo_auditoria`
- **Revisión Anual por la Alta Dirección e Informes:**
  - `wappy_consultar_revision_alta_direccion` / `wappy_guardar_revision_alta_direccion`
  - `wappy_consultar_informe_aplicativo` / `wappy_generar_informe_ejecutivo`
- **Editor de Documentos en Vivo (`LiveEditor`):**
  - `wappy_consultar_documentos_vivo` / `wappy_guardar_documento_vivo` / `wappy_eliminar_documento_vivo`
- **Automatizaciones DAG (`/tareas`), NotebookLM y Comunicaciones:**
  - `wappy_consultar_agentes_y_automatizaciones` / `wappy_programar_automatizacion` / `wappy_actualizar_automatizacion` / `wappy_eliminar_automatizacion`
  - `wappy_ejecutar_notebooklm`
  - `wappy_consultar_agenda` / `wappy_crear_evento_agenda` / `wappy_actualizar_evento_agenda` / `wappy_eliminar_evento_agenda`
  - `wappy_enviar_correo` / `wappy_generar_codigo_qr`
  - `wappy_consultar_ordenes_delegadas_tenshi` / `wappy_completar_orden_delegada_tenshi` / `wappy_delegar_orden_antigravity`
