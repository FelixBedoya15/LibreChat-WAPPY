#!/usr/bin/env node
/**
 * Validador Determinista de Coherencia Lógica, Topológica DAG y Fidelidad de Dominio 8 Hitos para Flujos WAPPY IA (estilo n8n)
 * Verifica las 17 invariantes arquitectónicas y de dominio real sobre systemWorkflowPresetsCatalog.js o un archivo JSON.
 *
 * Uso:
 *   node .agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js
 *   node .agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js --preset preset_vencimientos_emo_epp
 */

const path = require('path');
const fs = require('fs');

const MISLEADING_LEGACY_HITO_IDS = [
  'hito3_epp',
  'hito4_comites',
  'hito2_matriz_ipevar',
  'hito6_vulnerabilidad',
  'hito5_capacitaciones',
  'hito4_actos_condiciones',
  'hito3_owas',
  'hito3_estudio_puesto',
  'hito3_ats',
  'hito3_alturas',
  'hito3_vehiculos',
  'hito3_matriz_pesv',
  'hito3_quimicos_sga',
];

function loadRealCatalogMetadata() {
  const hitoNodesMap = new Map();
  const constructionNodeIds = new Set();
  try {
    const tsPath = path.resolve(
      __dirname,
      '../../../../client/src/components/SGSST/workflowNodesCatalog.ts',
    );
    const tsSource = fs.readFileSync(tsPath, 'utf8');

    // Extraer todos los nodos con defaultConstruction: true en cualquier arreglo del catálogo TS
    for (const objMatch of tsSource.matchAll(/\{\s*id:\s*'([^']+)'([\s\S]*?)\n  \},/g)) {
      const nodeId = objMatch[1];
      const body = objMatch[2] || '';
      if (/defaultConstruction:\s*true/.test(body)) {
        constructionNodeIds.add(nodeId);
      }
    }

    // Extraer HITO_APP_NODES reales con su hitoId ('hito1'..'hito8') y etiqueta oficial
    const hitoArrayMatch = tsSource.match(
      /export const HITO_APP_NODES:\s*WorkflowNodeDef\[\]\s*=\s*\[([\s\S]*?)\n\];/,
    );
    if (hitoArrayMatch && hitoArrayMatch[1]) {
      for (const m of hitoArrayMatch[1].matchAll(
        /\{\s*id:\s*'([^']+)'[\s\S]*?hitoId:\s*'hito(\d+)'([\s\S]*?)\n  \},/g,
      )) {
        const id = m[1];
        const hitoNumber = Number(m[2]);
        const rest = m[3] || '';
        const labelMatch = rest.match(/label:\s*'([^']+)'/);
        const defaultConstruction = /defaultConstruction:\s*true/.test(m[0]);
        if (defaultConstruction) {
          constructionNodeIds.add(id);
        }
        hitoNodesMap.set(id, {
          id,
          hitoId: `hito${hitoNumber}`,
          hitoNumber,
          label: labelMatch ? labelMatch[1] : id,
          defaultConstruction,
        });
      }
    }
  } catch (err) {
    console.warn('[validate-workflow-logic] Aviso leyendo workflowNodesCatalog.ts:', err.message);
  }
  return { hitoNodesMap, constructionNodeIds };
}

const {
  hitoNodesMap: REAL_HITO_NODES_MAP,
  constructionNodeIds: REAL_CONSTRUCTION_NODE_IDS,
} = loadRealCatalogMetadata();

const ALLOWED_TEXT_MODELS = new Set([
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
]);

const BLOCKED_NODE_IDS = new Set([
  'trigger_whatsapp',
  'extract_onedrive',
  'one_drive',
  'scraper_agy_pensiones_directo',
  'scraper_agy_salud_rethus',
  // 8 Aplicativos en construcción por defecto en Somos SST (DEFAULT_CONSTRUCTION_APP_IDS)
  'hito1_matriz_legal',
  'hito3_comite_pesv',
  'hito3_brigada_emergencias',
  'hito5_equipos_emergencia',
  'hito6_comunicaciones_sst',
  'hito6_simulacros_emergencia',
  'hito6_app_builder',
  'hito7_investigacion_profunda',
]);

const VALID_TRIGGERS = new Set([
  'schedule_cron',
  'trigger_tenshi',
  'trigger_antigravity',
  'trigger_antigravity_cloud',
  'trigger_email',
  'trigger_email_in',
  'trigger_agent',
  'trigger_qr_worker',
  'trigger_webhook',
  'trigger_webhook_in',
]);

