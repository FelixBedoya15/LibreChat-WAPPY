#!/usr/bin/env node
/**
 * Validador Determinista de Coherencia Lógica, Topológica DAG y Arquitectura n8n (AI Agent + Tools)
 * Verifica uno por uno los 15 Flujos Maestros Curados de systemWorkflowPresetsCatalog.js (o un JSON externo).
 *
 * Uso:
 *   node .agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js
 *   node .agents/skills/wappy-workflow-architecture/scripts/validate-workflow-logic.js --preset preset_vencimientos_emo_alturas
 */

const path = require('path');
const fs = require('fs');

const EXPECTED_CATALOG_COUNT = 15;
const EXPECTED_CATALOG_VERSION = '2026.11.12-v58-n8n-curated-15';

const ALLOWED_PRESET_CATEGORIES = new Set([
  'salud_vencimientos',
  'drive_sincronizacion',
  'atel_inspecciones',
  'legal_cumplimiento',
  'riesgos_vial_quimico',
  'gerencia_auditoria',
]);

// Aplicativos habilitados explícitamente en el backend (MatrizLegalData en ~/server/routes/sgsst/matriz)
const BACKEND_ENABLED_HITO_IDS = new Set(['hito1_matriz_legal']);

// Mapa estático de respaldo de los 8 Hitos reales (en caso de lectura sin TS)
const FALLBACK_HITO_MAP = {
  hito1_dofa: { hitoNumber: 1, label: 'Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders)' },
  hito1_diagnostico_0312: { hitoNumber: 1, label: 'Hito 1 · Diagnóstico Inicial Estándares Mínimos (Res. 0312)' },
  hito1_responsable: { hitoNumber: 1, label: 'Hito 1 · Responsable SG-SST (Licencia e Idoneidad)' },
  hito1_politica_objetivos: { hitoNumber: 1, label: 'Hito 1 · Política de SST' },
  hito1_objetivos: { hitoNumber: 1, label: 'Hito 1 · Objetivos de SST (Indicadores)' },
  hito1_matriz_legal: { hitoNumber: 1, label: 'Hito 1 · Matriz Legal' },
  hito1_rhs: { hitoNumber: 1, label: 'Hito 1 · Reglamento de Higiene (RHS)' },
  hito1_rit: { hitoNumber: 1, label: 'Hito 1 · Reglamento Interno (RIT)' },
  hito1_participacion_ipevar: { hitoNumber: 1, label: 'Hito 1 · Participación IPEVR Comunitaria' },
  hito2_matriz_ipevar: { hitoNumber: 1, label: 'Hito 1 · Matriz IPEVR (GTC 45)' },
  hito3_matriz_pesv: { hitoNumber: 1, label: 'Hito 1 · Matriz de Riesgos Viales (PESV)' },
  hito3_quimicos_sga: { hitoNumber: 1, label: 'Hito 1 · Matriz de Compatibilidad Química (SGA)' },
  hito1_oportunidades_sst: { hitoNumber: 1, label: 'Hito 1 · Riesgos del Sistema y Oportunidades SST' },
  hito6_vulnerabilidad: { hitoNumber: 1, label: 'Hito 1 · Análisis de Vulnerabilidad' },
  hito1_plan_emergencias: { hitoNumber: 1, label: 'Hito 1 · Plan de Emergencias y Contingencias (PPRE)' },
  hito2_perfiles_cargo: { hitoNumber: 2, label: 'Hito 2 · Perfiles de Cargo (Roles)' },
  hito2_perfil_socio: { hitoNumber: 2, label: 'Hito 2 · Perfil Sociodemográfico' },
  hito2_condiciones_salud: { hitoNumber: 2, label: 'Hito 2 · Informe Condiciones de Salud' },
  hito2_oraculo_predictivo: { hitoNumber: 2, label: 'Hito 2 · Dictamen de Compatibilidad Cargo-Persona' },
  hito4_comites: { hitoNumber: 3, label: 'Hito 3 · COPASST / Vigía de SST' },
  hito3_cocolab: { hitoNumber: 3, label: 'Hito 3 · Comité de Convivencia Laboral' },
  hito4_bio_ipevar: { hitoNumber: 4, label: 'Hito 4 · Matriz Bio-IPEVR' },
  hito3_owas: { hitoNumber: 4, label: 'Hito 4 · Método OWAS (Evaluación Ergonómica)' },
  hito3_estudio_puesto: { hitoNumber: 4, label: 'Hito 4 · Estudio de Puesto de Trabajo (EPT)' },
  hito4_psicosocial: { hitoNumber: 4, label: 'Hito 4 · Termómetro Psicosocial' },
  hito5_compras_sst: { hitoNumber: 5, label: 'Hito 5 · Compras y Adquisiciones en SST' },
  hito5_contratistas: { hitoNumber: 5, label: 'Hito 5 · Control y Gestión de Contratistas' },
  hito5_gestion_cambio: { hitoNumber: 5, label: 'Hito 5 · Gestión del Cambio en SST (MOC)' },
  hito3_ats: { hitoNumber: 5, label: 'Hito 5 · Análisis de Trabajo Seguro (ATS)' },
  hito3_alturas: { hitoNumber: 5, label: 'Hito 5 · Permiso de Trabajo en Alturas' },
  hito5_equipos_alturas: { hitoNumber: 5, label: 'Hito 5 · Hoja de Vida de Equipos de Alturas' },
  hito3_epp: { hitoNumber: 5, label: 'Hito 5 · Entrega y Seguimiento de EPP' },
  hito5_registro_quimico: { hitoNumber: 5, label: 'Hito 5 · Registro y Rótulo de Productos Químicos' },
  hito3_vehiculos: { hitoNumber: 5, label: 'Hito 5 · Hoja de Vida Automotores (PESV)' },
  hito5_capacitaciones: { hitoNumber: 6, label: 'Hito 6 · Programa de Capacitación SG-SST' },
  hito6_ruta_aprendizaje: { hitoNumber: 6, label: 'Hito 6 · Rutas de Aprendizaje (LMS)' },
  hito4_actos_condiciones: { hitoNumber: 6, label: 'Hito 6 · Reporte de Actos y Condiciones' },
  hito7_estadisticas_atel: { hitoNumber: 7, label: 'Hito 7 · Gestión Integral de Ausentismo & ATEL' },
  hito7_investigacion_atel: { hitoNumber: 7, label: 'Hito 7 · Investigación ATEL' },
  hito7_acpm: { hitoNumber: 7, label: 'Hito 7 · Tablero Kanban ACPM' },
  hito7_auditoria: { hitoNumber: 7, label: 'Hito 7 · Informe de Auditoría SG-SST' },
  hito7_alta_direccion: { hitoNumber: 7, label: 'Hito 7 · Revisión por la Alta Dirección' },
  hito8_predictivo: { hitoNumber: 8, label: 'Hito 8 · Centro de Inteligencia Predictiva' },
};

