# Bitácora Oficial de Auditoría y Verificación Lógica de Flujos — WAPPY IA (`/tareas`)

> **Subagente Custodio:** `wappy-workflow-architect`  
> **Especificación Rectora:** [`docs/WAPPY_WORKFLOW_ARCHITECTURE_SPEC.md`](./WAPPY_WORKFLOW_ARCHITECTURE_SPEC.md) (fundamentada en `https://docs.n8n.io/`)  
> **Scripts Oficiales de Verificación Determinista y E2E:**
> 1. Validador Estático, Topológico DAG y Fidelidad de Dominio (17 Leyes Formales): `.agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js`
> 2. Suite Dinámica Multi-Escenario E2E en MongoDB Real (21 Aserciones): `.agents/skills/wappy-workflow-architecture/scripts/run-logical-test-suite.js`

---

## Registro #002 — Remediación Integral de Fidelidad de Dominio (8 Hitos Reales + Esquemas Mongoose Somos SST + Merge sin Pérdida)

- **Fecha:** `2026-11-11`
- **Versión del Catálogo:** `2026.11.11-v57-8hitos-domain-verified` (`55` flujos oficiales SG-SST sincronizados en Backend y Frontend)
- **Estado Global:** ✅ **100 % APROBADO (`55/55` presets válidos en las `17` leyes formales con `0` errores y `0` avisos; `21/21` pruebas E2E superadas contra MongoDB real con `0` residuos)**

### 1. Defectos de Dominio Resueltos de Raíz

1. **Separación Estricta entre Permiso Diario de Alturas (`PermisoAlturasData`) y Certificados Anuales (`PerfilSociodemograficoData`):**
   - Eliminado `hito3_alturas` (`Hito 5 · Permiso de Trabajo en Alturas`) de `#1 preset_vencimientos_emo_epp`, `#24 preset_inspeccion_equipos_alturas_certificados` y `#45 preset_certificacion_tareas_alto_riesgo_mintrabajo`.
   - En `#1 preset_vencimientos_emo_epp`, conectadas exclusivamente las **2 fuentes maestras reales**: `Hito 2 · Perfil Sociodemográfico` (`recordFilterMode: 'expiry_only'`, `expiryAuditScope: ['emo', 'alturas']`, `includeLatestReport: false`) y `Hito 5 · Entrega y Seguimiento de EPP` (`recordFilterMode: 'critical_only'`, `includeLatestReport: false`), asignado al agente **`Consultor SG-SST`** con salida estructurada en 3 secciones obligatorias (EMO Hito 2, Certificados Alturas Res. 4272/2021 Hito 2 y EPP Hito 5).
2. **Regla Inquebrantable `aplicaCursoAlturas` (`Sí aplica` vs. `No aplica`) y Modo `expiry_only` (`workflowNodeInspectorService.js`):**
   - Casilla vacía (`""`) o `"No aplica"` / `"N/A"` en `fechaCursoAlturasAutorizado` y `fechaCursoAlturasCoordinador` evalúa determinísticamente `'NO APLICA'` (`alturasAlert = false`), eliminando el 100 % de falsas alarmas de alturas en personal administrativo u operativo sin tareas de alturas.
   - Modo `recordFilterMode: 'expiry_only'` con `expiryAuditScope` aísla exclusivamente brechas de vencimiento documental (`EMO`, `Alturas`, `Licencia Vial`), impidiendo contaminación clínica (`fitScore < 75`, `Miopía`) y suprimiendo la inyección de `latestReportBlock` HTML antiguo.
3. **Corrección de Sobrescritura por Cédula en `logic_merge` (`automationScheduler.js`):**
   - Sustituido `{ ...rec, ...prev }` por acumulación en `_mergedFindings: string[]` por cada fuente conectada, preservando simultáneamente las brechas de `Hito 2` (EMO/Alturas) y `Hito 5` (cada fila de EPP vencido o fuera de servicio) para un mismo documento de identidad.
4. **Alineación Total de los 55 Presets con los 8 Hitos Oficiales (`HITO_APP_NODES`) y Nuevas Reglas 15, 16 y 17 (`validate-workflow-logic.js`):**
   - Reemplazado `extract_sst_workers` por `hito2_perfil_socio` (`source_read`) en `#13`, `#26`, `#32`, `#47` y `#52`.
   - Limpiadas todas las referencias erróneas de `Hito N` e IDs legacy engañosos (`hito3_epp`, `hito4_comites`, `hito2_matriz_ipevar`, `hito6_vulnerabilidad`, `hito5_capacitaciones`, etc.) en los 55 flujos (`35` presets con `98` errores detectados por las nuevas reglas -> **`0` errores y `0` avisos**).

### 2. Resultados Medidos del Bloque 7 E2E en MongoDB Real (`run-logical-test-suite.js`)