const VALID_MEMORIES = new Set([
  'wappy_memory_company',
  'wappy_memory_antiduplicate',
  'wappy_rag_documental',
  'wappy_memory_procedural',
]);

const VALID_OUTPUTS = new Set([
  'email_report',
  'wappy_notification',
  'tenshi_alert',
  'acpm_task',
  'wappy_kanban',
  'canvas_doc',
  'somos_sst_update',
  'antigravity_local_report',
  'antigravity_cloud_report',
  'google_docs',
  'google_sheets',
  'google_slides',
  'google_calendar',
]);

// Grupos de exclusión mutua: nunca deben coexistir 2 nodos del mismo dominio de lectura
const MUTUAL_EXCLUSION_GROUPS = [
  {
    domain: 'Trabajadores y Exámenes EMO (SgsstWorker / PerfilSociodemografico)',
    nodes: ['hito2_perfil_socio', 'extract_sst_workers', 'somos_sst_trabajadores', 'somos_sst_examenes'],
  },
  {
    domain: 'Dotación e Inventario EPP (SgsstEppData / Inventory / Solicitud)',
    nodes: ['hito3_epp', 'somos_sst_epp'],
  },
  {
    domain: 'Perfiles de Cargo (PerfilCargoData)',
    nodes: ['hito2_perfiles_cargo', 'hito1_perfiles_cargo', 'somos_sst_perfiles_cargo'],
  },
  {
    domain: 'Matriz IPEVR GTC-45 (MatrizIPEVAR)',
    nodes: ['hito2_matriz_ipevar', 'matriz_ipevar'],
  },
  {
    domain: 'Matriz PESV (MatrizPESV)',
    nodes: ['hito3_matriz_pesv', 'matriz_pesv'],
  },
  {
    domain: 'Compatibilidad Química SGA (MatrizCompatibilidad)',
    nodes: ['hito3_quimicos_sga', 'matriz_compatibilidad'],
  },
];

// Herramientas locales en `inputs[]` que duplican extractores/hitos de Etapa 2
const REDUNDANT_LOCAL_TABLE_TOOLS = new Set([
  'somos_sst_trabajadores',
  'somos_sst_examenes',
  'somos_sst_epp',
  'somos_sst_perfiles_cargo',
  'matriz_ipevar',
  'matriz_pesv',
  'matriz_compatibilidad',
]);

function getHitoConfig(nodeConfigs, hitoId) {
  if (!nodeConfigs || typeof nodeConfigs !== 'object') return {};
  return (
    nodeConfigs[`tool_hitos_${hitoId}`] ||
    nodeConfigs[`hito_${hitoId}`] ||
    nodeConfigs[hitoId] ||
    {}
  );
}

function resolveHitoRole(nodeConfigs, hitoId) {
  const cfg = getHitoConfig(nodeConfigs, hitoId);
  if (cfg.hitoRole === 'source_read' || cfg.hitoRole === 'target_write_report') {
    return cfg.hitoRole;
  }
  if (
    cfg.appActionMode === 'write_and_report' ||
    cfg.appActionMode === 'write_and_update' ||
    cfg.appActionMode === 'generate_report' ||
    cfg.generateAppReport === true ||
    cfg.hitoOperationMode === 'write_register' ||
    cfg.hitoOperationMode === 'audit_and_update'
  ) {
    return 'target_write_report';
  }
  if (cfg.hitoOperationMode === 'read_only') {
    return 'source_read';
  }
  return null; // No declarado explícitamente -> Falla Invariante 5
}

