# Bitácora Oficial de Auditoría y Verificación Lógica de Flujos — WAPPY IA (`/tareas`)

> **Subagente Custodio:** `wappy-workflow-architect`  
> **Especificación Rectora:** [`docs/WAPPY_WORKFLOW_ARCHITECTURE_SPEC.md`](./WAPPY_WORKFLOW_ARCHITECTURE_SPEC.md) (fundamentada en `https://docs.n8n.io/`)  
> **Scripts Oficiales de Verificación Determinista y E2E:**
> 1. Validador Estático y Topológico DAG (14 Leyes Formales): `.agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js`
> 2. Suite Dinámica Multi-Escenario E2E en MongoDB Real: `.agents/skills/wappy-workflow-architecture/scripts/run-logical-test-suite.js`

---

## Registro #001 — Reingeniería Causal DAG Estilo n8n, Catálogo de 55 Presets y Suite Multi-Escenario E2E

- **Fecha:** `2026-11-11`
- **Versión del Catálogo:** `2026.11.11-v56-n8n-dag-coherent` (`55` flujos oficiales SG-SST)
- **Estado Global:** ✅ **100 % APROBADO (`55/55` presets válidos con `0` errores, `0` avisos y `16/16` pruebas E2E superadas)**

### 1. Diagnóstico Raíz de Incoherencias Anteriores (Antes vs. Después)

| # | Defecto Estructural Detectado | Causa Raíz en Motor / Lienzo Anterior | Corrección Arquitectónica Definitiva (DAG n8n) |
| :-: | :--- | :--- | :--- |
| **1** | **Inversión Causal de Aplicativos Hito** (fuentes de lectura colocadas después de la respuesta del Agente IA) | Todos los `wf.hitos` se dibujaban en una sola columna a la derecha del `Agente IA`, mezclando bases de datos de lectura (`hito2_perfil_socio`, `hito3_epp`, `hito3_alturas`) con módulos donde se escribe/genera informe (`hito7_investigacion_atel`). | Separación explícita por rol causal `hitoRole`: **`source_read`** (Etapa 2, a la **IZQUIERDA** de `IF` y `Agente IA`) vs. **`target_write_report`** (a la **DERECHA** del `Agente IA`, exclusivamente sobre **Rama SÍ**). Paridad 100 % entre `resolveWorkflowHitoRole` (backend) y `resolveCanvasHitoRole` (frontend). |
| **2** | **Compuerta `IF` colocada después del Agente IA en flujos deterministas** | El `IF` siempre iba después del LLM, gastando tokens todos los días para concluir que 105 trabajadores estaban al día y usando un regex ingenuo (`/vencid\|brecha/i`) que daba falso positivo ante `"0 exámenes vencidos, sin brechas"`. | Dos modos formales: **`ifPlacement: 'pre_agent'`** (evalúa conteos deterministas **ANTES** del `Agente IA`; si da `0` brechas nuevas toma `Rama NO` con **`0` llamadas LLM**) e **`ifPlacement: 'post_agent'`** (contrato explícito `[VEREDICTO_IF: SI\|NO]` + limpieza de negaciones en español). |
| **3** | **Triple / Cuádruple Duplicación de Fuentes sobre la Misma Colección** | Un mismo flujo conectaba a la vez `extract_sst_workers` + `somos_sst_trabajadores` + `somos_sst_examenes` + `hito2_perfil_socio` (los 4 leyendo la misma nómina) o `somos_sst_epp` + `hito3_epp`. | Ley de Fuente Canónica Única: eliminadas todas las fuentes redundantes en los `55` presets (`376 -> 0` errores de auditoría) y blindaje `resolveCanonicalSourceFamily` en `collectStructuredWorkflowSourceData`. |
| **4** | **`wappy_memory_antiduplicate` Decorativa (Sin Estado Real)** | Solo inyectaba 600 caracteres de prosa al prompt sin impedir que el mismo trabajador vencido disparara alertas y creara tarjetas Kanban repetidas cada mañana. | Ledger real en `AutomationLog.processedEntityKeys` (`<nodo>:<cedula\|placa\|cas\|serial>`) con ventana configurable `dedupWindow` (`24h`, `7d`, `30d`, `forever`) + upsert idempotente acumulativo en `KanbanTask`. |
| **5** | **Fuga de Registros Sanos o Deduplicados en `logic_merge` / `logic_loop`** | `buildLivePreExtractionAndLogicBlocks` consultaba `inspectNodeLiveData` crudo en nodos `Merge`/`Loop`, re-inyectando trabajadores sanos o ya gestionados al prompt aunque el nodo fuente tuviera `recordFilterMode: 'critical_only'`. | `Merge` y `Loop` filtran estrictamente por `recordFilterMode` (`critical_only` / `selected`) y excluyen toda entidad presente en `safeProcessedSet` antes de consolidar. |
| **6** | **Falso Positivo `105 >= 1` en Sandbox y Generación Prematura de Informes Hito en `Rama NO`** | En Sandbox `numeric_threshold` caía en `totalExtractedRecords` (`105`) cuando `totalCriticalRecords === 0`; en `runAutomation` `generateOrExtractOfficialAppReport` corría antes de `ifConditionPassed` y forzaba `ifConditionPassed = true`. | Eliminado el fallback a `totalExtractedRecords`; `generateOrExtractOfficialAppReport` se ejecuta **DESPUÉS** de evaluar la compuerta `IF` y **ÚNICAMENTE** cuando `activeBranch === 'yes' \|\| 'direct'`. |
| **7** | **Ventana Preventiva `<= 30 Días` y Enum Real de `SgsstEppData`** | `buildUnifiedWorkerRecord` no verificaba `fechaProximoExamen` ni anualidad `fechaUltimoExamen + 365d`, y `hito3_epp` no contemplaba `'Inspección Requerida' \| 'Fuera de Servicio'`. | Implementados `isDateExpiredOrWithinDays(..., 30)` e `isAnnualDateExpiredOrWithinDays(..., 30)` solo para personal activo (`estadoLaboral !== 'Retirado'`), alineado con el esquema Mongoose real `SgsstEppData`. |

