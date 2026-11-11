---
name: wappy-workflow-architecture
description: Arquitectura oficial de diseño, validación causal DAG (estilo n8n), deduplicación con estado y pruebas lógicas multi-escenario para flujos de automatización SG-SST en WAPPY IA (/tareas). Úsala SIEMPRE antes de crear, auditar, modificar o probar flujos en systemWorkflowPresetsCatalog.js, automationScheduler.js o WappyWorkflowCanvas.tsx.
---

# Skill Oficial: Arquitectura de Flujos Lógicos WAPPY IA (`wappy-workflow-architecture`)

Esta skill entrena al Orquestador y al subagente especialista [`wappy-workflow-architect`](../../agents/wappy-workflow-architect.md) para diseñar, auditar y verificar flujos de automatización en `/tareas` con **rigor causal idéntico a `n8n` (`docs.n8n.io`)**, cero nodos redundantes y pruebas lógicas reales en múltiples escenarios.

## 📚 Lecturas Obligatorias (Progressive Disclosure)
1. **Memoria Procedural de Lecciones Destiladas:** Lee primero [`/Users/venta/.gemini/teams/wappy-dev-agency/memory/workflow-logic-lessons.md`](file:///Users/venta/.gemini/teams/wappy-dev-agency/memory/workflow-logic-lessons.md) (espejo en [`.agents/memory/workflow-logic-lessons.md`](../../memory/workflow-logic-lessons.md)).
2. **Especificación Maestra de Arquitectura:** [`docs/WAPPY_WORKFLOW_ARCHITECTURE_SPEC.md`](../../../docs/WAPPY_WORKFLOW_ARCHITECTURE_SPEC.md).
3. **Referencia de Patrones `n8n` ➔ `WAPPY`:** [`references/n8n-to-wappy-patterns.md`](./references/n8n-to-wappy-patterns.md).

---

## 🧠 Reglas Inquebrantables al Diseñar o Auditar un Flujo

### 1. Causalidad de Izquierda a Derecha (`Orden Visual === Orden de Ejecución`)
Todo flujo se construye respondiendo en orden estricto estas 6 preguntas:
1. **¿Qué dispara la ejecución? (`triggers[]` — Semántica OR):**
   - Por horario recurrente: `schedule_cron` (+ `trigger_tenshi` opcional para invocación manual/voz).
   - Por evento reactivo: `trigger_qr_worker`, `trigger_email_in`, `trigger_webhook_in`.
2. **¿De dónde salen los datos crudos? (Etapa 2 — `extractors[]` + Hitos `source_read`):**
   - Si los datos ya viven en un aplicativo de `Somos SST` (ej. `hito2_perfil_socio`, `hito3_epp`, `hito3_alturas`, `hito3_matriz_pesv`, `hito5_registro_quimico`), coloca ese aplicativo con `hitoRole: "source_read"` y `hitoOperationMode: "read_only"` **A LA IZQUIERDA**.
   - Si los datos vienen de una carpeta externa o correo, usa `extract_drive` o `extract_gmail`.
   - **PROHIBIDO** conectar dos nodos que lean la misma tabla (ej. jamás mezclar `hito2_perfil_socio` con `extract_sst_workers`, `somos_sst_trabajadores` ni `somos_sst_examenes`; jamás mezclar `hito3_epp` con `somos_sst_epp`).
3. **¿Hay registros nuevos que ameriten gastar tokens de IA y disparar alertas? (`wappy_memory_antiduplicate` + `ifPlacement: "pre_agent"`):**
   - Para toda vigilancia de vencimientos, brechas en BD o carpetas Drive/Gmail:
     * Activa `wappy_memory_antiduplicate` con `dedupWindow` (`"24h"`, `"7d"`, `"30d"`) para filtrar llaves de negocio ya alertadas (`AutomationLog.processedEntityKeys`).
     * Configura `if_router` con `ifPlacement: "pre_agent"`. Si existen `0` brechas/archivos nuevos, el flujo corta directo por la **`Rama NO`** hacia `wappy_notification` con **`0 tokens LLM`**.
   - Usa `ifPlacement: "post_agent"` **solo** cuando el contenido entrante sea no estructurado (texto libre QR, correo abierto, foto, síntesis clínica) y requiera que el Agente IA emita primero `[VEREDICTO_IF: SI]` o `[VEREDICTO_IF: NO]`.
4. **¿Qué razona el Agente IA Especialista? (`agent_root` + Clúster Inferior):**
   - `aiModel`: Solo modelos vigentes en `.env` (`gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.8-flash`).
   - `memories[]`: `wappy_memory_company` + `wappy_memory_antiduplicate` (si aplica) + `wappy_memory_procedural` / `wappy_rag_documental` (solo si aporta valor real).
   - `inputs[]` (`Herramienta +`): **Únicamente** herramientas consultivas externas o reglas/scrapers no redundantes (`consultar_pubchem_quimico`, `consultar_medlineplus_rehabilitacion`, `pronostico_clima_sst`, `buscar_centros_emergencia`, `consultar_analitica_psicosocial`, `consultar_analitica_actos`, `cursos_lms`). Si no necesita ninguna herramienta externa adicional, `inputs: []` es **100 % válido y más limpio**.
5. **¿En qué aplicativo debe escribirse el resultado o generarse el Informe Oficial HTML? (Hitos `target_write_report`):**
   - Solo coloca un Hito **a la derecha del Agente IA** (`hitoRole: "target_write_report"`) cuando el flujo **registre/actualice datos en BD** (`write_and_update`, `write_and_report`) o **emita el Informe Oficial HTML del aplicativo** (`generate_report`) para adjuntarlo en salidas documentales.
   - Si `includeIfNode: true`, los Hitos `target_write_report` se ejecutan **únicamente en la `Rama SÍ`**.
6. **¿Qué salidas ejecuta cada rama? (`outputs[]`):**
   - `ifBranch: "yes"`: Acciones reales (`acpm_task`, `email_report`, `google_calendar`, `canvas_doc`, `google_docs`, `google_sheets`).
   - `ifBranch: "no"`: Trazabilidad silenciosa (`wappy_notification` o boletín preventivo en `canvas_doc`), **jamás** `acpm_task` ni alarmas por correo.

---

## 🛠️ Uso del Validador Estático y Topológico (`validate-workflow-logic.js`)

Antes de guardar cualquier cambio en `api/server/services/systemWorkflowPresetsCatalog.js` o aprobar un flujo nuevo, ejecuta siempre:

```bash
node .agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js
```

Para inspeccionar un preset puntual con detalle completo:

```bash
node .agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js --preset preset_vencimientos_emo_epp
```

El comando debe devolver **`0 errores`** en las **17 invariantes lógicas y de fidelidad de dominio (8 Hitos reales)** antes de pasar a las pruebas dinámicas en MongoDB.

---

## 🧪 Protocolo Obligatorio de Pruebas Lógicas Dinámicas (Cero Pruebas Superficiales)

Nunca afirmes que un flujo «funciona» solo porque devolvió texto. Ejecuta y documenta en `docs/WAPPY_WORKFLOW_AUDIT_LOGBOOK.md`:

1. **Prueba Escenario A (`Brecha Nueva -> Rama SÍ`):**
   - Inyecta o verifica `>= 1` registro temporal en brecha no alertado previamente.
   - Comprueba: `activeBranch === 'yes'`, el Agente IA razona sobre el ítem exacto, `AutomationLog.processedEntityKeys` registra la llave del ítem, se ejecutan solo las salidas `yes` (`acpm_task`, etc.) y **no** las salidas `no`.
2. **Prueba Escenario B (`Idempotencia / Anti-Duplicados en 2.ª Corrida -> Rama NO`):**
   - Ejecuta el mismo flujo inmediatamente por segunda vez sin cambiar los datos.
   - Comprueba: `wappy_memory_antiduplicate` detecta la llave ya registrada en la ventana activa (`dedupWindow`), `freshCriticalRecords === 0`, el motor `pre_agent` toma **`Rama NO`** con `llmSkippedByPreIf === true` (**0 llamadas al LLM**), y el conteo de `KanbanTask` abiertas **no aumenta** (`0 duplicados`).
3. **Prueba Escenario C (`Cumplimiento 100 % / 0 Archivos Nuevos -> Rama NO`):**
   - Sin registros en brecha (o carpeta vacía): comprueba `activeBranch === 'no'`, `llmSkippedByPreIf === true`, ejecución exclusiva de `wappy_notification` y limpieza total de datos temporales de prueba en MongoDB.

5. **Ejecutar la Suite Dinámica Multi-Escenario E2E contra MongoDB Real (`OBLIGATORIO`):**
   ```bash
   node .agents/skills/wappy-workflow-architecture/scripts/run-logical-test-suite.js
   ```
   - Verifica las 16 pruebas formales y de máquina de estados E2E (`Empresa Vigente -> NO + 0 tokens`, `1ª Brecha -> SÍ + llave anti-duplicado`, `Re-run inmediato -> NO + 0 tokens + 0 duplicados Kanban`, `2ª Brecha incremental -> SÍ + actualización acumulativa Kanban`, `Drive 0 archivos -> NO sin tocar Hito destino`, `Triage QR Menor vs Grave [VEREDICTO_IF: SI|NO]`, `logic_human_approval -> awaiting_approval`, y `0` residuos en MongoDB).
   - Registra el dictamen en `docs/WAPPY_WORKFLOW_AUDIT_LOGBOOK.md`.