function loadRealCatalogMetadata() {
  const hitoNodesMap = new Map();
  for (const [id, info] of Object.entries(FALLBACK_HITO_MAP)) {
    hitoNodesMap.set(id, {
      id,
      hitoId: `hito${info.hitoNumber}`,
      hitoNumber: info.hitoNumber,
      label: info.label,
      defaultConstruction: false,
    });
  }

  const constructionNodeIds = new Set();
  try {
    const tsPath = path.resolve(
      __dirname,
      '../../../../client/src/components/SGSST/workflowNodesCatalog.ts',
    );
    const tsSource = fs.readFileSync(tsPath, 'utf8');

    for (const objMatch of tsSource.matchAll(/\{\s*id:\s*'([^']+)'([\s\S]*?)\n  \},/g)) {
      const nodeId = objMatch[1];
      const body = objMatch[2] || '';
      if (/defaultConstruction:\s*true/.test(body) && !BACKEND_ENABLED_HITO_IDS.has(nodeId)) {
        constructionNodeIds.add(nodeId);
      }
    }

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
        const defaultConstruction =
          /defaultConstruction:\s*true/.test(m[0]) && !BACKEND_ENABLED_HITO_IDS.has(id);
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

const DOCUMENT_SOURCE_EXTRACTORS = new Set([
  'extract_drive',
  'extract_gmail',
  'extract_pc_folder',
]);

// Grupos de exclusión mutua: nunca deben coexistir 2 nodos del mismo dominio de lectura/herramienta
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

// Extractores genéricos obsoletos de tablas locales prohibidos en `inputs[]` (se debe usar el aplicativo Hito en `agent_tool` o `source_read`)
const FORBIDDEN_GENERIC_LOCAL_TOOLS = new Set([
  'somos_sst_trabajadores',
  'somos_sst_examenes',
  'somos_sst_epp',
  'somos_sst_perfiles_cargo',
]);

// Patrón estricto anti-fuga de identificadores técnicos internos en textos visibles al usuario
const INTERNAL_CODE_IDENTIFIERS_REGEX =
  /\b(extract_drive|extract_gmail|extract_pc_folder|extract_ai_doc_ocr|extract_sst_workers|extract_sst_app|hito\d+_[a-z0-9_]+|wappy_notification|acpm_task|email_report|canvas_doc|google_sheets|google_docs|google_slides|logic_merge|logic_loop|logic_approval_\d+|logic_merge_\d+|source_read|target_write_report|agent_tool|pre_agent|post_agent|schedule_cron|trigger_tenshi|trigger_email_in|trigger_qr_worker|wappy_memory_company|wappy_memory_antiduplicate|somos_sst_trabajadores|somos_sst_examenes|somos_sst_epp|somos_sst_perfiles_cargo|consultar_medlineplus_rehabilitacion|consultar_pubchem_quimico|pronostico_clima_sst|buscar_centros_emergencia|cursos_lms|web_search|matriz_pesv|matriz_compatibilidad|expiry_only|critical_only|write_and_update|write_and_report|read_only)\b/gi;

function getHitoConfig(nodeConfigs, hitoId) {
  if (!nodeConfigs || typeof nodeConfigs !== 'object') return {};
  return (
    nodeConfigs[`tool_hitos_${hitoId}`] ||
    nodeConfigs[hitoId] ||
    nodeConfigs[`hito_${hitoId}`] ||
    {}
  );
}

function resolveHitoRole(nodeConfigs, hitoId) {
  const cfg = getHitoConfig(nodeConfigs, hitoId);
  if (cfg.hitoRole === 'source_read' || cfg.hitoRole === 'agent_tool') {
    return cfg.hitoRole;
  }
  if (cfg.hitoRole === 'target_write_report') {
    return 'target_write_report';
  }
  return null;
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

  if (preset.presetCategory && !ALLOWED_PRESET_CATEGORIES.has(preset.presetCategory)) {
    errors.push(
      `[Inv-00] Categoría inválida "${preset.presetCategory}". Permitidas: ${Array.from(ALLOWED_PRESET_CATEGORIES).join(', ')}.`,
    );
  }

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
    if (REAL_CONSTRUCTION_NODE_IDS.has(nid)) {
      errors.push(
        `[Inv-03 / DOMAIN_CONSTRUCTION_APP_BLOCKED] El flujo usa el nodo "${nid}" marcado con \`defaultConstruction: true\`.`,
      );
    }
  }

  // Invariante 4: Cero redundancia / solapamiento de fuentes y Hitos sin duplicar
  if (new Set(hitos).size !== hitos.length) {
    errors.push(
      `[Inv-04] Aplicativos Hito duplicados en \`workflowNodes.hitos\`: [${hitos.join(', ')}] (prohibido leer el mismo Hito en Etapa 2 y a la vez en Herramienta +).`,
    );
  }
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
      `[Inv-04] Redundancia prohibida: "extract_sst_app" genérico coexiste con aplicativos Hito explícitos [${hitos.join(', ')}].`,
    );
  }
  if (memories.includes('wappy_memory_company') && inputs.includes('somos_sst_empresa')) {
    const empCfg = nodeConfigs.tool_inputs_somos_sst_empresa || nodeConfigs.somos_sst_empresa || {};
    if (empCfg.allowCompanyWrite !== true) {
      errors.push(
        '[Inv-04] Redundancia prohibida: "wappy_memory_company" y "somos_sst_empresa" leen el mismo perfil empresarial.',
      );
    }
  }
  if (extractors.includes('extract_drive') && inputs.includes('google_drive')) {
    errors.push(
      '[Inv-04] Redundancia visual en lienzo: "extract_drive" ya pre-lista la carpeta Drive; no dupliques "google_drive" en inputs[].',
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

  // Invariante 5 (Arquitectura n8n): Todo Hito debe ser `source_read` o `agent_tool` (PROHIBIDO `target_write_report`),
  // guardado tanto en `nodeConfigs[hitoId]` como en `nodeConfigs['tool_hitos_' + hitoId]`
  const sourceHitos = [];
  const agentToolHitos = [];
  for (const hId of hitos) {
    const directCfg = nodeConfigs[hId];
    const prefixedCfg = nodeConfigs[`tool_hitos_${hId}`];
    if (!directCfg || typeof directCfg !== 'object') {
      errors.push(
        `[Inv-05] Falta configuración espejo en \`nodeConfigs["${hId}"]\` para el aplicativo Hito "${hId}".`,
      );
    }
    if (!prefixedCfg || typeof prefixedCfg !== 'object') {
      errors.push(
        `[Inv-05] Falta configuración espejo en \`nodeConfigs["tool_hitos_${hId}"]\` para el aplicativo Hito "${hId}".`,
      );
    }
    if (directCfg && prefixedCfg && directCfg.hitoRole !== prefixedCfg.hitoRole) {
      errors.push(
        `[Inv-05] Desincronización de \`hitoRole\` entre \`nodeConfigs["${hId}"]\` ("${directCfg.hitoRole}") y \`nodeConfigs["tool_hitos_${hId}"]\` ("${prefixedCfg.hitoRole}").`,
      );
    }

    const role = resolveHitoRole(nodeConfigs, hId);
    const cfg = getHitoConfig(nodeConfigs, hId);

    if (role === 'target_write_report') {
      errors.push(
        `[Inv-05] PROHIBIDO \`hitoRole: "target_write_report"\` en "${hId}". En arquitectura n8n todo Hito debe ser \`"source_read"\` (Etapa 2) o \`"agent_tool"\` (puerto Herramienta + del Agente IA).`,
      );
    } else if (role === 'source_read') {
      sourceHitos.push(hId);
      if (
        cfg.appActionMode === 'write_and_report' ||
        cfg.appActionMode === 'write_and_update' ||
        cfg.generateAppReport === true ||
        cfg.hitoOperationMode === 'write_register'
      ) {
        errors.push(
          `[Inv-05] Contradicción causal en "${hId}": declarado como "source_read" pero tiene banderas de escritura/informe activas.`,
        );
      }
    } else if (role === 'agent_tool') {
      agentToolHitos.push(hId);
      const validAgentToolModes = new Set([
        'read_only',
        'write_and_update',
        'write_and_report',
        'generate_report',
      ]);
      if (!validAgentToolModes.has(cfg.appActionMode)) {
        errors.push(
          `[Inv-05] El Hito en Herramienta + "${hId}" (\`hitoRole: "agent_tool"\`) debe declarar \`appActionMode\` explícito (read_only, write_and_update, write_and_report o generate_report).`,
        );
      }
    } else {
      errors.push(
        `[Inv-05] El aplicativo Hito "${hId}" no declara \`hitoRole: "source_read" | "agent_tool"\` en canvasLayout.nodeConfigs.`,
      );
    }
  }

  // Invariante 6 (Obligatoriedad de Herramienta + visible en el Agente IA estilo n8n)
  const totalAgentTools = inputs.length + agentToolHitos.length;
  if (totalAgentTools < 1) {
    errors.push(
      '[Inv-06] PROHIBIDO Agente IA con puerto `Herramienta +` vacío (`inputs.length + agentToolHitos.length === 0`). Conecta al menos 1 herramienta real o Hito `agent_tool`.',
    );
  }
  for (const inId of inputs) {
    if (FORBIDDEN_GENERIC_LOCAL_TOOLS.has(inId)) {
      errors.push(
        `[Inv-06] "${inId}" en \`inputs[]\` es un conector local genérico redundante; usa el aplicativo Hito específico con \`hitoRole: "agent_tool"\` o \`"source_read"\`.`,
      );
    }
  }
  if (totalAgentTools > 4) {
    errors.push(
      `[Inv-06] Sobrecarga en puerto Herramienta + (${totalAgentTools} herramientas): mantén flujos atómicos con máximo 4 herramientas por Agente.`,
    );
  }

  // Invariante 7 (Extracción Documental IA + OCR obligatoria cuando hay Drive / Gmail / Carpeta PC)
  const usedDocExtractors = extractors.filter((e) => DOCUMENT_SOURCE_EXTRACTORS.has(e));
  if (usedDocExtractors.length > 0) {
    if (!extractors.includes('extract_ai_doc_ocr')) {
      errors.push(
        `[Inv-07] El flujo lee documentos desde [${usedDocExtractors.join(', ')}] pero NO incluye \`extract_ai_doc_ocr\` (✨ Extractor IA Docs) en \`workflowNodes.extractors\`.`,
      );
    } else {
      const cfgPrefixed = nodeConfigs.extractor_extract_ai_doc_ocr;
      const cfgDirect = nodeConfigs.extract_ai_doc_ocr;
      if (!cfgPrefixed || typeof cfgPrefixed !== 'object') {
        errors.push(
          '[Inv-07] Falta configuración en `nodeConfigs.extractor_extract_ai_doc_ocr`.',
        );
      }
      if (!cfgDirect || typeof cfgDirect !== 'object') {
        errors.push('[Inv-07] Falta configuración en `nodeConfigs.extract_ai_doc_ocr`.');
      }
      const schema = (cfgPrefixed || cfgDirect || {}).aiExtractionSchema;
      if (!Array.isArray(schema) || schema.length < 4) {
        errors.push(
          `[Inv-07] \`extract_ai_doc_ocr\` debe definir \`aiExtractionSchema\` explícito con al menos 4 campos reales (actual: ${Array.isArray(schema) ? schema.length : 0}).`,
        );
      } else {
        for (const field of schema) {
          if (
            !field ||
            !String(field.key || '').trim() ||
            !String(field.label || '').trim() ||
            !['string', 'date', 'number', 'boolean'].includes(field.type) ||
            typeof field.required !== 'boolean' ||
            !String(field.hint || '').trim()
          ) {
            errors.push(
              `[Inv-07] Campo incompleto en \`aiExtractionSchema\`: cada campo requiere \`{ key, label, type, required, hint }\` (recibido: ${JSON.stringify(field)}).`,
            );
          }
        }
      }
    }
  }

  // Invariante 8, 9 & 10: Compuerta Condicional `Condición Sí/No` (`pre_agent` vs `post_agent`) y Ramas `yes` / `no`
  const hasScrapers = customNodes.some((cn) =>
    String(cn?.id || cn?.key || cn?.nodeType || '').includes('scraper_agy'),
  );
  // Fuentes paralelas independientes en Etapa 2 (`extract_ai_doc_ocr` va en serie detrás de Drive/Gmail/PC)
  const parallelStage2SourcesCount =
    extractors.filter((e) => e !== 'extract_ai_doc_ocr').length +
    sourceHitos.length +
    (hasScrapers ? 1 : 0);

  if (wf.includeIfNode) {
    const ifCfg = nodeConfigs.if_router || nodeConfigs.if_condition || {};
    const placement = ifCfg.ifPlacement;
    if (placement !== 'pre_agent' && placement !== 'post_agent') {
      errors.push(
        '[Inv-08] `includeIfNode: true` requiere declarar explícitamente `if_router.ifPlacement` como `"pre_agent"` o `"post_agent"`.',
      );
    }
    if (!ifCfg.ifConditionLabel || String(ifCfg.ifConditionLabel).trim().length < 5) {
      errors.push('[Inv-08] `if_router.ifConditionLabel` debe contener una pregunta clara y concisa.');
    }
    if (placement === 'pre_agent' && parallelStage2SourcesCount === 0) {
      errors.push(
        '[Inv-08] `ifPlacement: "pre_agent"` inválido: no existe ninguna fuente de datos en Etapa 2 antes de la compuerta.',
      );
    }
    if (placement === 'post_agent') {
      const pText = String(preset.prompt || '');
      if (!/\[\s*VEREDICTO_IF\s*:\s*S[IÍ]\s*\]/i.test(pText) || !/\[\s*VEREDICTO_IF\s*:\s*NO\s*\]/i.test(pText)) {
        errors.push(
          '[Inv-08] Todo flujo con `ifPlacement: "post_agent"` debe instruir explícitamente en el prompt la emisión de `[VEREDICTO_IF: SI]` y `[VEREDICTO_IF: NO]`.',
        );
      }
    }

    const yesOuts = [];
    const noOuts = [];
    for (const outId of outputs) {
      if (!VALID_OUTPUTS.has(outId)) {
        errors.push(`[Inv-09] Nodo de salida desconocido: "${outId}".`);
      }
      const outCfg = nodeConfigs[`out_${outId}`] || nodeConfigs[outId] || {};
      if (outCfg.ifBranch !== 'yes' && outCfg.ifBranch !== 'no') {
        errors.push(
          `[Inv-09] La salida "${outId}" debe declarar explícitamente \`ifBranch: "yes" | "no"\` en nodeConfigs["out_${outId}"].`,
        );
      } else if (outCfg.ifBranch === 'yes') {
        yesOuts.push(outId);
      } else {
        noOuts.push(outId);
      }
    }
    if (yesOuts.length === 0) {
      errors.push('[Inv-09] La Rama SÍ (`ifBranch: "yes"`) no tiene ninguna salida conectada.');
    }
    if (noOuts.length === 0) {
      errors.push('[Inv-09] La Rama NO (`ifBranch: "no"`) no tiene ninguna salida conectada.');
    }
    if (!noOuts.includes('wappy_notification')) {
      errors.push(
        '[Inv-09] La Rama NO (`ifBranch: "no"`) debe incluir `wappy_notification` para trazabilidad silenciosa sin alarmas.',
      );
    }
    const overlap = yesOuts.filter((o) => noOuts.includes(o));
    if (overlap.length > 0) {
      errors.push(`[Inv-09] Salidas duplicadas entre Rama SÍ y Rama NO: [${overlap.join(', ')}].`);
    }

    const forbiddenInNo = noOuts.filter(
      (o) => o === 'acpm_task' || o === 'wappy_kanban' || o === 'somos_sst_update',
    );
    if (forbiddenInNo.length > 0) {
      errors.push(
        `[Inv-10] Incoherencia operativa en Rama NO: [${forbiddenInNo.join(', ')}] jamás debe ejecutarse cuando NO hay hallazgos.`,
      );
    }
  } else if (outputs.length === 0) {
    errors.push('[Inv-09] El flujo directo (`includeIfNode: false`) debe tener al menos 1 salida.');
  }

  // Invariante 11: Disciplina Anti-Duplicados en flujos programados con escalamiento
  const ifPlacement = (nodeConfigs.if_router || {}).ifPlacement;
  const hasEscalationOnYes =
    outputs.includes('acpm_task') ||
    outputs.includes('email_report') ||
    outputs.includes('google_calendar');
  if (
    triggers.includes('schedule_cron') &&
    wf.includeIfNode &&
    ifPlacement === 'pre_agent' &&
    hasEscalationOnYes
  ) {
    if (!memories.includes('wappy_memory_antiduplicate')) {
      errors.push(
        '[Inv-11] Todo flujo recurrente con compuerta `pre_agent` y alertas/ACPM debe incluir `wappy_memory_antiduplicate`.',
      );
    } else {
      const dedupCfg =
        nodeConfigs.sub_memory_wappy_memory_antiduplicate ||
        nodeConfigs.sub_memory ||
        nodeConfigs.wappy_memory_antiduplicate ||
        {};
      if (!['24h', '7d', '30d', 'all'].includes(dedupCfg.dedupWindow)) {
        errors.push(
          '[Inv-11] Se debe declarar explícitamente `dedupWindow` ("24h" | "7d" | "30d" | "all") en `sub_memory_wappy_memory_antiduplicate`.',
        );
      }
    }
  }

  // Invariante 12: Coherencia bidireccional de `logicType: "merge"` y `logicType: "loop"`
  const hasMerge = logicNodes.some((ln) => ln?.logicType === 'merge');
  const hasLoop = logicNodes.some((ln) => ln?.logicType === 'loop');
  if (parallelStage2SourcesCount >= 2 && !hasMerge) {
    errors.push(
      `[Inv-12] Existen ${parallelStage2SourcesCount} fuentes paralelas en Etapa 2 ([${[...extractors.filter((e) => e !== 'extract_ai_doc_ocr'), ...sourceHitos].join(', ')}]) pero falta \`logicType: "merge"\` en \`canvasLayout.logicNodes\`.`,
    );
  }
  if (hasMerge && parallelStage2SourcesCount < 2) {
    errors.push(
      `[Inv-12] Nodo \`logicType: "merge"\` innecesario: requiere >= 2 fuentes paralelas en Etapa 2 (actual: ${parallelStage2SourcesCount}).`,
    );
  }
  if (hasLoop && parallelStage2SourcesCount < 1) {
    errors.push(
      '[Inv-12] Nodo `logicType: "loop"` incoherente: requiere al menos 1 colección fuente en Etapa 2.',
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

  // Invariante 14: Cero fuga de identificadores internos de código en textos visibles al usuario
  const promptStr = String(preset.prompt || '');
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
    const leaked = Array.from(
      new Set(Array.from(text.matchAll(INTERNAL_CODE_IDENTIFIERS_REGEX), (m) => m[1])),
    );
    if (leaked.length > 0) {
      errors.push(
        `[Inv-14 / CODE_ID_LEAK] "${surface}" filtra identificadores internos de código prohibidos en texto humano: [${leaked.join(', ')}]. Usa nombres en español natural.`,
      );
    }
  }

  // Invariante 15: Fidelidad de numeración de Hitos (1..8) contra HITO_APP_NODES reales
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
  }

  // Invariante 16: Prohibido usar `hito3_alturas` (Permiso diario en campo) para auditar cursos/certificados anuales de formación
  if (hitos.includes('hito3_alturas') && !hitos.includes('hito2_perfil_socio')) {
    const combinedDomainText = `${preset.name || ''} ${preset.presetDescription || ''} ${promptStr}`;
    if (/\b(reentrenamiento|curso\s+anual|certificado\s+de\s+alturas|sena\b|emo\b)\b/i.test(combinedDomainText)) {
      errors.push(
        '[Inv-16 / DOMAIN_PERMISO_ALTURAS_MISUSE] `hito3_alturas` corresponde al Permiso de Trabajo en Alturas en campo (Hito 5), no a cursos anuales ni EMO (que residen en Perfil Sociodemográfico Hito 2).',
      );
    }
  }

  return {
    presetKey: key,
    presetCategory: preset.presetCategory || 'sin_categoria',
    name: preset.name || key,
    valid: errors.length === 0,
    ifPlacement: wf.includeIfNode
      ? (nodeConfigs.if_router || {}).ifPlacement || 'missing'
      : 'direct',
    sourceHitos,
    agentToolHitos,
    targetHitos: [],
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
  let catalogVersion = null;
  const isFullSystemCatalogAudit = !jsonFile && !presetFilter;

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
    catalogVersion = mod.SYSTEM_WORKFLOW_PRESETS_VERSION || null;
  }

  if (presetFilter) {
    workflows = workflows.filter(
      (w) => w.presetKey === presetFilter || w.name?.includes(presetFilter),
    );
  }

  if (workflows.length === 0) {
    console.error('❌ No se encontraron flujos para validar.');
    process.exit(1);
  }

  const catalogGlobalErrors = [];
  if (isFullSystemCatalogAudit) {
    if (catalogVersion !== EXPECTED_CATALOG_VERSION) {
      catalogGlobalErrors.push(
        `[Catálogo] SYSTEM_WORKFLOW_PRESETS_VERSION debe ser "${EXPECTED_CATALOG_VERSION}" (actual: "${catalogVersion}").`,
      );
    }
    if (workflows.length !== EXPECTED_CATALOG_COUNT) {
      catalogGlobalErrors.push(
        `[Catálogo] Se exigen exactamente ${EXPECTED_CATALOG_COUNT} flujos maestros curados (actual: ${workflows.length}).`,
      );
    }
    const seenKeys = new Set();
    const seenNames = new Set();
    for (const w of workflows) {
      if (seenKeys.has(w.presetKey)) {
        catalogGlobalErrors.push(`[Catálogo] presetKey duplicado: "${w.presetKey}".`);
      }
      seenKeys.add(w.presetKey);
      if (seenNames.has(w.name)) {
        catalogGlobalErrors.push(`[Catálogo] Nombre de flujo duplicado: "${w.name}".`);
      }
      seenNames.add(w.name);
    }
  }

  let validCount = 0;
  let invalidCount = 0;
  let totalErrors = catalogGlobalErrors.length;
  let totalWarnings = 0;
  const archetypeStats = { pre_agent: 0, post_agent: 0, direct: 0, missing: 0 };
  const categoryStats = {};

  console.log(
    `\n🔍 VALIDACIÓN DETERMINISTA N8N DE FLUJOS MAESTROS WAPPY (${workflows.length} flujo(s)${catalogVersion ? ` · v=${catalogVersion}` : ''})\n` +
      '═'.repeat(96),
  );

  if (catalogGlobalErrors.length > 0) {
    for (const gErr of catalogGlobalErrors) {
      console.log(`❌ ${gErr}`);
    }
  }

  for (let i = 0; i < workflows.length; i++) {
    const report = validateSingleWorkflow(workflows[i], i);
    archetypeStats[report.ifPlacement] = (archetypeStats[report.ifPlacement] || 0) + 1;
    categoryStats[report.presetCategory] = (categoryStats[report.presetCategory] || 0) + 1;
    totalWarnings += report.warnings.length;

    if (report.valid) {
      validCount++;
      console.log(
        `✅ ${String(i + 1).padStart(2, '0')}. [${report.presetKey}] ${report.name}\n` +
          `   • Cat: ${report.presetCategory} | IF: ${report.ifPlacement} | Etapa2(Read): [${[...report.extractors, ...report.sourceHitos].join(', ') || 'Evento directo'}] | Herramienta+: [${[...report.inputs, ...report.agentToolHitos].join(', ')}]`,
      );
    } else {
      invalidCount++;
      totalErrors += report.errors.length;
      console.log(
        `❌ ${String(i + 1).padStart(2, '0')}. [${report.presetKey}] ${report.name} (${report.errors.length} error(es)):`,
      );
      for (const err of report.errors) {
        console.log(`   ↳ ${err}`);
      }
    }
    if (report.warnings.length > 0) {
      for (const w of report.warnings) {
        console.log(`   ⚠️ ${w}`);
      }
    }
  }

  console.log('═'.repeat(96));
  console.log(
    `📊 RESUMEN: ${validCount}/${workflows.length} PASS · ${totalErrors} errores · ${totalWarnings} advertencias`,
  );
  console.log(
    `🧭 DISTRIBUCIÓN IF: pre_agent=${archetypeStats.pre_agent || 0} | post_agent=${archetypeStats.post_agent || 0} | direct=${archetypeStats.direct || 0}`,
  );
  console.log(
    `📂 CATEGORÍAS: ${Object.entries(categoryStats)
      .map(([k, v]) => `${k}=${v}`)
      .join(' | ')}\n`,
  );

  process.exit(invalidCount === 0 && catalogGlobalErrors.length === 0 && totalWarnings === 0 ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  validateSingleWorkflow,
  resolveHitoRole,
  MUTUAL_EXCLUSION_GROUPS,
};