---

### 2. Resultados del Validador Estático y Topológico (`validate-workflow-logic.js`)

Comando ejecutado:
```bash
node .agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js
```

- **Flujos auditados:** `55 / 55`
- **Errores lógicos / causales / redundancia:** **`0`** (reducción desde `376` errores en el catálogo previo)
- **Advertencias:** **`0`**
- **Distribución arquitectónica verificada:**
  - Arquetipos con compuerta determinista `pre_agent`: **`33`** flujos (ahorro del 100 % de tokens IA cuando no hay novedades/brechas nuevas)
  - Arquetipos con triage cualitativo `post_agent`: **`8`** flujos (contrato `[VEREDICTO_IF: SI|NO]`)
  - Arquetipos de síntesis ejecutiva directa (`includeIfNode: false`): **`14`** flujos
- **Paridad de roles Hito Frontend ↔ Backend:** **`156 / 156`** nodos Hito verificados con `0` discrepancias.

---

### 3. Resultados Medidos de la Suite Dinámica Multi-Escenario E2E (`run-logical-test-suite.js`)

Comando ejecutado contra MongoDB real (`127.0.0.1:27017/LibreChat`) con aislamiento efímero y verificación forense de limpieza:
```bash
node .agents/skills/wappy-workflow-architecture/scripts/run-logical-test-suite.js
```