function validateSingleWorkflow(preset, index = 0) {
  const errors = [];
  const warnings = [];
  const key = preset.presetKey || preset.name || `workflow_${index + 1}`;
  const wf = preset.workflowNodes || {};
  const nodeConfigs = wf?.canvasLayout?.nodeConfigs || {};
  const logicNodes = Array.isArray(wf?.canvasLayout?.logicNodes) ? wf.canvasLayout.logicNodes : [];
  const customNodes = Array.isArray(wf?.canvasLayout?.customNodes) ? wf.canvasLayout.customNodes : [];

  const triggers = Array.isArray(wf.triggers) ? wf.triggers : wf.trigger ? [wf.trigger] : [];
  const extractors = Array.isArray(wf.extractors) ? wf.extractors : [];
  const memories = Array.isArray(wf.memories) ? wf.memories : wf.memoryNode ? [wf.memoryNode] : [];
  const inputs = Array.isArray(wf.inputs) ? wf.inputs : [];
  const hitos = Array.isArray(wf.hitos) ? wf.hitos : [];
  const outputs = Array.isArray(wf.outputs) ? wf.outputs : [];

  // Invariante 1: Disparadores válidos
  if (triggers.length === 0) {
    errors.push('[Inv-01] El flujo no tiene ningún disparador en `triggers[]`.');
  }
  for (const t of triggers) {
    if (!VALID_TRIGGERS.has(t)) {
      errors.push(`[Inv-01] Disparador inválido o bloqueado: "${t}".`);
    }
  }

  // Invariante 2: Modelo IA verificado en .env
  if (!ALLOWED_TEXT_MODELS.has(wf.aiModel)) {
    errors.push(
      `[Inv-02] Modelo IA "${wf.aiModel}" no pertenece a GOOGLE_MODELS verificados (${Array.from(ALLOWED_TEXT_MODELS).join(', ')}).`,
    );
  }
  if (extractors.includes('extract_ai_doc_ocr')) {
    const aiExtCfg =
      nodeConfigs.extractor_extract_ai_doc_ocr || nodeConfigs.extract_ai_doc_ocr || {};
    if (aiExtCfg.aiModel && !ALLOWED_TEXT_MODELS.has(aiExtCfg.aiModel)) {
      errors.push(
        `[Inv-02] Modelo IA "${aiExtCfg.aiModel}" en "extract_ai_doc_ocr" no pertenece a GOOGLE_MODELS verificados (${Array.from(ALLOWED_TEXT_MODELS).join(', ')}).`,
      );
    }
  }

  // Invariante 3: Cero nodos en construcción / bloqueados
  const allReferencedIds = [
    ...triggers,
    ...extractors,
    ...memories,
    ...inputs,
    ...hitos,
    ...outputs,
    ...customNodes.map((cn) => cn?.id || cn?.nodeType || cn?.key || ''),
  ];
  for (const nid of allReferencedIds) {
    if (BLOCKED_NODE_IDS.has(nid)) {
      errors.push(`[Inv-03] Nodo bloqueado/en construcción detectado: "${nid}".`);
    }
  }

  // Invariante 4: Cero redundancia / solapamiento de fuentes de datos
  const activeSet = new Set([...extractors, ...inputs, ...hitos, ...memories]);
  for (const group of MUTUAL_EXCLUSION_GROUPS) {
    const present = group.nodes.filter((n) => activeSet.has(n));
    if (present.length > 1) {
      errors.push(
        `[Inv-04] Redundancia prohibida en "${group.domain}": coexisten [${present.join(', ')}]. Usa UNA sola fuente canónica.`,
      );
    }
  }
  if (extractors.includes('extract_sst_app') && hitos.length > 0) {
    errors.push(
      `[Inv-04] Redundancia prohibida: "extract_sst_app" genérico coexiste con aplicativos Hito explícitos [${hitos.join(', ')}]. Usa directamente el nodo Hito específico en modo source_read.`,
    );
  }
  if (memories.includes('wappy_memory_company') && inputs.includes('somos_sst_empresa')) {
    const empCfg = nodeConfigs.tool_inputs_somos_sst_empresa || nodeConfigs.somos_sst_empresa || {};
    if (empCfg.allowCompanyWrite !== true) {
      errors.push(
        '[Inv-04] Redundancia prohibida: "wappy_memory_company" (Memoria ◆) y "somos_sst_empresa" (Herramienta +) leen el mismo perfil empresarial.',
      );
    }
  }
  if (extractors.includes('extract_drive') && inputs.includes('google_drive')) {
    errors.push(
      '[Inv-04] Redundancia visual en lienzo: "extract_drive" ya pre-lista la carpeta Drive e inyecta la herramienta de lectura al Agente; no dupliques "google_drive" en inputs[].',
    );
  }
  if (
    (extractors.includes('extract_gmail') || triggers.includes('trigger_email_in')) &&
    inputs.includes('google_gmail')
  ) {
    errors.push(
      '[Inv-04] Redundancia visual en lienzo: ya existe ingesta Gmail en Etapa 1/2; no dupliques "google_gmail" en inputs[].',
    );
  }

  // Invariante 5: Rol causal explícito en TODOS los aplicativos Hito (`source_read` vs `target_write_report`)
  const sourceHitos = [];
  const targetHitos = [];
  for (const hId of hitos) {
    const role = resolveHitoRole(nodeConfigs, hId);
    const cfg = getHitoConfig(nodeConfigs, hId);
    if (!role) {
      errors.push(
        `[Inv-05] El aplicativo Hito "${hId}" no declara rol causal explícito (\`hitoRole: "source_read" | "target_write_report"\`) en canvasLayout.nodeConfigs.`,
      );
    } else if (role === 'source_read') {
      sourceHitos.push(hId);
      if (
        cfg.appActionMode === 'write_and_report' ||
        cfg.appActionMode === 'write_and_update' ||
        cfg.generateAppReport === true
      ) {
        errors.push(
          `[Inv-05] Contradicción causal en "${hId}": declarado como "source_read" pero tiene banderas de escritura/informe activas.`,
        );
      }
    } else {
      targetHitos.push(hId);
      const hasValidTargetAction =
        cfg.appActionMode === 'write_and_report' ||
        cfg.appActionMode === 'write_and_update' ||
        cfg.appActionMode === 'generate_report' ||
        cfg.generateAppReport === true ||
        cfg.hitoOperationMode === 'write_register' ||
        cfg.hitoOperationMode === 'audit_and_update';
      if (!hasValidTargetAction) {
        errors.push(
          `[Inv-05] El Hito destino "${hId}" ("target_write_report") debe declarar qué acción ejecuta (write_and_report, write_and_update o generate_report).`,
        );
      }
    }
  }

  // Invariante 6 & 7 & 8: Coherencia de Compuerta Condicional `Condición Sí/No` (`pre_agent` vs `post_agent`) y Ramas
  const hasScrapers = customNodes.some((cn) =>
    String(cn?.id || cn?.key || cn?.nodeType || '').includes('scraper_agy'),
  );
  const upstreamProducerCount =
    extractors.length + sourceHitos.length + (hasScrapers ? 1 : 0);

  if (wf.includeIfNode) {
    const ifCfg = nodeConfigs.if_router || nodeConfigs.if_condition || {};
    const placement = ifCfg.ifPlacement;
    if (placement !== 'pre_agent' && placement !== 'post_agent') {
      errors.push(
        '[Inv-06] `includeIfNode: true` requiere declarar explícitamente `if_router.ifPlacement` como `"pre_agent"` o `"post_agent"`.',
      );
    }
    if (!ifCfg.ifConditionLabel || String(ifCfg.ifConditionLabel).trim().length < 5) {
      errors.push('[Inv-06] `if_router.ifConditionLabel` debe contener una pregunta clara y concisa.');
    }
    if (placement === 'pre_agent' && upstreamProducerCount === 0) {
      errors.push(
        '[Inv-06] `ifPlacement: "pre_agent"` inválido: no existe ninguna fuente de datos en Etapa 2 (`extractors`, `source_read` Hitos o Scraper) antes de la compuerta.',
      );
    }

    const yesOuts = [];
    const noOuts = [];
    for (const outId of outputs) {
      if (!VALID_OUTPUTS.has(outId)) {
        errors.push(`[Inv-07] Nodo de salida desconocido: "${outId}".`);
      }
      const outCfg = nodeConfigs[`out_${outId}`] || nodeConfigs[outId] || {};
      if (outCfg.ifBranch !== 'yes' && outCfg.ifBranch !== 'no') {
        errors.push(
          `[Inv-07] La salida "${outId}" debe declarar explícitamente \`ifBranch: "yes" | "no"\` en nodeConfigs["out_${outId}"].`,
        );
      } else if (outCfg.ifBranch === 'yes') {
        yesOuts.push(outId);
      } else {
        noOuts.push(outId);
      }
    }
    if (yesOuts.length === 0) {
      errors.push('[Inv-07] La Rama SÍ (`ifBranch: "yes"`) no tiene ninguna salida conectada.');
    }
    if (noOuts.length === 0) {
      errors.push('[Inv-07] La Rama NO (`ifBranch: "no"`) no tiene ninguna salida conectada.');
    }
    const overlap = yesOuts.filter((o) => noOuts.includes(o));
    if (overlap.length > 0) {
      errors.push(`[Inv-07] Salidas duplicadas entre Rama SÍ y Rama NO: [${overlap.join(', ')}].`);
    }

    // Invariante 8: Proporcionalidad en Rama NO
    const forbiddenInNo = noOuts.filter(
      (o) => o === 'acpm_task' || o === 'wappy_kanban' || o === 'somos_sst_update',
    );
    if (forbiddenInNo.length > 0) {
      errors.push(
        `[Inv-08] Incoherencia operativa en Rama NO: [${forbiddenInNo.join(', ')}] no debe ejecutarse cuando NO hay hallazgos.`,
      );
    }
  } else if (outputs.length === 0) {
    errors.push('[Inv-07] El flujo directo (`includeIfNode: false`) debe tener al menos 1 salida.');
  }

  // Invariante 9: Disciplina Anti-Duplicados en flujos programados con escalamiento pre_agent
  const ifPlacement = (nodeConfigs.if_router || {}).ifPlacement;
  const hasEscalationOnYes =
    outputs.includes('acpm_task') || outputs.includes('email_report') || outputs.includes('google_calendar');
  if (
    triggers.includes('schedule_cron') &&
    wf.includeIfNode &&
    ifPlacement === 'pre_agent' &&
    hasEscalationOnYes &&
    (preset.scheduleType === 'daily' || preset.scheduleType === 'hourly' || preset.scheduleType === 'weekly')
  ) {
    if (!memories.includes('wappy_memory_antiduplicate')) {
      errors.push(
        '[Inv-09] Todo flujo recurrente (hourly/daily/weekly) con compuerta `pre_agent` y alertas/ACPM debe incluir `wappy_memory_antiduplicate` para no repetir las mismas alertas en cada corrida.',
      );
    } else {
      const dedupCfg =
        nodeConfigs.sub_memory_wappy_memory_antiduplicate ||
        nodeConfigs.sub_memory ||
        nodeConfigs.wappy_memory_antiduplicate ||
        {};
      if (!['24h', '7d', '30d', 'all'].includes(dedupCfg.dedupWindow)) {
        warnings.push(
          '[Inv-09] Se recomienda declarar explícitamente `dedupWindow` ("24h" | "7d" | "30d" | "all") en `sub_memory_wappy_memory_antiduplicate`.',
        );
      }
    }
  }

  // Invariante 10: Pureza del puerto `Herramienta +` (`inputs[]`)
  for (const inId of inputs) {
    if (REDUNDANT_LOCAL_TABLE_TOOLS.has(inId)) {
      errors.push(
        `[Inv-10] "${inId}" en \`inputs[]\` (Herramienta +) es un extractor redundante de tabla local. Usa el aplicativo Hito canónico en modo \`source_read\` en Etapa 2.`,
      );
    }
  }
  if (inputs.length > 3) {
    errors.push(
      `[Inv-10] Sobrecarga en puerto Herramienta + (${inputs.length} nodos): máximo 3 herramientas externas/consultivas reales por Agente.`,
    );
  }

  // Invariante 11 & 12: Coherencia de `logic_merge` y `logic_loop`
  const hasMerge = logicNodes.some((ln) => ln?.logicType === 'merge');
  const hasLoop = logicNodes.some((ln) => ln?.logicType === 'loop');
  if (hasMerge && upstreamProducerCount < 2) {
    errors.push(
      `[Inv-11] Nodo "logic_merge" incoherente: requiere >= 2 fuentes de lectura en Etapa 2 (actual: ${upstreamProducerCount}).`,
    );
  }
  if (hasLoop && upstreamProducerCount < 1) {
    errors.push(
      '[Inv-12] Nodo "logic_loop" incoherente: requiere al menos 1 colección fuente en Etapa 2 para iterar en lotes.',
    );
  }

  // Invariante 13: Coherencia de Memorias
  for (const m of memories) {
    if (!VALID_MEMORIES.has(m)) {
      errors.push(`[Inv-13] Nodo de memoria desconocido: "${m}".`);
    }
  }
  if (new Set(memories).size !== memories.length) {
    errors.push('[Inv-13] Memorias duplicadas en `memories[]`.');
  }

  // Invariante 14: Fidelidad Prompt <-> Grafo (el prompt no debe mencionar IDs eliminados/ausentes)
  const promptStr = String(preset.prompt || '');
  const forbiddenGhostIds = [
    'somos_sst_trabajadores',
    'somos_sst_examenes',
    'somos_sst_epp',
    'somos_sst_perfiles_cargo',
    'extract_sst_workers',
    'extract_sst_app',
  ];
  for (const ghostId of forbiddenGhostIds) {
    if (promptStr.includes(ghostId) && !activeSet.has(ghostId)) {
      errors.push(
        `[Inv-14] El prompt menciona el identificador "${ghostId}" pero ese nodo NO existe en el grafo del flujo.`,
      );
    }
  }

  // Regla 15 (DOMAIN_HITO_NUMBER_MISMATCH): Fidelidad de numeración de Hito (1..8) contra HITO_APP_NODES reales y prohibición de IDs legacy engañosos en texto natural
  const connectedHitoNumbers = new Set();
  for (const hId of hitos) {
    const meta = REAL_HITO_NODES_MAP.get(hId);
    if (meta && Number.isFinite(meta.hitoNumber)) {
      connectedHitoNumbers.add(meta.hitoNumber);
    } else {
      const fallbackMatch = String(hId).match(/^hito([1-8])_/i);
      if (fallbackMatch) connectedHitoNumbers.add(Number(fallbackMatch[1]));
    }
  }

  const textSurfaces = [
    { surface: 'name', text: String(preset.name || '') },
    {
      surface: 'presetDescription',
      text: String(preset.presetDescription || preset.description || ''),
    },
    { surface: 'prompt', text: promptStr },
  ];
  for (const [cfgKey, cfgObj] of Object.entries(nodeConfigs)) {
    if (cfgObj && typeof cfgObj.customInstruction === 'string' && cfgObj.customInstruction.trim()) {
      textSurfaces.push({
        surface: `nodeConfigs.${cfgKey}.customInstruction`,
        text: cfgObj.customInstruction,
      });
    }
  }

  for (const { surface, text } of textSurfaces) {
    if (!text) continue;
    for (const hMatch of text.matchAll(/\bHito\s*([1-8])\b/gi)) {
      const mentionedNum = Number(hMatch[1]);
      if (!connectedHitoNumbers.has(mentionedNum)) {
        errors.push(
          `[Inv-15 / DOMAIN_HITO_NUMBER_MISMATCH] "${surface}" menciona "Hito ${mentionedNum}", pero los únicos Hitos reales conectados en el flujo son [${
            Array.from(connectedHitoNumbers)
              .sort((a, b) => a - b)
              .map((n) => `Hito ${n}`)
              .join(', ') || 'Ninguno'
          }].`,
        );
      }
    }
    for (const legacyId of MISLEADING_LEGACY_HITO_IDS) {
      if (text.includes(legacyId)) {
        const realMeta = REAL_HITO_NODES_MAP.get(legacyId);
        const suggestion = realMeta ? realMeta.label : legacyId;
        errors.push(
          `[Inv-15 / DOMAIN_HITO_NUMBER_MISMATCH] "${surface}" contiene el ID interno legacy engañoso "${legacyId}". Reemplázalo por su etiqueta de dominio real «${suggestion}».`,
        );
      }
    }
  }

  // Regla 16 (DOMAIN_CONSTRUCTION_APP_BLOCKED): Bloqueo estricto de cualquier nodo con defaultConstruction: true en workflowNodesCatalog.ts
  for (const id of activeSet) {
    if (REAL_CONSTRUCTION_NODE_IDS.has(id)) {
      errors.push(
        `[Inv-16 / DOMAIN_CONSTRUCTION_APP_BLOCKED] El flujo usa el nodo "${id}" marcado con \`defaultConstruction: true\` en \`workflowNodesCatalog.ts\`.`,
      );
    }
  }

  // Regla 17 (DOMAIN_PERMISO_ALTURAS_MISUSE): Prohibido usar hito3_alturas (Permiso operativo diario de tarea en campo) como fuente de vencimientos de cursos/certificados de formación
  if (hitos.includes('hito3_alturas')) {
    const combinedDomainText = `${key} ${preset.name || ''} ${preset.presetDescription || ''} ${promptStr}`.toLowerCase();
    const isTrainingOrCertAudit =
      /(?:vencimiento|vigencia|certificad|curso|reentrenamiento|formaci[oó]n|mintrabajo|sena|emo\b)/i.test(
        combinedDomainText,
      ) &&
      !/\b(?:an[aá]lisis de trabajo seguro|ats\b|pron[oó]stico|clima|meteorol|tormenta|lluvia|viento)\b/i.test(
        `${key} ${preset.name || ''}`,
      );
    if (isTrainingOrCertAudit) {
      errors.push(
        '[Inv-17 / DOMAIN_PERMISO_ALTURAS_MISUSE] El flujo audita vencimientos de certificados/cursos de formación o equipos pero conecta "hito3_alturas" (Hito 5 · Permiso de Trabajo en Alturas — permiso diario de tarea en campo). Usa "hito2_perfil_socio" (fechaCursoAlturasAutorizado / fechaCursoAlturasCoordinador) o "hito5_equipos_alturas".',
      );
    }
  }

  return {
    presetKey: key,
    name: preset.name || key,
    valid: errors.length === 0,
    ifPlacement: wf.includeIfNode ? (nodeConfigs.if_router || {}).ifPlacement || 'missing' : 'direct',
    sourceHitos,
    targetHitos,
    extractors,
    inputs,
    memories,
    outputs,
    errors,
    warnings,
  };
}

