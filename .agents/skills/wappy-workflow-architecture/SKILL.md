---
name: wappy-workflow-architecture
description: Arquitectura oficial de diseño, validación causal DAG estilo n8n (AI Agent + Tools en Herramienta +), extracción documental IA/OCR, deduplicación con estado y pruebas lógicas multi-escenario para los 15 Flujos Maestros Curados SG-SST en WAPPY IA (/tareas). Úsala SIEMPRE antes de crear, auditar, modificar o probar flujos en systemWorkflowPresetsCatalog.js, automationScheduler.js o WappyWorkflowCanvas.tsx.
---

# Skill Oficial: Arquitectura de Flujos Lógicos WAPPY IA (`wappy-workflow-architecture`)

Esta skill entrena al Orquestador y al subagente especialista [`wappy-workflow-architect`](../../agents/wappy-workflow-architect.md) para diseñar, auditar y verificar flujos de automatización en `/tareas` con **rigor causal idéntico a `n8n` (`AI Agent` + `Tools` en `Herramienta +`)**, cero nodos redundantes, coherencia 1 a 1 entre título/nodos/prompt y pruebas lógicas reales en múltiples escenarios.

## 📚 Lecturas Obligatorias (Progressive Disclosure)
1. **Memoria Procedural de Lecciones Destiladas:** Lee primero [`/Users/venta/.gemini/teams/wappy-dev-agency/memory/workflow-logic-lessons.md`](file:///Users/venta/.gemini/teams/wappy-dev-agency/memory/workflow-logic-lessons.md) (espejo en [`.agents/memory/workflow-logic-lessons.md`](../../memory/workflow-logic-lessons.md)).
2. **Referencia Oficial de Nodos del Lienzo:** [`docs/WAPPY_WORKFLOW_NODES_REFERENCE.md`](../../../docs/WAPPY_WORKFLOW_NODES_REFERENCE.md).
3. **Especificación Maestra de Arquitectura:** [`docs/WAPPY_WORKFLOW_ARCHITECTURE_SPEC.md`](../../../docs/WAPPY_WORKFLOW_ARCHITECTURE_SPEC.md).
4. **Referencia de Patrones `n8n` ➔ `WAPPY`:** [`references/n8n-to-wappy-patterns.md`](./references/n8n-to-wappy-patterns.md).

---

## 🧠 Reglas Inquebrantables de Arquitectura `n8n` (`AI Agent` + `Tools`)

### 1. Catálogo Curado de 15 Flujos Maestros (`2026.11.12-v58-n8n-curated-15`)
En `api/server/services/systemWorkflowPresetsCatalog.js` se mantienen **exactamente 15 Flujos Maestros atómicos, simples y 100 % probados**, distribuidos en las 6 categorías oficiales de la UI:
- `salud_vencimientos` (3): EMO + Alturas por vencer, Entregas de EPP, Restricciones médicas y reubicación.
- `drive_sincronizacion` (3): Conceptos médicos EMO en Drive (PDF/OCR), Incapacidades en Gmail (PDF/OCR), Brechas de Capacitación y LMS.
- `atel_inspecciones` (3): Triaje QR de Actos y Condiciones, FURAT en Drive + Investigación ATEL Res. 1401, Permisos y Equipos de Alturas Res. 4272.
- `legal_cumplimiento` (2): Matriz Legal SG-SST, Seguimiento mensual COPASST y Convivencia (CCL).
- `riesgos_vial_quimico` (2): Flota PESV (SOAT/RTM/Preoperacional), Inventario Químico FDS y Compatibilidad SGA.
- `gerencia_auditoria` (2): Auditoría continua Estándares Mínimos Res. 0312, Informe Gerencial Mensual de Revisión por la Alta Dirección.

### 2. Causalidad de Izquierda a Derecha + Clúster `AI Agent` de `n8n`
Todo flujo se construye respondiendo en orden estricto estas 6 preguntas:

1. **¿Qué dispara la ejecución? (`triggers[]` — Semántica OR):**
   - Por horario recurrente: `schedule_cron` (+ `trigger_tenshi` opcional para orden directa por voz/chat).
   - Por evento reactivo: `trigger_qr_worker`, `trigger_email_in`, `trigger_webhook_in`.
2. **¿De dónde salen los datos crudos antes del Agente? (Etapa 2 — `extractors[]` + Hitos `source_read`):**
   - Si los datos estructurados viven en un aplicativo de `Somos SST`, conéctalo en Etapa 2 con `hitoRole: "source_read"` y `hitoOperationMode: "read_only"`.
   - Si existen **`>= 2` fuentes paralelas en Etapa 2**, incluye obligatoriamente un nodo `logicType: "merge"` (`Unir Ramas`) antes de la compuerta o del Agente.
   - Si el flujo lee **documentos/PDFs/correos no estructurados** desde `extract_drive`, `extract_gmail` o `extract_pc_folder`, **DEBE incluir `extract_ai_doc_ocr` (`✨ Extractor IA Docs`)** en `workflowNodes.extractors` con su `aiExtractionSchema` explícito (4 a 7 campos reales con `{ key, label, name, type, required, hint, description }`) tanto en `nodeConfigs.extractor_extract_ai_doc_ocr` como en `nodeConfigs.extract_ai_doc_ocr`.
   - **PROHIBIDO** conectar dos nodos redundantes que lean la misma entidad (ej. jamás mezclar `hito2_perfil_socio` con `somos_sst_trabajadores` / `extract_sst_workers` / `somos_sst_examenes`, ni leer el mismo Hito en Etapa 2 y a la vez en `Herramienta +`).
3. **¿Hay registros o archivos nuevos que ameriten gastar tokens de IA? (`wappy_memory_antiduplicate` + `ifPlacement: "pre_agent"`):**
   - Para toda vigilancia recurrente de vencimientos, brechas en BD o carpetas Drive/Gmail:
     * Activa `wappy_memory_antiduplicate` con `dedupWindow` (`"24h"`, `"7d"`, `"30d"`, `"all"`).
     * Configura `if_router` con `ifPlacement: "pre_agent"`. Si existen `0` brechas/archivos nuevos, el flujo corta directo por la **`Rama NO`** hacia `wappy_notification` con **`0 tokens LLM`**.
   - Usa `ifPlacement: "post_agent"` **solo** cuando el evento entrante requiera valoración experta previa del Agente IA (ej. triaje de reportes QR en campo contra GTC 45), exigiendo los marcadores `[VEREDICTO_IF: SI]` / `[VEREDICTO_IF: NO]`.
4. **¿Qué razona el Agente IA y qué herramientas invoca en `Herramienta +`? (`agent_root` + Clúster Inferior):**
   - `aiModel`: Únicamente modelos verificados en `.env` (`gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.8-flash`).
   - **OBLIGATORIO (`>= 1` herramienta visible en `Herramienta +`):** Ningún `Agente IA` puede quedar con `Herramienta +` vacío (`inputs.length + agentToolHitos.length >= 1`).
   - **Rol `hitoRole: "agent_tool"` (Estilo `n8n` AI Agent Tools):**
     * **PROHIBIDO `hitoRole: "target_write_report"`** (no se colocan cajas Hito post-agente a la derecha).
     * Todo aplicativo Hito donde el Agente IA consulte contexto cruzado, cree expedientes, actualice registros o emita el informe oficial del aplicativo se conecta debajo del Agente IA en el puerto **`Herramienta +`** con `hitoRole: "agent_tool"` y `appActionMode` explícito (`"read_only"`, `"write_and_update"`, `"write_and_report"` o `"generate_report"`), guardando la configuración espejo en **`nodeConfigs[hitoId]`** y **`nodeConfigs["tool_hitos_" + hitoId]`**.
   - En `inputs[]` (`Herramienta +`), conecta APIs y motores reales coherentes (`consultar_medlineplus_rehabilitacion`, `consultar_pubchem_quimico`, `pronostico_clima_sst`, `buscar_centros_emergencia`, `cursos_lms`, `web_search`, `matriz_pesv`, `matriz_compatibilidad`).
5. **¿Requiere visto bueno humano antes de distribuir actas legales? (`human_approval`):**
   - Úsalo en investigaciones ATEL (`Res. 1401 de 2007`) e informes mensuales de Revisión por la Alta Dirección (`Dec. 1072 Art. 2.2.4.6.31`).
6. **¿Qué salidas ejecuta cada rama? (`outputs[]`):**
   - `ifBranch: "yes"`: Acciones operativas y documentales (`acpm_task`, `email_report`, `google_calendar`, `canvas_doc`, `google_sheets`, `google_docs`).
   - `ifBranch: "no"`: Trazabilidad silenciosa con `wappy_notification`, **jamás** `acpm_task` en `no`.

### 3. Coherencia 1 a 1 y Cero Variables de Código en Textos Humanos
- **Coherencia 1 a 1:** Todo lo mencionado en `name` y `presetDescription` debe existir exactamente en los nodos visibles del lienzo y en el `prompt` (con la norma colombiana real aplicable y el número de Hito real de `HITO_APP_NODES`).
- **Cero Fuga de Código:** Está **TERMINANTEMENTE PROHIBIDO** escribir identificadores internos (`extract_drive`, `extract_gmail`, `extract_ai_doc_ocr`, `hito2_perfil_socio`, `hito3_epp`, `wappy_notification`, `acpm_task`, `email_report`, `canvas_doc`, `logic_merge`, `source_read`, `agent_tool`, `target_write_report`, `pre_agent`, `post_agent`, etc.) dentro de `name`, `presetDescription`, `prompt` o `customInstruction`. Usa siempre los nombres humanos reales en español (*«Perfil Sociodemográfico (Hito 2)»*, *«Extractor IA de Documentos»*, *«Centro de Control ACPM»*, *«Bitácora por Correo»*).

---

## 🛠️ Uso del Validador Estático y Topológico (`validate-workflow-logic.js`)

Antes de aprobar cualquier cambio en `api/server/services/systemWorkflowPresetsCatalog.js`, ejecuta siempre:

```bash
node .agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js
```

Para inspeccionar un flujo maestro puntual:

```bash
node .agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js --preset preset_vencimientos_emo_alturas
```

El comando debe devolver **`15/15 PASS · 0 errores · 0 advertencias`**.

---

## 🧪 Protocolo Obligatorio de Pruebas Lógicas Dinámicas (Cero Pruebas Superficiales)

Nunca afirmes que un flujo «funciona» solo porque devolvió texto. Verifica y documenta en `docs/WAPPY_WORKFLOW_AUDIT_LOGBOOK.md`:

1. **Escenario A (`Brecha Nueva -> Rama SÍ`):**
   - `activeBranch === 'yes'`, el Agente IA invoca sus herramientas conectadas en `Herramienta +`, `AutomationLog.processedEntityKeys` registra la llave del ítem y se ejecutan solo las salidas `yes`.
2. **Escenario B (`Idempotencia / Anti-Duplicados en 2.ª Corrida -> Rama NO`):**
   - Re-ejecución inmediata sin cambios: `wappy_memory_antiduplicate` filtra la llave dentro de `dedupWindow`, la compuerta `pre_agent` toma **`Rama NO`** con `llmSkippedByPreIf === true` (**0 llamadas al LLM**) y `0` tareas duplicadas en Kanban ACPM.
3. **Escenario C (`Cumplimiento 100 % / 0 Archivos Nuevos -> Rama NO`):**
   - Sin brechas ni archivos nuevos: `activeBranch === 'no'`, `0 tokens LLM`, ejecución exclusiva de `wappy_notification` y limpieza total de datos temporales en MongoDB.
4. **Suite E2E contra MongoDB Real:**
   ```bash
   node .agents/skills/wappy-workflow-architecture/scripts/run-logical-test-suite.js
   ```