| Código | Escenario Lógico Ejecutado | Resultado Esperado | Resultado Medido en Motor Real | Estado |
| :-: | :--- | :--- | :--- | :-: |
| **B1.1** | Validación formal de las 14 leyes DAG sobre los 55 presets | `55/55` válidos, `0` errores, `0` avisos | `55/55` válidos, `errores=0, avisos=0` | ✅ PASS |
| **B1.2** | Paridad `resolveCanvasHitoRole` (React) === `resolveWorkflowHitoRole` (Node) | `0` discrepancias en todos los Hitos | `156` nodos Hito idénticos (`0` discrepancias) | ✅ PASS |
| **B1.3** | Separación espacial `sourceHitosList` (Izq.) vs `targetHitosList` (Der.) en `WappyWorkflowCanvas.tsx` | Columnas causales diferenciadas | Verificado en AST/código de `WappyWorkflowCanvas.tsx` | ✅ PASS |
| **B2.1** | Trampa de `105` trabajadores sanos (`0` críticos) en `numeric_threshold (>= 1)` y `critical_findings` | `passed: false` (`Rama NO`) | `passed === false` en ambos modos | ✅ PASS |
| **B2.2** | Trampa de negación en español (`"0 exámenes vencidos, ninguna brecha crítica, sin incumplimientos"`) | `passed: false` (`Rama NO`) | `passed === false` (inmune a negaciones) | ✅ PASS |
| **B2.3** | Contrato explícito `[VEREDICTO_IF: NO]` vs `[VEREDICTO_IF: SI]` con jerga legal en el texto | Respeta veredicto explícito | `NO -> false`, `SI -> true` | ✅ PASS |
| **B2.4** | Matemática de ventana `<= 30d` (EMO a 305d vs 20d vs 15d) + exclusión de `Retirado` | Solo `<= 30d` activos son `isCritical: true` | `305d=false`, `20d=true`, `15d=true`, `Retirado=false` | ✅ PASS |
| **B3.A** | **`preset_vencimientos_emo_epp` — Empresa 100 % Vigente (5 activos al día)** | `Rama NO`, `0` llamadas LLM, `0` Kanban, Sandbox `agent_root=skipped` | `activeBranch='no'`, `llmSpy=0`, `kanban=0`, `outputs=['wappy_notification']`, Sandbox `agent_root='skipped'` | ✅ PASS |
| **B3.B** | **`preset_vencimientos_emo_epp` — 1ª Brecha Real (`CC 99887766` EMO vencido)** | Prompt quirúrgico solo con `99887766` (sin los 4 sanos), `Rama SÍ`, llave persistida, `1` Kanban | `llmSpy=1`, prompt excluye los 4 sanos, `activeBranch='yes'`, `processedEntityKeys=['hito2_perfil_socio:99887766']`, `kanban=1` | ✅ PASS |
| **B3.C** | **`preset_vencimientos_emo_epp` — Re-ejecución inmediata sin cambios (Anti-Duplicados `7d`)** | Omite `99887766`, `Rama NO`, `0` llamadas LLM, `0` Kanban duplicadas | `deduplicatedCount=1`, `freshCritical=0`, `activeBranch='no'`, `llmSpy` sin incremento (`0` tokens), `kanban=1` | ✅ PASS |
| **B3.D** | **`preset_vencimientos_emo_epp` — 2ª Brecha Incremental (`CC 55443322` EMO 12d + Casco EPP 10d)** | Sigue omitiendo `99887766`, procesa solo `55443322`, actualiza misma tarjeta Kanban abierta | `deduplicated=1`, `freshCritical=2`, `keys=['hito2_perfil_socio:55443322','hito3_epp:55443322:casco_dielectrico_tipo_ii']`, `kanban=1` (actualización acumulativa) | ✅ PASS |
| **B4.A** | **`preset_drive_furat_investigacion_correo` — `0` archivos FURAT nuevos en Drive** | `Rama NO`, `0` llamadas LLM, `hito7_investigacion_atel` (`target_write_report`) NO invocado | `activeBranch='no'`, `llmSpy=0`, `officialReportsAttached=0`, `outputs=['wappy_notification']` | ✅ PASS |
| **B5.A** | **`preset_qr_actos_condiciones_cierre_acpm` — Reporte QR menor (`[VEREDICTO_IF: NO]`)** | `post_agent` -> `Rama NO`, no crea ACPM | `ifPlacement='post_agent'`, `activeBranch='no'`, `kanban` sin incremento, `outputs=['wappy_notification']` | ✅ PASS |
| **B5.B** | **`preset_qr_actos_condiciones_cierre_acpm` — Peligro grave en excavación (`[VEREDICTO_IF: SI]`)** | `post_agent` -> `Rama SÍ`, abre ACPM urgente | `activeBranch='yes'`, `kanban +1`, `outputs=['acpm_task']` | ✅ PASS |
| **B5.C** | **Arquetipo 4 — Compuerta `logic_human_approval` en `Rama SÍ`** | Retiene salidas en `status: 'awaiting_approval'` | `log.status='awaiting_approval'`, `pendingApprovalPayload.outputsToExecute=['acpm_task']`, no despacha antes del aval | ✅ PASS |
| **CLEAN.1** | Limpieza atómica de documentos efímeros en MongoDB tras finalizar | `0` documentos residuales | `0` documentos residuales verificados en todas las colecciones | ✅ PASS |