function main() {
  const args = process.argv.slice(2);
  const presetFilterIdx = args.indexOf('--preset');
  const presetFilter = presetFilterIdx >= 0 ? args[presetFilterIdx + 1] : null;
  const jsonFileIdx = args.indexOf('--file');
  const jsonFile = jsonFileIdx >= 0 ? args[jsonFileIdx + 1] : null;

  let workflows = [];
  if (jsonFile) {
    const raw = JSON.parse(fs.readFileSync(path.resolve(jsonFile), 'utf8'));
    workflows = Array.isArray(raw) ? raw : [raw];
  } else {
    const catalogPath = path.resolve(
      __dirname,
      '../../../../api/server/services/systemWorkflowPresetsCatalog.js',
    );
    delete require.cache[catalogPath];
    const mod = require(catalogPath);
    workflows = mod.SYSTEM_WORKFLOW_PRESETS_CATALOG || [];
  }

  if (presetFilter) {
    workflows = workflows.filter((w) => w.presetKey === presetFilter || w.name?.includes(presetFilter));
  }

  if (workflows.length === 0) {
    console.error('❌ No se encontraron flujos para validar.');
    process.exit(1);
  }

  let validCount = 0;
  let invalidCount = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  const archetypeStats = { pre_agent: 0, post_agent: 0, direct: 0, missing: 0 };

  console.log(`\n🔍 VALIDACIÓN DETERMINISTA DE ARQUITECTURA DE FLUJOS WAPPY (${workflows.length} flujo(s))\n` + '═'.repeat(88));

  for (let i = 0; i < workflows.length; i++) {
    const report = validateSingleWorkflow(workflows[i], i);
    archetypeStats[report.ifPlacement] = (archetypeStats[report.ifPlacement] || 0) + 1;
    totalWarnings += report.warnings.length;

    if (report.valid) {
      validCount++;
      if (presetFilter || workflows.length <= 5) {
        console.log(
          `✅ [${report.presetKey}] ${report.name}\n` +
            `   • Topología: IF=${report.ifPlacement} | Etapa2(Read)=[${[...report.extractors, ...report.sourceHitos].join(', ') || 'Evento directo'}] -> EtapaDestino(Write/Report)=[${report.targetHitos.join(', ') || 'Ninguno'}] | Tools=[${report.inputs.join(', ') || '0'}]`,
        );
      }
    } else {
      invalidCount++;
      totalErrors += report.errors.length;
      console.log(`❌ [${report.presetKey}] ${report.name} (${report.errors.length} error(es)):`);
      for (const err of report.errors) {
        console.log(`   ↳ ${err}`);
      }
    }
    if (presetFilter && report.warnings.length > 0) {
      for (const w of report.warnings) {
        console.log(`   ⚠️ ${w}`);
      }
    }
  }

  console.log('═'.repeat(88));
  console.log(
    `📊 RESUMEN: ${validCount}/${workflows.length} válidos | ${invalidCount} con fallos lógicos (${totalErrors} errores, ${totalWarnings} avisos)`,
  );
  console.log(
    `🧭 DISTRIBUCIÓN IF: pre_agent=${archetypeStats.pre_agent || 0} | post_agent=${archetypeStats.post_agent || 0} | direct=${archetypeStats.direct || 0}${archetypeStats.missing ? ` | sin_declarar=${archetypeStats.missing}` : ''}\n`,
  );

  process.exit(invalidCount === 0 ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  validateSingleWorkflow,
  resolveHitoRole,
  MUTUAL_EXCLUSION_GROUPS,
};