| Código | Escenario Sembrado en MongoDB Real | Resultado Medido | Estado |
| :-: | :--- | :--- | :-: |
| **B7.1** | `CC 70000001`: EMO vence en `10d`, `fechaCursoAlturasAutorizado: ""` | `isCritical=true`, `estadoExamenMedicoEMO="PRÓXIMO A VENCER"`, `aplicaCursoAlturas="No aplica"`, `0` mención de Alturas en motivos | ✅ PASS |
| **B7.2** | `CC 70000002`: EMO vigente (`+200d`), `fechaCursoAlturasAutorizado` hace `380d` | `isCritical=true`, `estadoExamenMedicoEMO="VIGENTE"`, `aplicaCursoAlturas="Sí aplica"`, `Curso Alturas Autorizado: VENCIDO` | ✅ PASS |
| **B7.3** | `CC 70000003`: Hito 2 al día, `SgsstEppData` con `Botas Dieléctricas` en `'Vencido'` | `isCritical=false` en Hito 2; entra al prompt desde `Hito 5 · Entrega y Seguimiento de EPP` con `Botas Dieléctricas` | ✅ PASS |
| **B7.4** | `CC 70000004`: Misma cédula con `EMO vencido` (Hito 2) **Y** `Casco Dieléctrico` `'Fuera de Servicio'` (Hito 5 EPP) | Sección `logic_merge` del prompt conserva **AMBOS** hallazgos bajo `CC 70000004` sin pisar ninguno | ✅ PASS |
| **B7.5** | `CC 70000005`: EMO vigente (`+200d`), Alturas `""`, EPP `'Entregado'` vigente, `fitScore: 65` y `enfermedades: "Miopía"` | `isCritical=false` en modo `expiry_only`; `0` aparición en el prompt recibido por el Agente IA (`0` contaminación clínica) | ✅ PASS |
| **CLEAN.1** | Limpieza atómica post-suite en todas las colecciones MongoDB | `0` documentos temporales residuales (`21/21` pruebas en `9.46s`) | ✅ PASS |

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

---

## 📋 Registro de Auditoría #003 — Endurecimiento del Validador DAG, Curación `#16–#30` (`v60`) y Alineación UI

- **Fecha:** `2026-11-13`
- **Catálogo auditado:** `api/server/services/systemWorkflowPresetsCatalog.js` (`SYSTEM_WORKFLOW_PRESETS_VERSION = '2026.11.13-v60-n8n-curated-30'`)
- **Validador endurecido:** `.agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js`
- **Suite E2E actualizada:** `.agents/skills/wappy-workflow-architecture/scripts/run-logical-test-suite.js` (`BLOQUE 1` y `BLOQUE 8.4`)

### 1. Cambios Auditados y Verificados
1. **Cero Hitos deshabilitados en producción (`PROD_DISABLED_HITO_IDS`):** Prohibido el uso de los 11 aplicativos deshabilitados (`hito1_matriz_legal`, `hito3_comite_pesv`, `hito3_brigada_emergencias`, `hito5_compras_sst`, `hito5_contratistas`, `hito5_gestion_cambio`, `hito5_equipos_emergencia`, `hito6_comunicaciones_sst`, `hito6_simulacros_emergencia`, `hito6_app_builder`, `hito7_investigacion_profunda`) en `#16–#30` y flujos `--file` custom (`[Inv-03 / PROD_DISABLED_HITO]`), manteniendo únicamente la exención legacy histórica en `#10` (`preset_vigilancia_matriz_legal_sst`).
2. **Alineación 100 % con `WappyNodeCustomEditors.tsx`:** Validación estricta de `notebookAction` (`consultar | agregar_fuente | generar_estudio` + `notebookArtifactType`), `flowAction` (`generar_imagen | generar_video` + `flowStyle` + `flowCameraMotion`), `flowAspectRatio` (`9:16 | 16:9 | 1:1`), `scriptEngine` (`auto_chrome_dom | fetch_cheerio | chrome_mcp | python_bs4 | node_cheerio | custom_script`) y exclusión mutua `notebooklm` vs `wappy_rag_documental`.
3. **Coherencia Etapa 2 y Metadatos Reales (`[Inv-00 / META]`, `[Inv-12]`, `[Inv-15]`):** Conteo exacto de fuentes paralelas de Etapa 2 sin `customNodes`, verificación estricta de los 23 agentes exactos de BD (`agentTargetName === agentName`), `scheduleType`, `scheduleConfig`, `cronExpression`, `trigger === triggers[0]`, `aiEngine: 'wappy'` y prohibición de menciones engañosas (*Matriz Legal*, *Contratistas*, *Compras*, *Gestión del Cambio*) en `#16–#30`.
4. **Reemplazo íntegro de `#16–#30`:** Los 15 presets nuevos mantienen `#1–#15` intactos y pasan con esquemas OCR completos (`>= 5` campos), configuraciones espejo y trazabilidad causal exacta.

### 2. Resultados Medidos Tras las Ediciones Finales
- **Validación estática y topológica (`node .agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js`):**
  - Resultado: **`30/30 PASS · 0 errores · 0 advertencias`** (`v=2026.11.13-v60-n8n-curated-30`)
  - Distribución IF: **`pre_agent=25 | post_agent=3 | direct=2`**
  - Categorías: **`salud_vencimientos=5 | drive_sincronizacion=5 | atel_inspecciones=6 | legal_cumplimiento=5 | riesgos_vial_quimico=5 | gerencia_auditoria=4`**
  - Validación por filtro `--preset preset_scraping_arl_afiliacion_ruaf`: **`1/1 PASS · 0 errores · 0 advertencias`** (preserva índice original `16 >= 15`).
  - Pruebas negativas de regresión (5 aserciones): bloquea `hito1_matriz_legal` en `#16–#30` y `--file`, bloquea coexistencia `notebooklm + wappy_rag_documental`, bloquea `logic_merge` con `< 2` fuentes reales en Etapa 2, bloquea agente fuera de BD en `#16–#30` y bloquea mención engañosa (`Matriz Legal`).
- **Suite lógica E2E contra MongoDB (`node .agents/skills/wappy-workflow-architecture/scripts/run-logical-test-suite.js`):**
  - Resultado: **`25/25 PRUEBAS LÓGICAS SUPERADAS AL 100% (4.53s)`** (`BLOQUE 1`..`BLOQUE 8`, incluyendo `CLEAN.1`: `0` documentos residuales en MongoDB).
