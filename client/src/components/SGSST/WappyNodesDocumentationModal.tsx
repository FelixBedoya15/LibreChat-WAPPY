import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Search,
  X,
  Copy,
  Check,
  Download,
  Code2,
  Eye,
  Zap,
  Database,
  Brain,
  Wrench,
  Bot,
  ShieldCheck,
  GitFork,
  GitMerge,
  Repeat,
  UserCheck,
  Sliders,
  Send,
  Sparkles,
  Lock,
  Hammer,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Mic,
  CheckCircle2,
  Layers,
  FileText,
  Loader2,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import ExpandableButton, { type ExpandableButtonVariant } from '~/components/Common/ExpandableButton';
import {
  TRIGGER_NODES,
  EXTRACTOR_NODES,
  AI_ENGINE_MODELS,
  MEMORY_NODES,
  INPUT_CONNECTOR_NODES,
  SKILL_RULE_SUBAGENT_NODES,
  HITO_APP_NODES,
  OUTPUT_ACTION_NODES,
  HITOS_8_FILTER_TABS,
  TOOL_SUBGROUP_TABS,
  WORKFLOW_PRESETS,
  BLOCKED_HITO_ACTIVE_REPLACEMENTS,
  isWorkflowNodeUnderConstruction,
  getNodeModuleMetadata,
  doesNodeRequireAntigravity,
  type WorkflowNodeDef,
  type NodeModuleMetadata,
} from './workflowNodesCatalog';
import { renderOfficialNodeSvg } from './WappyWorkflowCanvas';

/* ═══════════════════════════════════════════════════════════════════════════
   1. TIPOS Y CATÁLOGO UNIFICADO DE LOS NODOS DOCUMENTADOS EN SMARTDOWN
   ═══════════════════════════════════════════════════════════════════════════ */

export type NodeDocFamilyId =
  | 'all'
  | 'triggers'
  | 'extractors'
  | 'ai_memories'
  | 'connectors'
  | 'skills_subagents'
  | 'hitos'
  | 'logic_dag'
  | 'outputs';

export type NodeCanvasPreviewMode = 'stage2_square' | 'agent_satellite' | 'stage4_write';

export interface DocumentedWorkflowNode {
  docKey: string;
  id: string;
  familyId: Exclude<NodeDocFamilyId, 'all'>;
  familyLabel: string;
  subGroup?: string;
  hitoId?: string;
  sgsstAppId?: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  badge: string;
  description: string;
  toolHint: string;
  defaultShape:
    | 'trigger'
    | 'square_extractor'
    | 'agent_root'
    | 'agent_extra'
    | 'circle_model'
    | 'circle_memory'
    | 'circle_tool'
    | 'if_router'
    | 'logic_merge'
    | 'logic_loop'
    | 'logic_human_approval'
    | 'logic_filter'
    | 'logic_switch'
    | 'square_hito'
    | 'square_output'
    | 'custom_satellite';
  supportsDualStageToggle: boolean;
  supportsHitoWriteToggle?: boolean;
  requiresAntigravity: boolean;
  defaultConstruction: boolean;
  rawDef?: WorkflowNodeDef;
  scriptCode?: string;
  targetUrl?: string;
}

export const NODE_DOC_FAMILIES: Array<{
  id: NodeDocFamilyId;
  label: string;
  shortLabel: string;
  variant: ExpandableButtonVariant;
}> = [
  { id: 'all', label: 'Todos los Nodos', shortLabel: 'Todos', variant: 'teal' },
  { id: 'triggers', label: '1. Disparadores', shortLabel: 'Disparadores', variant: 'orange' },
  {
    id: 'extractors',
    label: '2. Extractores, OCR, Forense y OSINT',
    shortLabel: 'Extractores & OSINT',
    variant: 'blue',
  },
  {
    id: 'ai_memories',
    label: '3. Agente IA, Motores y Memorias',
    shortLabel: 'Agente IA & Memorias',
    variant: 'indigo',
  },
  {
    id: 'connectors',
    label: '4. Herramientas y Conectores (Herramienta +)',
    shortLabel: 'Herramientas +',
    variant: 'cyan',
  },
  {
    id: 'skills_subagents',
    label: '5. Skills, Reglas y Sub-Agentes',
    shortLabel: 'Skills & Sub-Agentes',
    variant: 'purple',
  },
  {
    id: 'hitos',
    label: '6. Aplicativos Somos SST (8 Hitos)',
    shortLabel: 'Aplicativos 8 Hitos',
    variant: 'emerald',
  },
  {
    id: 'logic_dag',
    label: '7. Nodos Lógicos DAG (Si/No, Merge, Loop)',
    shortLabel: 'Lógica DAG',
    variant: 'amber',
  },
  {
    id: 'outputs',
    label: '8. Salidas y Bitácora',
    shortLabel: 'Salidas',
    variant: 'green',
  },
];

const LOGIC_DAG_CATALOG_NODES: Array<{
  id: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  badge: string;
  shape:
    | 'if_router'
    | 'logic_merge'
    | 'logic_loop'
    | 'logic_human_approval'
    | 'logic_filter'
    | 'logic_switch';
  description: string;
  toolHint: string;
}> = [
  {
    id: 'if_router',
    label: 'Condición Si / No (Enrutador Causal Pre-Fuentes · Pre-IA 0 Tokens · Post-IA)',
    shortLabel: 'Condición Si/No',
    subtitle: '¿Cumple condición? · Ramas sí / no',
    badge: '⚡ Pre-IA · 0 tok NO',
    shape: 'if_router',
    description:
      'Compuerta condicional bifurcada con puertos «sí» (verde) y «no» (gris). Opera en 3 ubicaciones topológicas: Pre-Fuentes (enruta antes de leer portales/BD), Pre-Agente IA (evalúa de forma determinista con 0 consumo de tokens si no hay brechas nuevas) o Post-Agente IA (lee el marcador experto [VEREDICTO_IF: SI/NO]).',
    toolHint: 'Enrutador condicional causal Si/No (pre_source, pre_agent 0 tokens, post_agent)',
  },
  {
    id: 'logic_merge',
    label: 'Unir Ramas (Merge · Consolidación y Deduplicación por Clave)',
    shortLabel: 'Unir Ramas (Merge)',
    subtitle: 'Unión Deduplicada · Cédula / Placa',
    badge: 'Merge Multi-Fuente',
    shape: 'logic_merge',
    description:
      'Sincroniza y fusiona múltiples fuentes paralelas de Etapa 2 (por ejemplo Google Drive + Perfil Sociodemográfico + SIMIT/RUNT) en una sola tabla unificada antes del Agente IA, aplicando unión deduplicada (union_dedup), intersección exacta por cédula/placa (intersect_key) o concatenación total (append_all).',
    toolHint: 'Consolidación determinista de múltiples ramas de entrada (union_dedup / intersect_key / append_all)',
  },
  {
    id: 'logic_loop',
    label: 'Iterar Lotes (Loop · Procesamiento Nominal por Trabajador o Vehículo)',
    shortLabel: 'Iterar Lotes (Loop)',
    subtitle: 'Lotes por Cédula / Placa',
    badge: 'Loop Controlado',
    shape: 'logic_loop',
    description:
      'Recorre colecciones extensas de trabajadores, contratistas, archivos PDF o placas vehiculares en lotes controlados (batchSize configurable, ej. 5 o 10 registros por iteración) agrupando por campo clave (cédula, placa, NIT) y consolidando un único informe final sin truncar contexto.',
    toolHint: 'Iterador por lotes nominales (batchSize, iterateByField, consolidado_unico | resumen_por_lote)',
  },
  {
    id: 'logic_human_approval',
    label: 'Aprobación Humana (Compuerta HITL Antes de Despachar Salidas)',
    shortLabel: 'Aprobación Humana',
    subtitle: 'Pausa HITL · Aprobar / Rechazar',
    badge: 'Control Humano',
    shape: 'logic_human_approval',
    description:
      'Detiene preventivamente el flujo después del dictamen del Agente IA en estado «Esperando Aprobación Humana» (awaiting_approval) antes de enviar correos oficiales, modificar matrices críticas o notificar a terceros, permitiendo al Responsable SST aprobar o rechazar en 1 clic.',
    toolHint: 'Compuerta Human-in-the-Loop (POST /automatizaciones/logs/:id/approve | /reject)',
  },
  {
    id: 'logic_filter',
    label: 'Filtro Quirúrgico Determinista (Filter · Descarte Rápido 0 Tokens)',
    shortLabel: 'Filtro Quirúrgico',
    subtitle: 'Solo Críticos / Vencidos <= 30d',
    badge: 'Filtro 0 Tokens',
    shape: 'logic_filter',
    description:
      'Depura filas y columnas de entrada mediante reglas deterministas en servidor antes de llegar al Agente IA: descarta registros 100% al día, trabajadores retirados o tareas donde no aplica curso de alturas, reduciendo latencia y consumo de tokens.',
    toolHint: 'Filtrado determinista de registros en tránsito antes del razonamiento LLM',
  },
  {
    id: 'logic_switch',
    label: 'Enrutador Multi-Rama (Switch · Clasificación por Severidad u Origen)',
    shortLabel: 'Switch Multi-Rama',
    subtitle: 'Clasificación Nivel I–IV / Origen',
    badge: 'Switch Causal',
    shape: 'logic_switch',
    description:
      'Clasifica el flujo en múltiples rutas especializadas según el valor de un campo o severidad SST (ej. Riesgo Nivel I Crítico vs. Nivel II Alto vs. Nivel III/IV Preventivo, o Incapacidad Origen Laboral ATEL vs. Origen Común vs. Accidente de Tránsito).',
    toolHint: 'Enrutamiento multi-caso por reglas de negocio y severidad normativa SST',
  },
];

let _cachedCatalogNodes: DocumentedWorkflowNode[] | null = null;

export function getDocumentedCatalogNodes(): DocumentedWorkflowNode[] {
  if (_cachedCatalogNodes) return _cachedCatalogNodes;

  const list: DocumentedWorkflowNode[] = [];

  // 1. FAMILIA 1: DISPARADORES (9)
  TRIGGER_NODES.forEach((t) => {
    list.push({
      docKey: `trigger_${t.id}`,
      id: t.id,
      familyId: 'triggers',
      familyLabel: '1. Disparadores',
      label: t.label,
      shortLabel: t.shortLabel,
      subtitle: t.badge || 'Disparador',
      badge: t.badge || 'Trigger',
      description: t.description || t.toolHint,
      toolHint: t.toolHint,
      defaultShape: 'trigger',
      supportsDualStageToggle: false,
      requiresAntigravity: doesNodeRequireAntigravity(t.id, `trigger_${t.id}`),
      defaultConstruction: Boolean(t.defaultConstruction),
      rawDef: t,
    });
  });

  // 2. FAMILIA 2: EXTRACTORES, OCR, FORENSE Y SCRAPERS OSINT (16)
  EXTRACTOR_NODES.forEach((ext) => {
    const isDualAgentToolCapable =
      ext.id.startsWith('scraper_agy_') ||
      ext.id === 'forensic_doc_verifier' ||
      ext.id === 'extract_web_scraping_agy';
    const matchingSkillScraper = SKILL_RULE_SUBAGENT_NODES.find((s) => s.id === ext.id);
    list.push({
      docKey: `extractor_${ext.id}`,
      id: ext.id,
      familyId: 'extractors',
      familyLabel: '2. Extractores, OCR, Forense y OSINT',
      subGroup:
        ext.id === 'forensic_doc_verifier' || ext.id === 'extract_ai_doc_ocr'
          ? 'ia_forense'
          : ext.id.startsWith('scraper_agy_') || ext.id === 'extract_web_scraping_agy'
            ? 'osint_scrapers'
            : 'fuentes_datos',
      label: ext.label,
      shortLabel: ext.shortLabel,
      subtitle: ext.badge || 'Extractor Etapa 2',
      badge: ext.badge || 'Extractor',
      description: ext.description || ext.toolHint,
      toolHint: ext.toolHint,
      defaultShape: 'square_extractor',
      supportsDualStageToggle: isDualAgentToolCapable,
      requiresAntigravity:
        ext.id !== 'forensic_doc_verifier' &&
        ext.id !== 'extract_ai_doc_ocr' &&
        doesNodeRequireAntigravity(ext.id, `extractor_${ext.id}`),
      defaultConstruction: Boolean(ext.defaultConstruction),
      rawDef: ext,
      scriptCode: matchingSkillScraper?.scriptCode,
      targetUrl: matchingSkillScraper?.targetUrl,
    });
  });

  // 3. FAMILIA 3: AGENTE IA PRINCIPAL, SEGUNDO AGENTE IA, MOTORES IA Y MEMORIAS (11)
  list.push({
    docKey: 'ai_agent_root',
    id: 'agent_root',
    familyId: 'ai_memories',
    familyLabel: '3. Agente IA, Motores y Memorias',
    subGroup: 'agents',
    label: 'Agente IA Orquestador Principal (Tenshi 3D + 3 Puertos en Rombo ◆)',
    shortLabel: 'Agente IA Principal',
    subtitle: 'Consultor SG-SST · Orquestador',
    badge: 'PRINCIPAL',
    description:
      'Cerebro central del flujo autónomo en WAPPY IA. Recibe el contexto depurado de las fuentes de lectura previa, razona con el Modelo IA conectado en «◆ Modelo IA *», aplica las Memorias conectadas en «◆ Memoria +» e invoca bajo demanda las herramientas conectadas en «◆ Herramienta +».',
    toolHint: 'Orquestador central del flujo con avatar 3D Tenshi y 3 puertos inferiores en rombo (Modelo IA *, Memoria +, Herramienta +)',
    defaultShape: 'agent_root',
    supportsDualStageToggle: false,
    requiresAntigravity: false,
    defaultConstruction: false,
  });

  list.push({
    docKey: 'ai_agent_extra',
    id: 'agent_extra',
    familyId: 'ai_memories',
    familyLabel: '3. Agente IA, Motores y Memorias',
    subGroup: 'agents',
    label: 'Segundo Agente IA / Revisor Multi-Agente (+ Otra IA · Suri, Max, Paz, Capi)',
    shortLabel: 'Agente IA #2 (Revisor)',
    subtitle: 'Auditor / Médico / Jurídico SST',
    badge: 'SURI · #2',
    description:
      'Agente IA adicional encadenado a la derecha del Agente Principal para orquestación Multi-Agente real (ej. Agente #1 Técnico SST redacta el hallazgo ➔ Agente #2 Abogado Laboral o Médico Laboral audita la reserva legal y el blindaje probatorio antes de emitir la salida). Rota automáticamente avatares 3D oficiales (Suri Suricato, Max Perro, Paz Paloma, Capi Capibara).',
    toolHint: 'Segundo eslabón de razonamiento Multi-Agente con prompt propio, motor independiente y avatares 3D rotativos',
    defaultShape: 'agent_extra',
    supportsDualStageToggle: false,
    requiresAntigravity: false,
    defaultConstruction: false,
  });

  AI_ENGINE_MODELS.forEach((m) => {
    list.push({
      docKey: `model_${m.id}`,
      id: m.id,
      familyId: 'ai_memories',
      familyLabel: '3. Agente IA, Motores y Memorias',
      subGroup: 'models',
      label: m.label,
      shortLabel: m.shortLabel,
      subtitle: m.subtitle,
      badge: m.engine === 'wappy' ? 'WAPPY Cloud' : 'Antigravity + MCP',
      description: m.description,
      toolHint: `${m.engine} (${m.model})`,
      defaultShape: 'circle_model',
      supportsDualStageToggle: false,
      requiresAntigravity: m.engine !== 'wappy',
      defaultConstruction: false,
    });
  });

  MEMORY_NODES.forEach((mem) => {
    list.push({
      docKey: `memory_${mem.id}`,
      id: mem.id,
      familyId: 'ai_memories',
      familyLabel: '3. Agente IA, Motores y Memorias',
      subGroup: 'memories',
      label: mem.label,
      shortLabel: mem.shortLabel,
      subtitle: mem.badge || 'Memoria del Agente',
      badge: mem.badge || 'Memoria',
      description: mem.description || mem.toolHint,
      toolHint: mem.toolHint,
      defaultShape: 'circle_memory',
      supportsDualStageToggle: false,
      requiresAntigravity: mem.id === 'wappy_rag_documental',
      defaultConstruction: Boolean(mem.defaultConstruction),
      rawDef: mem,
    });
  });

  // 4. FAMILIA 4: HERRAMIENTAS Y CONECTORES DEL AGENTE (`Herramienta +`) (30)
  INPUT_CONNECTOR_NODES.forEach((conn) => {
    list.push({
      docKey: `connector_${conn.id}`,
      id: conn.id,
      familyId: 'connectors',
      familyLabel: '4. Herramientas y Conectores (Herramienta +)',
      subGroup: conn.category,
      label: conn.label,
      shortLabel: conn.shortLabel,
      subtitle: conn.badge || 'Satélite Herramienta +',
      badge:
        conn.badge ||
        (conn.category === 'wappy_tools'
          ? 'Motor WAPPY'
          : conn.category === 'google_tools'
            ? 'Google Suite'
            : conn.category === 'api_tools'
              ? 'API Científica/Web'
              : 'Conector MCP'),
      description:
        conn.description ||
        `Conector satélite en el puerto «◆ Herramienta +» del Agente IA que permite consultar o ejecutar ${conn.label} bajo demanda mediante ${conn.toolHint}.`,
      toolHint: conn.toolHint,
      defaultShape: 'circle_tool',
      supportsDualStageToggle: false,
      requiresAntigravity: doesNodeRequireAntigravity(conn.id, `tool_inputs_${conn.id}`),
      defaultConstruction: Boolean(conn.defaultConstruction),
      rawDef: conn,
    });
  });

  // 5. FAMILIA 5: SKILLS, REGLAS Y SUB-AGENTES ESPECIALISTAS (deduplicando los 6 `scraper_agy_*` ya documentados en Familia 2)
  SKILL_RULE_SUBAGENT_NODES.filter((s) => !EXTRACTOR_NODES.some((e) => e.id === s.id)).forEach(
    (s) => {
      const isCustomScraper = s.nodeType === 'web_scraper' || s.nodeType === 'web_search';
      list.push({
        docKey: `skillsub_${s.id}`,
        id: s.id,
        familyId: 'skills_subagents',
        familyLabel: '5. Skills, Reglas y Sub-Agentes',
        subGroup: s.nodeType,
        label: s.label,
        shortLabel: s.shortLabel,
        subtitle: s.subtitle,
        badge:
          s.badge ||
          (s.nodeType === 'skill'
            ? 'SKILL.md'
            : s.nodeType === 'rule'
              ? 'Guardrail SST'
              : s.nodeType === 'subagent'
                ? 'Sub-Agente IA'
                : 'Scraper / Web'),
        description: s.content,
        toolHint: s.subtitle,
        defaultShape: 'custom_satellite',
        supportsDualStageToggle: isCustomScraper,
        requiresAntigravity:
          s.nodeType === 'web_scraper' || s.id.includes('antigravity') || s.id.includes('agy'),
        defaultConstruction: Boolean(s.defaultConstruction),
        scriptCode: s.scriptCode,
        targetUrl: s.targetUrl,
      });
    },
  );

  // 6. FAMILIA 6: LOS 50 APLICATIVOS OFICIALES DE SOMOS SST (8 HITOS)
  HITO_APP_NODES.forEach((h) => {
    list.push({
      docKey: `hito_${h.id}`,
      id: h.id,
      familyId: 'hitos',
      familyLabel: '6. Aplicativos Somos SST (8 Hitos)',
      hitoId: h.hitoId,
      sgsstAppId: h.sgsstAppId,
      label: h.label,
      shortLabel: h.shortLabel,
      subtitle: h.badge || h.category,
      badge: h.badge || 'Somos SST',
      description:
        h.description ||
        `Nodo oficial conectado al aplicativo «${h.label}» dentro de la arquitectura biocéntrica de Somos SST (${h.category}). Soporta lectura quirúrgica en Etapa 2, consulta como herramienta satélite del Agente IA o escritura de registros + emisión de Informe Oficial HTML en Etapa 4.`,
      toolHint: h.toolHint,
      defaultShape: 'square_hito',
      supportsDualStageToggle: true,
      supportsHitoWriteToggle: true,
      requiresAntigravity: false,
      defaultConstruction: Boolean(h.defaultConstruction),
      rawDef: h,
    });
  });

  // 7. FAMILIA 7: NODOS LÓGICOS DAG (6)
  LOGIC_DAG_CATALOG_NODES.forEach((lg) => {
    list.push({
      docKey: `logic_${lg.id}`,
      id: lg.id,
      familyId: 'logic_dag',
      familyLabel: '7. Nodos Lógicos DAG',
      label: lg.label,
      shortLabel: lg.shortLabel,
      subtitle: lg.subtitle,
      badge: lg.badge,
      description: lg.description,
      toolHint: lg.toolHint,
      defaultShape: lg.shape,
      supportsDualStageToggle: false,
      requiresAntigravity: false,
      defaultConstruction: false,
    });
  });

  // 8. FAMILIA 8: ACCIONES DE SALIDA Y BITÁCORA (11)
  OUTPUT_ACTION_NODES.forEach((out) => {
    list.push({
      docKey: `output_${out.id}`,
      id: out.id,
      familyId: 'outputs',
      familyLabel: '8. Salidas y Bitácora',
      label: out.label,
      shortLabel: out.shortLabel,
      subtitle: out.badge || 'Salida Etapa 5',
      badge: out.badge || 'Salida',
      description: out.description || out.toolHint,
      toolHint: out.toolHint,
      defaultShape: 'square_output',
      supportsDualStageToggle: false,
      requiresAntigravity: doesNodeRequireAntigravity(out.id, `out_${out.id}`),
      defaultConstruction: Boolean(out.defaultConstruction),
      rawDef: out,
    });
  });

  _cachedCatalogNodes = list;
  return list;
}

export function getTotalDocumentedNodesCount(): number {
  return getDocumentedCatalogNodes().length;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. GENERADOR SMARTDOWN RICO Y PEDAGÓGICO POR NODO (5 SECCIONES COMPLETAS)
   ═══════════════════════════════════════════════════════════════════════════ */

interface GeneratedNodeSmartDown {
  markdown: string;
  tenshiVoicePrompt: string;
  flowDiagramAscii: string;
  meta: NodeModuleMetadata;
  isUnderConstruction: boolean;
}

function findPresetUsingNode(node: DocumentedWorkflowNode) {
  return WORKFLOW_PRESETS.find((p) => {
    const wn = p.workflowNodes;
    if (!wn) return false;
    if (node.familyId === 'triggers') {
      return (wn.triggers || [wn.trigger]).includes(node.id);
    }
    if (node.familyId === 'extractors') {
      return (wn.extractors || []).includes(node.id) || (wn.inputs || []).includes(node.id);
    }
    if (node.familyId === 'ai_memories') {
      if (node.id === 'agent_root') return true;
      if (node.subGroup === 'memories') return (wn.memories || [wn.memoryNode]).includes(node.id);
      if (node.subGroup === 'models') return node.id.includes(wn.aiModel || '');
    }
    if (node.familyId === 'connectors') {
      return (wn.inputs || []).includes(node.id);
    }
    if (node.familyId === 'hitos') {
      return (wn.hitos || []).includes(node.id);
    }
    if (node.familyId === 'logic_dag' && node.id === 'if_router') {
      return wn.includeIfNode !== false;
    }
    if (node.familyId === 'outputs') {
      return (wn.outputs || []).includes(node.id);
    }
    return false;
  });
}

export function buildNodeSmartDownDoc(
  node: DocumentedWorkflowNode,
  disabledApps?: string[] | null,
): GeneratedNodeSmartDown {
  const isUnderConstruction =
    node.defaultConstruction || isWorkflowNodeUnderConstruction(node.rawDef, disabledApps);
  const meta = getNodeModuleMetadata(node.id);
  const matchedPreset = findPresetUsingNode(node);

  // ── SECCIÓN 1: DESCRIPCIÓN TOTAL Y ALCANCE NORMATIVO ──
  let sec1 = `### 1. Descripción Total y Alcance Normativo\n\n`;
  sec1 += `${node.description}\n\n`;

  if (node.id === 'forensic_doc_verifier') {
    sec1 += `> [!IMPORTANT]\n> **Arquitectura Oficial de 4 Capas Forenses Documentales (Sin Evasión de CAPTCHA):**\n\n`;
    sec1 += `- **Capa 1 — Inspección Binaria EXIF / XMP / Estructura PDF:** Analiza bytes crudos del certificado (metadatos \`/Producer\`, \`/Creator\`, discrepancias entre \`/CreationDate\` y \`/ModDate\`, múltiples marcadores \`%%EOF\` por re-guardado incremental y firmas de software de edición como *Canva*, *Adobe Photoshop*, *Illustrator*, *iLovePDF* o *Sejda*).\n`;
    sec1 += `- **Capa 2 — Visión Multimodal Anti-Manipulación:** Examina anomalías visuales de alineación de renglones, cambios sutiles de tipografía o grosor en fechas/días de incapacidad, artefactos o halos JPEG alrededor de cifras editadas y sellos médicos superpuestos.\n`;
    sec1 += `- **Capa 3 — Validación Jurídica Decreto 1427 de 2022 + Cuadre Matemático:** Verifica exactitud aritmética (\`Fecha Inicio + Días Otorgados - 1 = Fecha Fin\`), validez estructural del diagnóstico **CIE-10** (bajo reserva legal Res. 2346/2007 y Ley 1581/2012), dígito de verificación del **NIT DIAN** de la IPS/EPS emisora y campos obligatorios del Art. 2.2.3.3.1 del Decreto 1427 de 2022.\n`;
    sec1 += `- **Capa 4 — Cruce Institucional Abierto (\`datos.gov.co\`) + Enlace Oficial ReTHUS:** Verifica automáticamente y sin CAPTCHA la habilitación real de la IPS/clínica emisora en el **REPS de MinSalud (\`datos.gov.co\`)** y cruza antecedentes institucionales abiertos (Contraloría / Rama Judicial), entregando además el enlace directo a **ReTHUS SISPRO** para que el Médico Laboral valide en 1 clic la tarjeta profesional del médico tratante.\n\n`;
  } else if (node.id === 'scraper_agy_salud_rethus') {
    sec1 += `> [!WARNING]\n> **¿Por qué este nodo está marcado como \`🚧 En Construcción\`? (Transparencia Técnica Anti-CAPTCHA):**\n> Actualmente los dos portales públicos de salud en Colombia exigen resolución humana de CAPTCHA visual en cada consulta individual: **ADRES (BDUA)** protege su formulario con \`RadCaptcha\` (Telerik) y **SISPRO ReTHUS (MinSalud)** exige resolver \`imgCaptcha\` gráfico. Bajo la directriz estricta de seguridad y cumplimiento legal de WAPPY IA (**prohibido evadir, computar o saltar CAPTCHAs gubernamentales**), este scraper automático permanece bloqueado en el lienzo activo. Para auditar soportes médicos e IPS hoy mismo sin CAPTCHA, utiliza el nodo activo **\`🔬 Forense Incapacidad (forensic_doc_verifier)\`**, que cruza el **REPS MinSalud (\`datos.gov.co\`)** vía API abierta y entrega el enlace oficial a ReTHUS para verificación humana.\n\n`;
  } else if (node.id === 'scraper_agy_pensiones_directo') {
    sec1 += `> [!WARNING]\n> **¿Por qué este nodo está marcado como \`🚧 En Construcción\`?:**\n> Los portales individuales de fondos de pensiones en Colombia (*Porvenir*, *Protección Certifácil*, *Colfondos*, *Skandia* y *Colpensiones RPM*) aplican barreras CAPTCHA interactivas, tokens OTP o sesiones autenticadas del afiliado que impiden el barrido desatendido sin intervención humana. Por ello, \`sanitizeWorkflowNodesForActiveUse\` impide inyectarlo en flujos activos hasta contar con pasarela oficial autorizada.\n\n`;
  } else if (isUnderConstruction) {
    const replacementId =
      BLOCKED_HITO_ACTIVE_REPLACEMENTS[node.id] ||
      (node.sgsstAppId ? BLOCKED_HITO_ACTIVE_REPLACEMENTS[node.sgsstAppId] : undefined);
    sec1 += `> [!WARNING]\n> **Estado Actual: \`🚧 En Construcción\` en Somos SST:**\n> Este nodo forma parte de la arquitectura maestra de WAPPY IA pero se encuentra temporalmente deshabilitado para ejecución activa (sincronizado en vivo con \`GET /api/sgsst/config -> disabledApps\`). Ninguna plantilla preestablecida lo inyecta en producción${
      replacementId ? `, empleando automáticamente su nodo activo equivalente (\`${replacementId}\`)` : ''
    }.\n\n`;
  } else if (node.id.startsWith('scraper_agy_') || node.id === 'extract_web_scraping_agy' || node.id === 'tool_web_scraping_agy') {
    sec1 += `> [!TIP]\n> **Cascada Oficial de Protección en 3 Niveles (Cero Chromium en VPS):**\n> Opera con continuidad garantizada mediante **1° Google Antigravity Local · Navegador Nativo Integrado** (vía Push SSE en tu Mac/PC, sin abrir ventanas externas de Chrome) ➔ **2° Google Antigravity Cloud 24/7** (\`antigravity.google.com\`) ➔ **3° Respaldo HTTP Seguro** en servidor. Todos los certificados descargados (\`.PDF\` y capturas \`.PNG\`) se depositan automáticamente en la **Bandeja Dedicada de Evidencias** sin ensuciar el texto del informe ejecutivo.\n\n`;
  }

  sec1 += `- **Identificador Técnico en Catálogo:** \`${node.id}\`${node.sgsstAppId ? ` · **App ID Somos SST:** \`${node.sgsstAppId}\`` : ''}\n`;
  sec1 += `- **Conector / Motor Interno:** \`${node.toolHint}\`\n`;
  sec1 += `- **Estado Operativo:** ${isUnderConstruction ? '🚧 **En Construcción** (Documentado · Bloqueado preventivamente en lienzo activo)' : '✅ **Activo y Verificado en Producción**'}\n`;
  if (node.targetUrl) {
    sec1 += `- **Portales / URLs Oficiales Vinculadas:** \`${node.targetUrl}\`\n`;
  }

  // ── SECCIÓN 2: ¿DESDE DÓNDE SE USA Y DÓNDE SE CONECTA? ──
  let sec2 = `\n### 2. ¿Desde Dónde se Usa y Dónde se Conecta?\n\n`;
  if (node.familyId === 'triggers') {
    sec2 += `- **Ubicación Causal en el Lienzo (Izquierda ➔ Derecha):** **Etapa 1 — Disparador Raíz (\`Paso #1\`)** en el extremo izquierdo del grafo.\n`;
    sec2 += `- **Puertos de Conexión:** No tiene puerto izquierdo (es el origen del evento, identificado con el rayo naranja \`⚡\`). Por su **puerto circular derecho (\`●\`)** emite el evento disparador hacia una Compuerta \`Pre-Fuentes\`, un Extractor de Etapa 2 o directamente hacia el \`Agente IA\`.\n`;
    sec2 += `- **¿Desde dónde se activa?:** ${
      node.id === 'trigger_tenshi'
        ? 'Directamente hablando por micrófono con **Tenshi Voice (Gemini Live)** o escribiendo en el chat de Tenshi IA.'
        : node.id === 'schedule_cron'
          ? 'Automáticamente desde el planificador **Cron de `/tareas`** (horario diario, semanal, mensual o por intervalo de horas en zona `America/Bogota`) o manualmente con el botón **Ejecutar Ahora**.'
          : node.id === 'trigger_qr_worker'
            ? 'Desde cualquier celular en obra, planta o vía pública al escanear el **Código QR corporativo** del aplicativo en Somos SST.'
            : node.id.includes('antigravity')
              ? 'Desde tu entorno **Google Antigravity** (Local Mac/PC vía `wappy-push-daemon.js` Push SSE o instancia Cloud 24/7 en `antigravity.google.com`).'
              : node.id === 'trigger_email'
                ? 'Al ingresar un correo electrónico nuevo en la bandeja vinculada de **Google Gmail** que coincida con el filtro de asunto/remitente/adjunto.'
                : 'Por invocación externa autenticada (Webhook REST / Delegación entre Agentes Especialistas de WAPPY).'
    }\n`;
  } else if (node.familyId === 'extractors') {
    sec2 += `- **Ubicación Causal en el Lienzo:** ${
      node.supportsDualStageToggle
        ? '**Nodo Dual Inteligente:** Puede ubicarse en **Etapa 2 (Lectura Previa Cuadrada)** entre el Disparador y el Agente IA para barridos masivos, **O** conectarse como **Satélite Circular en el puerto inferior `◆ Herramienta +`** del Agente IA para consultas puntuales por cédula/placa/adjunto (puedes alternar ambas vistas reales arriba en el Escenario del Lienzo).'
        : node.id === 'extract_ai_doc_ocr'
          ? '**Etapa 2.5 — Transformador IA + Visión OCR Multimodal**, ubicado justo después de `Leer Gmail`, `Extraer de Drive` o `Carpeta en mi PC` y antes del `Agente IA Principal`.'
          : '**Etapa 2 — Extracción e Ingesta de Datos**, conectado a la derecha del Disparador y a la izquierda de la Compuerta `Condición Si/No` o del `Agente IA`.'
    }\n`;
    sec2 += `- **Puertos de Conexión:** En modo Etapa 2 recibe señal por su **puerto izquierdo (\`●\`)** y entrega filas/documentos depurados por su **puerto derecho (\`●\`)**.${
      node.supportsDualStageToggle
        ? ' En modo Satélite `Herramienta +`, se une mediante **cable punteado superior** desde su **rombo superior (`◆`)** hacia el puerto `◆ Herramienta +` del Agente IA.'
        : ''
    }\n`;
    sec2 += `- **Canales de Activación Compatibles:** Tenshi Voz/Chat (\`trigger_tenshi\`), Reloj Cron en \`/tareas\`, Reporte QR en campo y Puente Google Antigravity Local/Cloud.\n`;
  } else if (node.familyId === 'ai_memories') {
    if (node.id === 'agent_root' || node.id === 'agent_extra') {
      sec2 += `- **Ubicación Causal en el Lienzo:** **${
        node.id === 'agent_root'
          ? 'Etapa 3 — Núcleo Central de Razonamiento (`Agente IA Principal`)'
          : 'Etapa 4.5 — Segundo Eslabón de Revisión Multi-Agente (`Agente IA #2`)'
      }**.\n`;
      sec2 += `- **Puertos de Conexión (5 Puertos Activos):**\n`;
      sec2 += `  1. **Puerto Izquierdo (\`■\`):** Recibe los registros ya filtrados de Etapa 2 o de la rama \`sí\` de la Condición Pre-Agente.\n`;
      sec2 += `  2. **Puerto Derecho (\`●\`):** Entrega el dictamen estructurado hacia Hitos de Escritura, Compuerta Post-IA, Aprobación Humana o Salidas.\n`;
      sec2 += `  3. **Rombo Inferior 1 (\`◆ Modelo IA *\`):** Conecta el motor LLM (Gemini 3.6/3.5/3.8 Flash o Antigravity + MCP).\n`;
      sec2 += `  4. **Rombo Inferior 2 (\`◆ Memoria [+\`):** Inyecta contexto de Empresa Activa, Anti-Duplicados, RAG NotebookLM y Reglas SST.\n`;
      sec2 += `  5. **Rombo Inferior 3 (\`◆ Herramienta [+\`):** Conecta conectores Google, APIs científicas, Scrapers OSINT, Forense e Hitos en modo herramienta.\n`;
    } else {
      sec2 += `- **Ubicación Causal en el Lienzo:** **Satélite Circular Inferior en Etapa 3**, suspendido debajo de la tarjeta del \`Agente IA\`.\n`;
      sec2 += `- **Puertos de Conexión:** Posee un **puerto superior en forma de rombo (\`◆\`)** que se enlaza con cable punteado exclusivo hacia el rombo **\`${
        node.subGroup === 'models' ? '◆ Modelo IA *' : '◆ Memoria [+]'
      }\`** del Agente IA.\n`;
      sec2 += `- **¿Desde dónde se activa?:** Se carga automáticamente cada vez que el Agente IA entra en ejecución, ya sea por orden de voz/chat en Tenshi, corrida programada Cron en \`/tareas\` o simulación en el Escenario de Desarrollo (Sandbox).\n`;
    }
  } else if (node.familyId === 'connectors' || node.familyId === 'skills_subagents') {
    sec2 += `- **Ubicación Causal en el Lienzo:** **Satélite Circular del Agente IA** conectado al tercer rombo inferior **\`◆ Herramienta [+]\`**${
      node.supportsDualStageToggle
        ? ' (o conectable también en línea principal como nodo cuadrado de extracción web).'
        : '.'
    }\n`;
    sec2 += `- **Puertos de Conexión:** Su **rombo superior (\`◆\`)** se enlaza mediante cable curvo punteado índigo/violeta al puerto \`◆ Herramienta +\` del Agente IA, quedando disponible como *Tool Calling* o directiva procedural durante el razonamiento.\n`;
    sec2 += `- **¿Desde dónde se activa?:** Desde la pestaña **Herramientas / Skills & Sub-Agentes** de la paleta superior del lienzo o haciendo clic directo sobre el botón **\`+\`** del rombo \`Herramienta +\` debajo del Agente IA.\n`;
  } else if (node.familyId === 'hitos') {
    sec2 += `- **Ubicación Causal Dual / Triple en el Lienzo (Estilo n8n + Somos SST):**\n`;
    sec2 += `  1. **Modo Lectura Previa (\`source_read\` — Etapa 2):** Se dibuja como **Nodo Cuadrado Redondeado** a la izquierda del Agente IA para extraer expedientes, brechas o vencimientos reales antes de evaluar condiciones.\n`;
    sec2 += `  2. **Modo Herramienta del Agente (\`agent_tool\` — Satélite en \`◆ Herramienta +\`):** Se dibuja como **Nodo Circular Satélite** debajo del Agente IA para cruzar o actualizar registros puntuales durante el análisis.\n`;
    sec2 += `  3. **Modo Destino + Informe Oficial (\`target_write_report\` — Etapa 4):** Guarda cambios en MongoDB dentro del aplicativo **${node.shortLabel}** y regenera el **Informe Oficial HTML** de la empresa.\n`;
    sec2 += `- **¿Desde dónde se alimenta y consulta?:** Sincronizado en tiempo real con el módulo **${node.label}** en **Somos SST**, accesible por voz/chat desde Tenshi IA, flujos Cron en \`/tareas\`, códigos QR y herramientas MCP de Antigravity.\n`;
  } else if (node.familyId === 'logic_dag') {
    sec2 += `- **Ubicación Causal en el Lienzo:** ${
      node.id === 'if_router'
        ? 'Configurable en **3 puntos estratégicos**: **1) `🚦 Pre-Fuentes`** (entre Disparador y Extractores/Scrapers para decidir si consultar por Cédula/Placa explícita o buscar primero en H2 Sociodemográfico), **2) `⚡ Pre-Agente IA`** (entre Fuentes y Agente IA: si la rama es `no`, desvía directo a notificación limpia gastando **0 tokens de IA**), o **3) `🤖 Post-Agente IA`** (después del Agente IA evaluando `[VEREDICTO_IF: SI/NO]`).'
        : node.id === 'logic_human_approval'
          ? '**Etapa 4.2 — Post-Agente y Pre-Salidas**, justo antes de despachar correos, documentos o escrituras críticas.'
          : '**Etapa 2.2 — Entre Extractores de Datos y el Agente IA**, preparando, uniendo, filtrando o iterando los lotes de entrada.'
    }\n`;
    sec2 += `- **Puertos de Conexión:** Entra por su **puerto izquierdo (\`●\`)** y sale por ${
      node.id === 'if_router'
        ? 'sus **2 puertos derechos diferenciados**: **Puerto Superior Verde (\`● sí\`)** para hallazgos/condición cumplida y **Puerto Inferior Gris (\`● no\`)** para ruta silenciosa o alternativa.'
        : 'su **puerto derecho (\`●\`)** entregando los registros procesados al siguiente eslabón.'
    }\n`;
  } else {
    sec2 += `- **Ubicación Causal en el Lienzo:** **Etapa 5 — Cierre, Despacho y Bitácora Final**, en el extremo derecho del grafo.\n`;
    sec2 += `- **Puertos de Conexión:** Recibe por su **puerto izquierdo (\`●\`)** el dictamen final del Agente IA (o la rama \`sí\` / \`no\` de la Condición Si/No, con soporte de encadenamiento adicional en su puerto derecho \`● + [+]\`).\n`;
    sec2 += `- **Seguridad en Pruebas (Modo Sandbox):** Al pulsar **Simular Flujo (Play)** en el Escenario de Desarrollo, este nodo es interceptado automáticamente (\`🛡️ Paso Simulado\`) mostrando la vista previa exacta del correo, tarea ACPM o documento sin enviar correos reales por accidente.\n`;
  }

  // ── SECCIÓN 3: ¿CÓMO SE USA PASO A PASO? ──
  let sec3 = `\n### 3. ¿Cómo se Usa Paso a Paso? (Inspector de 3 Columnas)\n\n`;
  sec3 += `1. **Insertar en el Lienzo:** En \`/tareas\` pulsa **Nueva Tarea** (o edita un flujo existente), ubica la familia **${node.familyLabel}** en la paleta superior y haz clic o arrastra **«${node.shortLabel}»** hacia el lienzo punteado.\n`;
  sec3 += `2. **Abrir el Inspector de 3 Paneles (\`📥 INPUT · ⚙️ CONFIGURACIÓN · 📤 SALIDA\`):** Haz clic directo sobre el nodo en el lienzo para abrir su ventana estilo *n8n*:\n`;
  sec3 += `   - **Panel Izquierdo (\`📥 ENTRADA\`):** Revisa qué nodo anterior le entrega datos en vivo y qué columnas están llegando.\n`;
  if (node.familyId === 'hitos') {
    sec3 += `   - **Panel Central (\`⚙️ CONFIGURACIÓN\`):** Elige el **Rol del Aplicativo** (\`Solo Lectura en Etapa 2\`, \`Crear / Actualizar Registros\` o \`Guardar + Emitir Informe Oficial HTML\`), selecciona el **Filtro de Registros en Vivo** (\`Todos\`, \`🚨 Solo Críticos/En Brecha\`, \`⏳ Solo Vencimientos <= 30d\`, \`🎯 Selección Específica\` o \`🔎 Solo por Nombre\`) y marca un **Combo Quirúrgico de 1 Clic** para no saturar el flujo.\n`;
  } else if (node.id === 'extract_ai_doc_ocr') {
    sec3 += `   - **Panel Central (\`⚙️ CONFIGURACIÓN\`):** Define el **Esquema Exacto de Columnas OCR** (\`Nombre de columna\`, \`Tipo: string/date/number/boolean\` y descripción) y elige si cada PDF/imagen genera \`1 fila por documento\` o \`Varias filas por tabla\`.\n`;
  } else if (node.id === 'forensic_doc_verifier') {
    sec3 += `   - **Panel Central (\`⚙️ CONFIGURACIÓN\`):** Activa o ajusta las casillas forenses (\`forensicCheckMetadata\`, \`forensicCheckVisualTampering\`, \`forensicCheckDecreto1427\`) y elige qué campos del veredicto forense pasar al Agente Médico/Auditor.\n`;
  } else if (node.id === 'if_router') {
    sec3 += `   - **Panel Central (\`⚙️ CONFIGURACIÓN\`):** Selecciona la **Ubicación Causal** (\`Pre-Fuentes\`, \`Pre-Agente IA 0 Tokens\` o \`Post-Agente IA\`), el **Modo de Condición** (\`¿Dio Cédula o Placa?\`, \`¿Trae Adjunto?\`, \`¿Hay Críticos/Vencimientos?\`, \`Umbral Numérico\` o \`Veredicto Experto IA\`) y personaliza las etiquetas de las ramas \`sí\` y \`no\`.\n`;
  } else if (node.requiresAntigravity) {
    sec3 += `   - **Panel Central (\`⚙️ CONFIGURACIÓN\`):** Elige el **Modo de Conexión Google Antigravity** (\`⚡ Automático: 1° Local PC ➔ 2° Cloud 24/7\`, \`💻 Solo Local Mac/PC\` o \`☁️ Solo Cloud\`), selecciona los portales/casillas quirúrgicas y, si aplica, ajusta la URL o selector.\n`;
  } else {
    sec3 += `   - **Panel Central (\`⚙️ CONFIGURACIÓN\`):** Activa un **Combo Rápido de 1 Clic** o marca únicamente las **Casillas Quirúrgicas** necesarias (\`strictFieldFilter\`) y añade cualquier instrucción puntual en *Instrucción Específica del Nodo*.\n`;
  }
  sec3 += `   - **Panel Derecho (\`📤 SALIDA / 📜 LOGS\`):** Comprueba en vivo la vista previa filtrada de columnas y los tiempos de ejecución reales en milisegundos.\n`;
  sec3 += `3. **Probar en Sandbox antes de Activar:** Pulsa **Simular Flujo** en la barra superior del lienzo para ver cómo se ilumina \`Paso #N\` en tiempo real sin disparar correos externos, y finalmente pulsa **Guardar Automatización**.\n`;

  if (meta.quickCombos && meta.quickCombos.length > 0) {
    sec3 += `\n#### ⚡ Combos Rápidos de 1 Clic Disponibles (${meta.quickCombos.length})\n`;
    meta.quickCombos.forEach((combo) => {
      sec3 += `- **${combo.label}**${combo.description ? ` — *${combo.description}*` : ''}\n`;
    });
  }

  if (meta.fields && meta.fields.length > 0) {
    sec3 += `\n#### 🎯 Casillas Quirúrgicas Reales (\`${meta.fieldsLabel}\` — ${meta.fields.length} campos)\n`;
    meta.fields.forEach((f) => {
      sec3 += `- \`${f}\`\n`;
    });
  }

  // ── SECCIÓN 4: ENTRADAS (INPUT) Y SALIDAS (OUTPUT) ──
  let sec4 = `\n### 4. Entradas (\`INPUT\`) y Salidas (\`OUTPUT\`)\n\n`;
  const inputSummary =
    node.familyId === 'triggers'
      ? 'Señal del evento originador (expresión horaria Cron Bogotá, transcripción de voz/chat de Tenshi, archivo/correo entrante o JSON del Webhook/QR).'
      : node.familyId === 'extractors'
        ? 'Parámetros de búsqueda heredados del Disparador o Compuerta Pre-Fuentes (Cédula, Placa, NIT, Carpeta Drive/PC, Filtro Gmail o Archivo PDF/Imagen adjunto).'
        : node.familyId === 'ai_memories' && (node.id === 'agent_root' || node.id === 'agent_extra')
          ? 'Tablas y registros filtrados de Etapa 2 + Contexto de Memorias (`◆ Memoria +`) + Resultados de herramientas invocadas en `◆ Herramienta +`.'
          : node.familyId === 'ai_memories'
            ? 'Solicitud de contexto o inferencia emitida automáticamente desde el puerto en rombo inferior del Agente IA.'
            : node.familyId === 'connectors' || node.familyId === 'skills_subagents'
              ? 'Parámetros puntuales invocados por el Agente IA durante su razonamiento (ej. cédula, sustancia CAS, ciudad/sede, cuaderno RAG o consulta normativa).'
              : node.familyId === 'hitos'
                ? 'En Etapa 2: filtros quirúrgicos (`expiry_only`, `critical_only`, `selectedFields`). En `Herramienta +` / Etapa 4: registros validados por cédula o código desde el Agente IA.'
                : node.familyId === 'logic_dag'
                  ? 'Arreglo estructurado de registros/archivos provenientes de Etapa 2 o respuesta evaluada del Agente IA.'
                  : 'Dictamen ejecutivo en Markdown/HTML, tablas comparativas, alertas priorizadas y bandeja de evidencias generadas por el flujo.';

  const outputSummary =
    node.familyId === 'triggers'
      ? 'Contexto inicial de disparo (`triggerSource`, `userInstruction`, `companyId`, parámetros detectados de cédula/placa/adjuntos) hacia Etapa 2 o Pre-Fuentes.'
      : node.id === 'forensic_doc_verifier'
        ? 'Dictamen Forense Estructurado: Índice de Riesgo Forense, hallazgos EXIF/XMP/`%%EOF`, anomalías visuales, validación Decreto 1427/2022, cruce REPS MinSalud (`datos.gov.co`) y enlace ReTHUS SISPRO.'
        : node.id === 'extract_ai_doc_ocr'
          ? 'Tabla JSON/Markdown tipada exactamente con las columnas definidas en `aiExtractionSchema` (1 fila o múltiples filas por PDF/imagen procesado con OCR).'
          : node.id.startsWith('scraper_agy_')
            ? 'Tabla oficial verificada por Cédula/Placa + Certificados originales `.PDF` y capturas `.PNG` depositados en la Bandeja de Evidencias (`WorkflowEvidenceTray`).'
            : node.familyId === 'extractors'
              ? 'Colección depurada de registros reales únicamente con las casillas quirúrgicas seleccionadas (`strictFieldFilter`) lista para evaluar o analizar.'
              : node.familyId === 'ai_memories' && (node.id === 'agent_root' || node.id === 'agent_extra')
                ? 'Informe técnico-normativo en Markdown limpio (sin ruido de enlaces crudos), tablas comparativas, tarjeta `wappy-card` y órdenes de escritura hacia Hitos/Salidas.'
                : node.familyId === 'ai_memories'
                  ? 'Inyección determinista de parámetros de empresa, filtro anti-duplicados (`AutomationLog`), citas RAG o inferencia del modelo seleccionado.'
                  : node.familyId === 'connectors' || node.familyId === 'skills_subagents'
                    ? 'Respuesta estructurada verificada devuelta directamente al ciclo de razonamiento del Agente IA.'
                    : node.familyId === 'hitos'
                      ? 'En Lectura: filas reales filtradas del Hito. En Escritura: confirmación de creación/actualización en MongoDB + Informe Oficial HTML en el historial del aplicativo.'
                      : node.familyId === 'logic_dag'
                        ? node.id === 'if_router'
                          ? 'Activación exclusiva de la rama `sí` (verde) o `no` (gris) con trazabilidad exacta del motivo de decisión (`reason`).'
                          : 'Lote fusionado, filtrado, iterado o autorizado por humano listo para el siguiente paso.'
                        : 'Ejecución real del canal de entrega (Correo HTML corporativo, Campana WAPPY + Chat Tenshi, Tarea Kanban ACPM, LiveEditor Word/PDF o Google Workspace) y registro en Bitácora.';

  sec4 += `| Dirección | Detalle Técnico en Tiempo de Ejecución |\n`;
  sec4 += `| :--- | :--- |\n`;
  sec4 += `| **📥 Entrada (\`INPUT\`)** | ${inputSummary} |\n`;
  sec4 += `| **⚙️ Procesamiento** | Filtra campos quirúrgicos (\`${meta.moduleBadge}\`), protege aislamiento multi-empresa (\`companyId\`) y registra latencia en \`executionTrace\`. |\n`;
  sec4 += `| **📤 Salida (\`OUTPUT\`)** | ${outputSummary} |\n`;

  // ── SECCIÓN 5: EJEMPLOS REALES DE FLUJO Y CÓMO PEDÍRSELO A TENSHI ──
  let flowDiagramAscii = '';
  if (node.familyId === 'triggers') {
    flowDiagramAscii = `[⚡ ${node.shortLabel}] ──▶ [📥 H2: Sociodemográfico] ──▶ [🔀 Condición Pre-IA] ──(sí)──▶ [🧠 Agente IA] ──▶ [📤 Bitácora a Gmail]`;
  } else if (node.id === 'forensic_doc_verifier') {
    flowDiagramAscii = `[⚡ Tenshi IA / Gmail] ──▶ [📥 Adjunto PDF/Imagen] ──▶ [🧠 Agente Médico IA + ◆ 🔬 Forense Incapacidad + ◆ H2: Sociodemográfico] ──▶ [📤 H7: Ausentismo + Notificar WAPPY]`;
  } else if (node.id.startsWith('scraper_agy_')) {
    flowDiagramAscii = `[⚡ Tenshi IA] ──▶ [🔀 ¿Dio Cédula/Placa?] ──(sí)──▶ [🧠 Agente IA + ◆ ${node.shortLabel}] ──▶ [📎 Bandeja PDF/PNG + 📤 Notificar WAPPY]`;
  } else if (node.familyId === 'extractors') {
    flowDiagramAscii = `[⚡ Cron Programado] ──▶ [📥 ${node.shortLabel}] ──▶ [🔀 ¿Novedades >= 1?] ──(sí)──▶ [🧠 Agente IA] ──▶ [📤 Centro de Control ACPM + Gmail]`;
  } else if (node.familyId === 'ai_memories') {
    flowDiagramAscii = `[⚡ Tenshi IA / Cron] ──▶ [📥 Fuente SST] ──▶ [🧠 Agente IA ◄── ◆ ${node.shortLabel}] ──▶ [📤 Documento LiveEditor + WAPPY]`;
  } else if (node.familyId === 'connectors' || node.familyId === 'skills_subagents') {
    flowDiagramAscii = `[⚡ Tenshi IA] ──▶ [🧠 Agente IA Principal ◄── ◆ ${node.shortLabel}] ──▶ [🛡️ Guardar en Hito SST] ──▶ [📤 Notificar en WAPPY]`;
  } else if (node.familyId === 'hitos') {
    flowDiagramAscii = `[⚡ Cron / Tenshi IA] ──▶ [📥 ${node.shortLabel} (Lectura Brechas)] ──▶ [🔀 Condición Pre-IA (0 tok NO)] ──(sí)──▶ [🧠 Agente IA] ──▶ [📤 Tarea ACPM + Bitácora Gmail]`;
  } else if (node.familyId === 'logic_dag') {
    flowDiagramAscii =
      node.id === 'if_router'
        ? `[📥 Fuente SST] ──▶ [🔀 ${node.shortLabel}] ──(sí: hay brechas)──▶ [🧠 Agente IA] ──▶ [📤 ACPM + Gmail]\n                                      └──(no: 0 tokens IA)──────────────────────▶ [📤 Notificar en WAPPY]`
        : `[⚡ Disparador] ──▶ [📥 Fuentes SST] ──▶ [🔀 ${node.shortLabel}] ──▶ [🧠 Agente IA] ──▶ [📤 Bitácora y Salida]`;
  } else {
    flowDiagramAscii = `[⚡ Cron / Tenshi IA] ──▶ [📥 Fuente SST] ──▶ [🧠 Agente IA Principal] ──▶ [📤 ${node.shortLabel}]`;
  }

  let tenshiVoicePrompt = '';
  if (node.id === 'forensic_doc_verifier') {
    tenshiVoicePrompt =
      'Tenshi, ejecuta una auditoría forense completa sobre esta incapacidad médica adjunta: revisa metadatos EXIF/PDF, posibles alteraciones visuales, cumplimiento del Decreto 1427 de 2022, habilitación de la IPS en REPS MinSalud y entrégame el veredicto con el enlace oficial de ReTHUS.';
  } else if (node.id === 'scraper_agy_arl_directo') {
    tenshiVoicePrompt =
      'Tenshi, verifica en vivo la afiliación a ARL y descarga el certificado oficial por cédula en los portales de SURA, Positiva, Colmena, AXA Colpatria y Bolívar para el colaborador con cédula 1020304050.';
  } else if (node.id === 'scraper_agy_alto_riesgo') {
    tenshiVoicePrompt =
      'Tenshi, consulta en vivo en MinTrabajo Centros de Entrenamiento y SENA Sofia Plus los certificados vigentes de Trabajo en Alturas (Res. 4272) y Espacios Confinados para la cédula 1020304050 y adjunta los soportes PDF.';
  } else if (node.id === 'scraper_agy_vial_pesv') {
    tenshiVoicePrompt =
      'Tenshi, audita en vivo para Seguridad Vial PESV los comparendos en SIMIT, la vigencia de licencia en RUNT por cédula 1020304050 y el SOAT y Tecnomecánica en RUNT para la placa ABC123.';
  } else if (node.id === 'scraper_agy_antecedentes') {
    tenshiVoicePrompt =
      'Tenshi, realiza la debida diligencia de antecedentes y procesos judiciales en Rama Judicial, Contraloría, Procuraduría y Policía para la cédula 1020304050 y deja las constancias en la bandeja de certificados.';
  } else if (node.familyId === 'hitos') {
    tenshiVoicePrompt = `Tenshi, audita en ${node.label} de la empresa activa únicamente los registros críticos o próximos a vencer, cruza la normativa aplicable y créame el plan de acción en el tablero ACPM.`;
  } else if (node.familyId === 'triggers') {
    tenshiVoicePrompt = `Tenshi, ayúdame a configurar un flujo autónomo disparado por «${node.shortLabel}» para vigilar vencimientos críticos de SST en nuestra empresa activa y enviarme la bitácora ejecutiva.`;
  } else {
    tenshiVoicePrompt = `Tenshi, ejecuta un análisis SG-SST en la empresa activa utilizando «${node.label}», muéstrame la tabla comparativa de hallazgos reales sin inventar datos y sugiere las acciones preventivas prioritarias.`;
  }

  let sec5 = `\n### 5. Ejemplos Reales de Flujo y Cómo Pedírselo a Tenshi\n\n`;
  sec5 += `#### 🔗 Topología Real en el Lienzo WAPPY\n`;
  sec5 += `\`\`\`flow\n${flowDiagramAscii}\n\`\`\`\n\n`;
  if (matchedPreset) {
    sec5 += `- **Plantilla Oficial Preconstruida donde participa:** **«${matchedPreset.name}»** *(disponible en 1 clic desde el botón \`Flujos Preestablecidos\`)*.\n\n`;
  }
  sec5 += `#### 🎙️ Frase Exacta para Pedírselo a Tenshi (Voz o Chat)\n`;
  sec5 += `> "${tenshiVoicePrompt}"\n`;

  const headerMd = `# ${node.label}\n\n**Familia:** ${node.familyLabel} · **Insignia:** \`${node.badge}\` · **ID:** \`${node.id}\` · **Estado:** ${
    isUnderConstruction ? '🚧 En Construcción' : '✅ Activo'
  }\n\n---\n\n`;

  return {
    markdown: `${headerMd}${sec1}${sec2}${sec3}${sec4}${sec5}`,
    tenshiVoicePrompt,
    flowDiagramAscii,
    meta,
    isUnderConstruction,
  };
}

export function buildCompleteEncyclopediaMarkdown(disabledApps?: string[] | null): string {
  const allNodes = getDocumentedCatalogNodes();
  const activeCount = allNodes.filter(
    (n) => !(n.defaultConstruction || isWorkflowNodeUnderConstruction(n.rawDef, disabledApps)),
  ).length;
  const constructionCount = allNodes.length - activeCount;

  const lines: string[] = [
    `# 📘 Enciclopedia Oficial SmartDown de Nodos de Automatización — WAPPY IA`,
    ``,
    `> **Total de Nodos Documentados:** ${allNodes.length} (\`✅ ${activeCount} Activos\` · \`🚧 ${constructionCount} En Construcción\`)`,
    `> **Arquitectura:** Grafo Acíclico Dirigido (DAG Causal Izquierda ➔ Derecha estilo n8n + Somos SST 8 Hitos + Google Antigravity).`,
    ``,
    `## Índice por las 8 Familias Oficiales de Nodos`,
    ``,
  ];

  NODE_DOC_FAMILIES.filter((f) => f.id !== 'all').forEach((fam) => {
    const famNodes = allNodes.filter((n) => n.familyId === fam.id);
    lines.push(`- **${fam.label}:** ${famNodes.length} nodos`);
  });

  lines.push(``, `---`, ``);

  allNodes.forEach((node, idx) => {
    const doc = buildNodeSmartDownDoc(node, disabledApps);
    lines.push(`<!-- NODO ${idx + 1} DE ${allNodes.length}: ${node.id} -->`);
    lines.push(doc.markdown);
    lines.push(`\n---\n`);
  });

  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. ESCENARIO DE RÉPLICA VISUAL EXACTA DEL LIENZO WAPPY (PIXEL-ACCURATE)
   ═══════════════════════════════════════════════════════════════════════════ */

const NodeCanvasStageReplica: React.FC<{
  node: DocumentedWorkflowNode;
  isUnderConstruction: boolean;
  previewMode: NodeCanvasPreviewMode;
  onChangePreviewMode: (mode: NodeCanvasPreviewMode) => void;
}> = ({ node, isUnderConstruction, previewMode, onChangePreviewMode }) => {
  const effectiveRenderType: 'agent_card' | 'satellite_circle' | 'square_stage' = useMemo(() => {
    if (node.defaultShape === 'agent_root' || node.defaultShape === 'agent_extra') {
      return 'agent_card';
    }
    if (node.supportsDualStageToggle) {
      if (previewMode === 'agent_satellite') return 'satellite_circle';
      return 'square_stage';
    }
    if (
      node.defaultShape === 'circle_model' ||
      node.defaultShape === 'circle_memory' ||
      node.defaultShape === 'circle_tool' ||
      node.defaultShape === 'custom_satellite'
    ) {
      return 'satellite_circle';
    }
    return 'square_stage';
  }, [node, previewMode]);

  const iconLookupId = useMemo(() => {
    if (node.id === 'agent_extra') return 'subagent_researcher';
    if (node.defaultShape === 'custom_satellite') {
      if (node.id.includes('scraper_agy_')) return node.id;
      if (node.subGroup === 'web_scraper') return 'web_scraper';
      if (node.subGroup === 'skill') return 'skill';
      if (node.subGroup === 'rule') return 'rule';
      if (node.subGroup === 'subagent') return node.id;
      return 'web_search';
    }
    return node.id;
  }, [node]);

  const stepBadgeLabel = useMemo(() => {
    if (node.familyId === 'triggers') return 'Paso #1';
    if (effectiveRenderType === 'satellite_circle') return 'Paso #3';
    if (node.id === 'agent_root') return 'Paso #4';
    if (node.id === 'agent_extra') return 'Paso #6';
    if (node.familyId === 'outputs') return 'Paso #5';
    if (node.familyId === 'hitos' && previewMode === 'stage4_write') return 'Paso #5';
    if (node.familyId === 'logic_dag') return 'Paso #3';
    return 'Paso #2';
  }, [node, effectiveRenderType, previewMode]);

  // Clases exactas de borde y puertos según tipo en WappyWorkflowCanvas.tsx
  const squareBorderClass = useMemo(() => {
    if (isUnderConstruction) {
      return 'border-dashed border-amber-400 dark:border-amber-500';
    }
    if (node.id === 'forensic_doc_verifier') {
      return 'border-rose-400 dark:border-rose-500';
    }
    if (node.id === 'extract_ai_doc_ocr') {
      return 'border-purple-400 dark:border-purple-500';
    }
    if (node.familyId === 'triggers') {
      return 'border-slate-300 dark:border-slate-600 hover:border-orange-500';
    }
    if (node.familyId === 'hitos') {
      return previewMode === 'stage4_write'
        ? 'border-emerald-400 dark:border-emerald-500'
        : 'border-teal-400 dark:border-teal-500';
    }
    if (node.defaultShape === 'if_router') {
      return 'border-emerald-400 dark:border-emerald-500';
    }
    if (node.familyId === 'logic_dag') {
      return 'border-amber-400 dark:border-amber-500';
    }
    if (node.familyId === 'outputs') {
      return 'border-purple-400/90 dark:border-purple-500/80';
    }
    if (node.id.startsWith('scraper_agy_')) {
      return node.id === 'scraper_agy_arl_directo'
        ? 'border-emerald-400 dark:border-emerald-500'
        : 'border-amber-400 dark:border-amber-500';
    }
    return 'border-sky-400 dark:border-sky-500';
  }, [node, isUnderConstruction, previewMode]);

  const satelliteBorderClass = useMemo(() => {
    if (isUnderConstruction) {
      return 'border-dashed border-amber-400 dark:border-amber-500';
    }
    if (node.defaultShape === 'circle_model') {
      return node.id.includes('cloud')
        ? 'border-sky-500 ring-2 ring-sky-500/20'
        : node.id.includes('antigravity')
          ? 'border-orange-500 ring-2 ring-orange-500/20'
          : 'border-indigo-500 ring-2 ring-indigo-500/20';
    }
    if (node.defaultShape === 'circle_memory') {
      return 'border-pink-400 dark:border-pink-600';
    }
    if (node.familyId === 'hitos') {
      return 'border-teal-400 dark:border-teal-500';
    }
    if (node.id === 'forensic_doc_verifier') {
      return 'border-rose-400 dark:border-rose-500 ring-2 ring-rose-500/15';
    }
    if (node.id === 'scraper_agy_arl_directo') {
      return 'border-emerald-400 dark:border-emerald-500';
    }
    if (node.id.startsWith('scraper_agy_') || node.id.includes('scraping')) {
      return 'border-amber-400 dark:border-amber-500';
    }
    if (node.subGroup === 'skill') {
      return 'border-violet-400 dark:border-violet-500';
    }
    if (node.subGroup === 'rule') {
      return 'border-emerald-400 dark:border-emerald-500';
    }
    if (node.subGroup === 'subagent') {
      return 'border-indigo-400 dark:border-indigo-500';
    }
    return 'border-slate-300 dark:border-slate-600';
  }, [node, isUnderConstruction]);

  const diamondPortMeta = useMemo(() => {
    if (node.defaultShape === 'circle_model') {
      return {
        label: 'Modelo IA *',
        diamondClass: 'bg-indigo-500',
        wireColor: '#818cf8',
        plusColor: 'text-indigo-600',
        showPlus: false,
      };
    }
    if (node.defaultShape === 'circle_memory') {
      return {
        label: 'Memoria',
        diamondClass: 'bg-pink-500',
        wireColor: '#ec4899',
        plusColor: 'text-pink-600',
        showPlus: true,
      };
    }
    return {
      label: 'Herramienta',
      diamondClass: node.id === 'forensic_doc_verifier' ? 'bg-rose-500' : 'bg-indigo-500',
      wireColor: node.id === 'forensic_doc_verifier' ? '#f43f5e' : '#818cf8',
      plusColor: 'text-purple-600',
      showPlus: true,
    };
  }, [node]);

  return (
    <div className="shrink-0 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-[#f8fafc] dark:bg-[#0b1120] shadow-inner overflow-hidden relative">
      {/* Cabecera flotante del Escenario de Lienzo */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-[#C7F303] truncate">
            Réplica Exacta en el Lienzo WAPPY
          </span>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-lg bg-slate-500/10 border border-slate-400/30 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {effectiveRenderType === 'agent_card'
              ? 'Tarjeta Principal con 3 Rombos ◆'
              : effectiveRenderType === 'satellite_circle'
                ? 'Satélite Circular (86×86px)'
                : node.familyId === 'triggers'
                  ? 'Disparador en D (96×96px)'
                  : 'Nodo Cuadrado Redondeado (96×96px)'}
          </span>
        </div>

        {/* Toggle interactivo para Nodos Duales (Hitos, Scrapers OSINT, Forense, Scraping) */}
        {node.supportsDualStageToggle && (
          <div className="flex flex-wrap items-center gap-1.5">
            <ExpandableButton
              type="button"
              size="sm"
              variant="teal"
              isActive={previewMode === 'stage2_square'}
              icon={<Database className="w-3.5 h-3.5" />}
              label="Ver en Etapa 2 (Lectura)"
              onClick={() => onChangePreviewMode('stage2_square')}
            />
            <ExpandableButton
              type="button"
              size="sm"
              variant="purple"
              isActive={previewMode === 'agent_satellite'}
              icon={<Wrench className="w-3.5 h-3.5" />}
              label="Ver en Herramienta + (Satélite del Agente)"
              onClick={() => onChangePreviewMode('agent_satellite')}
            />
            {node.supportsHitoWriteToggle && (
              <ExpandableButton
                type="button"
                size="sm"
                variant="emerald"
                isActive={previewMode === 'stage4_write'}
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                label="Ver en Etapa 4 (Escritura/Informe)"
                onClick={() => onChangePreviewMode('stage4_write')}
              />
            )}
          </div>
        )}
      </div>

      {/* Lienzo punteado real idéntico a WappyWorkflowCanvas.tsx */}
      <div
        className="relative w-full min-h-[235px] sm:min-h-[250px] flex items-center justify-center px-4 py-6 overflow-x-auto"
        style={{
          backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.42) 1.35px, transparent 1.35px)',
          backgroundSize: '18px 18px',
        }}
      >
        {/* ═══ FORMA A: TARJETA PRINCIPAL DE AGENTE IA (rounded-[26px] + Tenshi 3D + 3 Rombos ◆) ═══ */}
        {effectiveRenderType === 'agent_card' && (
          <div className="relative flex flex-col items-center py-4">
            {/* Cables laterales SVG hacia/desde el Agente IA */}
            <svg
              width="420"
              height="165"
              viewBox="0 0 420 165"
              className="pointer-events-none select-none overflow-visible max-w-full"
            >
              {/* Cable izquierdo de entrada */}
              <path
                d="M 12 62 C 42 62, 52 62, 78 62"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.4"
              />
              {/* Cable derecho de salida */}
              <path
                d="M 342 62 C 368 62, 378 62, 408 62"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.4"
              />
              {/* 3 cables punteados inferiores de los rombos ◆ */}
              <path
                d="M 130 105 L 116 154"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <path
                d="M 210 105 L 210 154"
                fill="none"
                stroke="#ec4899"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
              <path
                d="M 290 105 L 304 154"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
            </svg>

            {/* Tarjeta Agente IA superpuesta en coordenadas exactas */}
            <div className="absolute top-[20px] w-[264px] rounded-[26px] bg-white dark:bg-slate-800 border-2 border-purple-400 dark:border-purple-500 shadow-lg px-3.5 py-3 flex items-center gap-3">
              {/* Badge Paso #N */}
              <span className="pointer-events-none absolute -top-3 -left-2 px-1.5 py-0.5 rounded-lg bg-slate-900 dark:bg-[#C7F303] text-[#C7F303] dark:text-[#0E1300] border border-white/40 dark:border-slate-900 text-[8.5px] font-black shadow-xs whitespace-nowrap">
                {stepBadgeLabel}
              </span>

              {/* Puerto izquierdo cuadrado */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-md bg-slate-400 border-2 border-white dark:border-slate-900" />

              {/* Avatar 3D Tenshi / Suri */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-purple-950/90 border border-emerald-200/80 dark:border-purple-800/70 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                <img
                  src={
                    node.id === 'agent_extra'
                      ? '/assets/tenshi_suricato.png?v=20261108'
                      : '/assets/tenshi.png'
                  }
                  alt={node.shortLabel}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/tenshi.png';
                  }}
                  className="w-11 h-11 object-contain drop-shadow-sm select-none pointer-events-none scale-110"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {node.id === 'agent_extra' ? 'Agente IA #2' : 'Agente IA'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md text-[8px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 shrink-0">
                    {node.badge}
                  </span>
                </div>
                <div className="mt-1 px-2 py-0.5 rounded-lg bg-purple-50/80 dark:bg-slate-900 border border-purple-200/80 dark:border-slate-700 text-[10.5px] font-bold text-purple-700 dark:text-purple-300 truncate">
                  {node.id === 'agent_extra'
                    ? 'Suri · Auditor Legal / Médico'
                    : '🐱 Tenshi · Consultor SG-SST'}
                </div>
              </div>

              {/* Puerto derecho circular */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />

              {/* Los 3 Rombos Inferiores Oficiales */}
              <div
                style={{ left: 32 }}
                className="absolute -bottom-5 flex flex-col items-center pointer-events-none"
              >
                <div className="w-3 h-3 rotate-45 bg-indigo-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                <span className="mt-0.5 text-[8.5px] font-extrabold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Modelo IA <span className="text-rose-500">*</span>
                </span>
              </div>

              <div
                style={{ left: 108 }}
                className="absolute -bottom-5 flex flex-col items-center pointer-events-none"
              >
                <div className="w-3 h-3 rotate-45 bg-pink-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                <span className="mt-0.5 text-[8.5px] font-extrabold text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-0.5">
                  Memoria
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[8.5px] font-black text-pink-600">
                    +
                  </span>
                </span>
              </div>

              <div
                style={{ left: 178 }}
                className="absolute -bottom-5 flex flex-col items-center pointer-events-none"
              >
                <div className="w-3 h-3 rotate-45 bg-indigo-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                <span className="mt-0.5 text-[8.5px] font-extrabold text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-0.5">
                  Herramienta
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[8.5px] font-black text-purple-600">
                    +
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FORMA B: NODO SATÉLITE CIRCULAR (rounded-full w-[86px] h-[86px] + Cable Punteado hacia Rombo ◆) ═══ */}
        {effectiveRenderType === 'satellite_circle' && (
          <div className="flex flex-col items-center">
            {/* Zócalo superior del Agente IA con su puerto en Rombo ◆ */}
            <div className="px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-800/95 border border-slate-300 dark:border-slate-700 shadow-sm flex items-center gap-2 relative">
              <img
                src="/assets/tenshi.png"
                alt="Agente IA"
                className="w-5 h-5 object-contain"
              />
              <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200">
                Agente IA · Puerto{' '}
                <span className="text-purple-600 dark:text-[#C7F303]">◆ {diamondPortMeta.label}</span>
              </span>
              {diamondPortMeta.showPlus && (
                <span
                  className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[9px] font-black ${diamondPortMeta.plusColor}`}
                >
                  +
                </span>
              )}
              <div
                className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${diamondPortMeta.diamondClass} border-2 border-white dark:border-slate-900`}
              />
            </div>

            {/* Cable punteado vertical exacto */}
            <svg width="40" height="36" viewBox="0 0 40 36" className="overflow-visible">
              <path
                d="M 20 2 L 20 34"
                fill="none"
                stroke={diamondPortMeta.wireColor}
                strokeWidth="2.2"
                strokeDasharray="5 4"
              />
            </svg>

            {/* Nodo Circular Satélite Exacto (w-[86px] h-[86px] rounded-full) */}
            <div className="relative flex flex-col items-center">
              <div className="relative w-[86px] h-[86px]">
                {/* Insignia Paso #N */}
                <span className="pointer-events-none absolute -top-2.5 -left-3 px-1.5 py-0.5 rounded-lg bg-slate-900 dark:bg-[#C7F303] text-[#C7F303] dark:text-[#0E1300] border border-white/40 dark:border-slate-900 text-[8px] font-black shadow-xs z-20 whitespace-nowrap">
                  {stepBadgeLabel}
                </span>

                {/* Rombo superior ◆ del satélite */}
                <div
                  className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 ${diamondPortMeta.diamondClass} border-2 border-white dark:border-slate-900 shadow-xs z-20`}
                />

                {/* Círculo 86x86px */}
                <div
                  className={`w-full h-full rounded-full bg-white dark:bg-slate-800 border-2 ${satelliteBorderClass} shadow-md flex items-center justify-center relative transition-transform hover:scale-105`}
                >
                  {renderOfficialNodeSvg(iconLookupId, 'w-9 h-9')}

                  {isUnderConstruction && (
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow"
                      title="Nodo en Construcción"
                    >
                      <Lock className="w-3 h-3 stroke-[2.5]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Etiquetas inferiores idénticas al lienzo */}
              <div className="mt-2 text-center max-w-[180px]">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                  {node.shortLabel}
                </div>
                <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5 truncate">
                  {node.subtitle}
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                  {isUnderConstruction ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[8.5px] font-extrabold uppercase">
                      🚧 EN CONSTR.
                    </span>
                  ) : (
                    <>
                      {node.id === 'forensic_doc_verifier' && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-[8.5px] font-extrabold">
                          🔬 EXIF/PDF + DEC. 1427
                        </span>
                      )}
                      {node.requiresAntigravity && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-extrabold uppercase">
                          AGY AUTO
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FORMA C: NODO CUADRADO REDONDEADO (rounded-[22px] w-[96px] h-[96px] + Puertos ● + Cables) ═══ */}
        {effectiveRenderType === 'square_stage' && (
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              {/* Cable izquierdo de entrada (excepto en Disparadores que son origen ⚡) */}
              {node.familyId !== 'triggers' ? (
                <svg width="68" height="96" viewBox="0 0 68 96" className="overflow-visible shrink-0">
                  {node.id === 'logic_merge' ? (
                    <>
                      <path
                        d="M 4 22 C 30 22, 40 48, 66 48"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2.2"
                      />
                      <path
                        d="M 4 74 C 30 74, 40 48, 66 48"
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth="2.2"
                      />
                    </>
                  ) : (
                    <path
                      d="M 6 48 L 66 48"
                      fill="none"
                      stroke={previewMode === 'stage4_write' ? '#0d9488' : '#94a3b8'}
                      strokeWidth="2.2"
                    />
                  )}
                </svg>
              ) : (
                <div className="mr-3 text-orange-500 drop-shadow-sm flex items-center gap-1">
                  <Zap className="w-5 h-5 fill-orange-500" />
                </div>
              )}

              {/* Caja Exacta 96x96px */}
              <div className="relative w-[96px] h-[96px] shrink-0">
                {/* Badge superior oscuro Paso #N */}
                <span className="pointer-events-none absolute -top-3 -left-2 px-1.5 py-0.5 rounded-lg bg-slate-900 dark:bg-[#C7F303] text-[#C7F303] dark:text-[#0E1300] border border-white/40 dark:border-slate-900 text-[8.5px] font-black shadow-xs z-20 whitespace-nowrap">
                  {stepBadgeLabel}
                </span>

                {/* Puerto izquierdo ● */}
                {node.familyId !== 'triggers' && (
                  <div
                    className={`absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-20 ${
                      node.id === 'forensic_doc_verifier'
                        ? 'bg-rose-500'
                        : node.id === 'extract_ai_doc_ocr'
                          ? 'bg-purple-500'
                          : node.familyId === 'hitos'
                            ? 'bg-teal-500'
                            : node.familyId === 'logic_dag'
                              ? 'bg-amber-500'
                              : 'bg-sky-500'
                    }`}
                  />
                )}

                {/* Cuerpo del Nodo */}
                <div
                  className={`w-full h-full ${
                    node.familyId === 'triggers'
                      ? 'rounded-l-[32px] rounded-r-[18px]'
                      : 'rounded-[22px]'
                  } bg-white dark:bg-slate-800 border-2 ${squareBorderClass} shadow-md flex items-center justify-center relative transition-transform hover:scale-105`}
                >
                  {node.defaultShape === 'if_router' ? (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <GitFork className="w-7 h-7" />
                    </div>
                  ) : node.defaultShape === 'logic_merge' ? (
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                      <GitMerge className="w-7 h-7" />
                    </div>
                  ) : node.defaultShape === 'logic_loop' ? (
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                      <Repeat className="w-7 h-7" />
                    </div>
                  ) : node.defaultShape === 'logic_human_approval' ? (
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <UserCheck className="w-7 h-7" />
                    </div>
                  ) : node.defaultShape === 'logic_filter' || node.defaultShape === 'logic_switch' ? (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Sliders className="w-7 h-7" />
                    </div>
                  ) : (
                    renderOfficialNodeSvg(iconLookupId, 'w-10 h-10')
                  )}

                  {isUnderConstruction && (
                    <span
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow"
                      title="Nodo en Construcción"
                    >
                      <Lock className="w-3 h-3 stroke-[2.5]" />
                    </span>
                  )}
                </div>

                {/* Puertos derechos: 2 puertos (sí / no) en Condición Si/No, puerto + [+] en Salidas, o puerto estándar ● */}
                {node.defaultShape === 'if_router' ? (
                  <>
                    <div
                      style={{ top: 24 }}
                      className="absolute -right-2 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 z-20"
                      title="Rama SÍ"
                    />
                    <div
                      style={{ top: 60 }}
                      className="absolute -right-2 w-3.5 h-3.5 rounded-full bg-slate-500 border-2 border-white dark:border-slate-900 z-20"
                      title="Rama NO"
                    />
                  </>
                ) : node.familyId === 'outputs' ? (
                  <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex items-center z-20">
                    <div className="w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-white dark:border-slate-900" />
                    <div className="w-2.5 h-[1.5px] bg-slate-300 dark:bg-slate-600" />
                    <span className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-bold shadow-xs">
                      +
                    </span>
                  </div>
                ) : (
                  <div
                    className={`absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-20 ${
                      node.id === 'forensic_doc_verifier'
                        ? 'bg-rose-500'
                        : node.id === 'extract_ai_doc_ocr'
                          ? 'bg-purple-500'
                          : node.familyId === 'hitos'
                            ? 'bg-teal-500'
                            : node.familyId === 'logic_dag'
                              ? 'bg-amber-500'
                              : 'bg-sky-500'
                    }`}
                  />
                )}
              </div>

              {/* Cables derechos de salida */}
              {node.defaultShape === 'if_router' ? (
                <svg width="96" height="96" viewBox="0 0 96 96" className="overflow-visible shrink-0">
                  <path
                    d="M 2 31 C 35 31, 48 16, 90 16"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.3"
                  />
                  <text x="48" y="12" fill="#059669" fontSize="10.5" fontWeight="800">
                    sí
                  </text>
                  <path
                    d="M 2 67 C 35 67, 48 82, 90 82"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2.2"
                  />
                  <text x="48" y="94" fill="#64748b" fontSize="10.5" fontWeight="800">
                    no
                  </text>
                </svg>
              ) : node.familyId !== 'outputs' ? (
                <svg width="68" height="96" viewBox="0 0 68 96" className="overflow-visible shrink-0">
                  <path
                    d="M 2 48 L 62 48"
                    fill="none"
                    stroke={
                      node.id === 'extract_ai_doc_ocr'
                        ? '#a855f7'
                        : node.familyId === 'hitos'
                          ? '#14b8a6'
                          : '#0ea5e9'
                    }
                    strokeWidth="2.3"
                  />
                </svg>
              ) : (
                <div className="w-8 shrink-0" />
              )}
            </div>

            {/* Título, subtítulo coloreado y píldora oficial debajo del nodo cuadrado */}
            <div className="mt-2.5 text-center max-w-[220px]">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                {node.shortLabel}
              </div>
              <div
                className={`text-[10px] font-semibold mt-0.5 truncate ${
                  node.id === 'forensic_doc_verifier'
                    ? 'text-rose-600 dark:text-rose-400'
                    : node.id === 'extract_ai_doc_ocr'
                      ? 'text-purple-600 dark:text-[#C7F303]'
                      : node.familyId === 'hitos'
                        ? previewMode === 'stage4_write'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-teal-600 dark:text-teal-400'
                        : node.familyId === 'logic_dag'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-sky-600 dark:text-sky-400'
                }`}
              >
                {node.familyId === 'hitos'
                  ? previewMode === 'stage4_write'
                    ? '✍️ Guardar + Emitir Informe HTML'
                    : '📥 Lectura Quirúrgica Etapa 2'
                  : node.subtitle}
              </div>

              <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                {isUnderConstruction ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[8.5px] font-extrabold uppercase">
                    🚧 EN CONSTR.
                  </span>
                ) : (
                  <>
                    {node.id === 'extract_ai_doc_ocr' && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/40 text-purple-700 dark:text-purple-300 text-[8.5px] font-extrabold">
                        ✨ IA + OCR
                      </span>
                    )}
                    {node.id === 'forensic_doc_verifier' && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-[8.5px] font-extrabold">
                        🔬 EXIF/PDF + DEC. 1427
                      </span>
                    )}
                    {node.defaultShape === 'if_router' && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-extrabold">
                        ⚡ Pre-IA · 0 tok NO
                      </span>
                    )}
                    {node.requiresAntigravity && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-extrabold uppercase">
                        AGY AUTO
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   4. RENDERIZADOR VISUAL DE SMARTDOWN (MARKDOWN ENRIQUECIDO INTERACTIVO)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderInlineSmartDown(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-teal-800 dark:text-[#C7F303] font-mono text-[11px] font-semibold break-words"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-extrabold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="italic text-slate-600 dark:text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

const SmartDownVisualArticle: React.FC<{
  doc: GeneratedNodeSmartDown;
  node: DocumentedWorkflowNode;
  onCopyPrompt: () => void;
  promptCopied: boolean;
}> = ({ doc, node, onCopyPrompt, promptCopied }) => {
  const blocks = useMemo(() => {
    const rawLines = (doc.markdown || '').split('\n');
    const parsed: Array<
      | { type: 'h3'; text: string }
      | { type: 'h4'; text: string }
      | { type: 'p'; text: string }
      | { type: 'callout'; kind: 'important' | 'warning' | 'tip' | 'quote'; lines: string[] }
      | { type: 'ul'; items: string[] }
      | { type: 'ol'; items: string[] }
      | { type: 'code'; lang: string; content: string }
      | { type: 'table'; headers: string[]; rows: string[][] }
    > = [];

    let i = 0;
    while (i < rawLines.length) {
      const line = rawLines[i];
      const trimmed = line.trim();

      if (!trimmed || trimmed === '---' || trimmed.startsWith('# ') || trimmed.startsWith('**Familia:**')) {
        i++;
        continue;
      }

      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim() || 'text';
        const codeLines: string[] = [];
        i++;
        while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
          codeLines.push(rawLines[i]);
          i++;
        }
        i++;
        parsed.push({ type: 'code', lang, content: codeLines.join('\n') });
        continue;
      }

      if (trimmed.startsWith('### ')) {
        parsed.push({ type: 'h3', text: trimmed.slice(4).trim() });
        i++;
        continue;
      }

      if (trimmed.startsWith('#### ')) {
        parsed.push({ type: 'h4', text: trimmed.slice(5).trim() });
        i++;
        continue;
      }

      if (trimmed.startsWith('>')) {
        const qLines: string[] = [];
        let kind: 'important' | 'warning' | 'tip' | 'quote' = 'quote';
        while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
          const cleanQ = rawLines[i].trim().replace(/^>\s?/, '');
          if (cleanQ.includes('[!IMPORTANT]')) {
            kind = 'important';
          } else if (cleanQ.includes('[!WARNING]')) {
            kind = 'warning';
          } else if (cleanQ.includes('[!TIP]')) {
            kind = 'tip';
          } else if (cleanQ) {
            qLines.push(cleanQ);
          }
          i++;
        }
        if (qLines.length > 0) {
          parsed.push({ type: 'callout', kind, lines: qLines });
        }
        continue;
      }

      if (trimmed.startsWith('|') && i + 1 < rawLines.length && rawLines[i + 1].includes('---')) {
        const parseRow = (r: string) =>
          r
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim());
        const headers = parseRow(trimmed);
        i += 2; // saltar separador | :--- |
        const rows: string[][] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
          rows.push(parseRow(rawLines[i]));
          i++;
        }
        parsed.push({ type: 'table', headers, rows });
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        const items: string[] = [];
        while (
          i < rawLines.length &&
          (/^\d+\.\s+/.test(rawLines[i].trim()) || /^\s{2,}-\s+/.test(rawLines[i]))
        ) {
          items.push(rawLines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        parsed.push({ type: 'ol', items });
        continue;
      }

      if (trimmed.startsWith('- ')) {
        const items: string[] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith('- ')) {
          items.push(rawLines[i].trim().slice(2).trim());
          i++;
        }
        parsed.push({ type: 'ul', items });
        continue;
      }

      parsed.push({ type: 'p', text: trimmed });
      i++;
    }

    return parsed;
  }, [doc.markdown]);

  return (
    <div className="space-y-4 min-w-0">
      {blocks.map((b, idx) => {
        if (b.type === 'h3') {
          return (
            <div
              key={idx}
              className="pt-3 first:pt-0 border-t first:border-t-0 border-slate-200/80 dark:border-slate-800"
            >
              <h3 className="text-sm sm:text-base font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-[#C7F303] dark:to-teal-300 bg-clip-text text-transparent tracking-tight">
                {b.text}
              </h3>
            </div>
          );
        }

        if (b.type === 'h4') {
          return (
            <h4
              key={idx}
              className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 pt-1"
            >
              {b.text}
            </h4>
          );
        }

        if (b.type === 'p') {
          return (
            <p
              key={idx}
              className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed break-words"
            >
              {renderInlineSmartDown(b.text)}
            </p>
          );
        }

        if (b.type === 'callout') {
          const isVoicePromptBox =
            b.kind === 'quote' &&
            b.lines.some((l) => l.includes('Tenshi,')) &&
            idx >= blocks.length - 2;

          if (isVoicePromptBox) {
            return (
              <div
                key={idx}
                className="rounded-2xl border border-fuchsia-500/35 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-teal-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center shrink-0 text-fuchsia-600 dark:text-fuchsia-300">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-black uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">
                      Orden Lista para Voz o Chat en Tenshi IA
                    </div>
                    <p className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-100 mt-0.5 leading-relaxed break-words">
                      {b.lines.join(' ')}
                    </p>
                  </div>
                </div>
                <ExpandableButton
                  type="button"
                  size="sm"
                  variant="fuchsia"
                  isActive={promptCopied}
                  icon={
                    promptCopied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                  label={promptCopied ? '¡Prompt Copiado!' : 'Copiar Prompt Tenshi'}
                  onClick={onCopyPrompt}
                />
              </div>
            );
          }

          const styles =
            b.kind === 'warning'
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200'
              : b.kind === 'important'
                ? 'border-rose-500/35 bg-rose-500/10 text-rose-900 dark:text-rose-200'
                : b.kind === 'tip'
                  ? 'border-teal-500/35 bg-teal-500/10 text-teal-900 dark:text-teal-200'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200';

          return (
            <div key={idx} className={`rounded-2xl border p-3.5 space-y-1.5 ${styles}`}>
              {b.lines.map((ql, qIdx) => (
                <p key={qIdx} className="text-xs leading-relaxed break-words">
                  {renderInlineSmartDown(ql)}
                </p>
              ))}
            </div>
          );
        }

        if (b.type === 'code') {
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 p-3.5 overflow-x-auto"
            >
              <div className="text-[9.5px] font-black uppercase tracking-wider text-[#C7F303] mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-3 h-3" />
                {b.lang === 'flow' ? 'Grafo Causal DAG en el Lienzo' : b.lang}
              </div>
              <pre className="font-mono text-[11.5px] leading-relaxed whitespace-pre">
                {b.content}
              </pre>
            </div>
          );
        }

        if (b.type === 'table') {
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
                    {b.headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-3.5 py-2.5 text-[11px] font-extrabold text-slate-700 dark:text-slate-200"
                      >
                        {renderInlineSmartDown(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {b.rows.map((r, rIdx) => (
                    <tr
                      key={rIdx}
                      className="bg-white/60 dark:bg-slate-900/50 hover:bg-teal-500/5 transition-colors"
                    >
                      {r.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 align-top leading-relaxed"
                        >
                          {renderInlineSmartDown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (b.type === 'ol') {
          return (
            <ol key={idx} className="space-y-2">
              {b.items.map((it, iIdx) => {
                const isSubBullet = it.startsWith('- ');
                return (
                  <li
                    key={iIdx}
                    className={`flex items-start gap-2.5 text-xs sm:text-[12.5px] text-slate-700 dark:text-slate-300 leading-relaxed ${
                      isSubBullet ? 'ml-7' : ''
                    }`}
                  >
                    {isSubBullet ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                    ) : (
                      <span className="w-5 h-5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-[10.5px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        •
                      </span>
                    )}
                    <span className="min-w-0 flex-1 break-words">
                      {renderInlineSmartDown(isSubBullet ? it.slice(2) : it)}
                    </span>
                  </li>
                );
              })}
            </ol>
          );
        }

        if (b.type === 'ul') {
          // Si es el bloque de Casillas Quirúrgicas (`code` puro), renderizarlo como grilla limpia de chips
          const allAreCodePills =
            b.items.length >= 3 &&
            b.items.every((item) => item.startsWith('`') && item.endsWith('`'));
          if (allAreCodePills) {
            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {b.items.map((it, iIdx) => (
                  <div
                    key={iIdx}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-[#C7F303] shrink-0 mt-0.5" />
                    <span className="font-medium leading-snug break-words">
                      {it.slice(1, -1)}
                    </span>
                  </div>
                ))}
              </div>
            );
          }

          return (
            <ul key={idx} className="space-y-1.5">
              {b.items.map((it, iIdx) => (
                <li
                  key={iIdx}
                  className="flex items-start gap-2 text-xs sm:text-[12.5px] text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-[#C7F303] mt-2 shrink-0" />
                  <span className="min-w-0 flex-1 break-words">{renderInlineSmartDown(it)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return null;
      })}

      {/* Si el nodo tiene un script de referencia Antigravity en catálogo, mostrarlo al final */}
      {node.scriptCode && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-3.5 overflow-x-auto">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" />
            Ruta Técnica de Inspección en Google Antigravity
          </div>
          <pre className="font-mono text-[11px] text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
            {node.scriptCode}
          </pre>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. MODAL PRINCIPAL: ENCICLOPEDIA SMARTDOWN DE NODOS WAPPY
   ═══════════════════════════════════════════════════════════════════════════ */

export interface WappyNodesDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  disabledApps?: string[];
  initialNodeId?: string | null;
}

export const WappyNodesDocumentationModal: React.FC<WappyNodesDocumentationModalProps> = ({
  isOpen,
  onClose,
  disabledApps = [],
  initialNodeId = null,
}) => {
  const { showToast } = useToastContext();
  const allCatalogNodes = useMemo(() => getDocumentedCatalogNodes(), []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<NodeDocFamilyId>('all');
  const [selectedHitoSubFilter, setSelectedHitoSubFilter] = useState<string>('all');
  const [selectedToolSubFilter, setSelectedToolSubFilter] = useState<string>('all_tools');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'construction'>('all');
  const [selectedDocKey, setSelectedDocKey] = useState<string>(
    () => allCatalogNodes[0]?.docKey || 'trigger_schedule_cron',
  );
  const [viewMode, setViewMode] = useState<'visual' | 'markdown'>('visual');
  const [previewStageMode, setPreviewStageMode] = useState<NodeCanvasPreviewMode>('stage2_square');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [mobileShowDetail, setMobileShowDetail] = useState<boolean>(false);
  const [copiedNodeMd, setCopiedNodeMd] = useState<boolean>(false);
  const [copiedTenshiPrompt, setCopiedTenshiPrompt] = useState<boolean>(false);
  const [downloadingAllMd, setDownloadingAllMd] = useState<boolean>(false);

  // Seleccionar nodo inicial si se abre apuntando a un ID específico
  useEffect(() => {
    if (!isOpen) return;
    if (initialNodeId) {
      const found = allCatalogNodes.find(
        (n) => n.id === initialNodeId || n.docKey === initialNodeId,
      );
      if (found) {
        setSelectedDocKey(found.docKey);
        setMobileShowDetail(true);
      }
    }
  }, [isOpen, initialNodeId, allCatalogNodes]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const isNodeConstruction = useCallback(
    (node: DocumentedWorkflowNode): boolean =>
      node.defaultConstruction || isWorkflowNodeUnderConstruction(node.rawDef, disabledApps),
    [disabledApps],
  );

  // Contadores globales Activos vs En Construcción
  const globalCounts = useMemo(() => {
    let active = 0;
    let construction = 0;
    allCatalogNodes.forEach((n) => {
      if (isNodeConstruction(n)) construction++;
      else active++;
    });
    return { total: allCatalogNodes.length, active, construction };
  }, [allCatalogNodes, isNodeConstruction]);

  // Contadores por cada una de las 8 Familias
  const familyCounts = useMemo(() => {
    const map: Record<string, number> = { all: allCatalogNodes.length };
    NODE_DOC_FAMILIES.forEach((f) => {
      if (f.id !== 'all') {
        map[f.id] = allCatalogNodes.filter((n) => n.familyId === f.id).length;
      }
    });
    return map;
  }, [allCatalogNodes]);

  // Filtrado instantáneo en tiempo real (nombre, ID, Hito, norma, casilla o portal)
  const filteredNodes = useMemo(() => {
    const normQ = (searchQuery?.trim() || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return allCatalogNodes.filter((node) => {
      if (selectedFamily !== 'all' && node.familyId !== selectedFamily) {
        return false;
      }
      if (selectedFamily === 'hitos' && selectedHitoSubFilter !== 'all') {
        if (node.hitoId !== selectedHitoSubFilter) return false;
      }
      if (selectedFamily === 'connectors' && selectedToolSubFilter !== 'all_tools') {
        if (node.subGroup !== selectedToolSubFilter) return false;
      }
      const underConst = isNodeConstruction(node);
      if (statusFilter === 'active' && underConst) return false;
      if (statusFilter === 'construction' && !underConst) return false;

      if (!normQ) return true;

      const meta = getNodeModuleMetadata(node.id);
      const searchableBlob = [
        node.label,
        node.shortLabel,
        node.id,
        node.sgsstAppId || '',
        node.hitoId || '',
        node.familyLabel,
        node.badge,
        node.subtitle,
        node.description,
        node.toolHint,
        node.targetUrl || '',
        meta.moduleTitle,
        meta.moduleBadge,
        ...(Array.isArray(meta.fields) ? meta.fields : []),
        ...(Array.isArray(meta.quickCombos) ? meta.quickCombos.map((c) => c.label) : []),
      ]
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      return searchableBlob.includes(normQ);
    });
  }, [
    allCatalogNodes,
    selectedFamily,
    selectedHitoSubFilter,
    selectedToolSubFilter,
    statusFilter,
    searchQuery,
    isNodeConstruction,
  ]);

  // Mantener siempre un nodo válido seleccionado cuando cambian los filtros
  useEffect(() => {
    if (filteredNodes.length > 0 && !filteredNodes.some((n) => n.docKey === selectedDocKey)) {
      setSelectedDocKey(filteredNodes[0].docKey);
    }
  }, [filteredNodes, selectedDocKey]);

  const selectedNode = useMemo(
    () =>
      allCatalogNodes.find((n) => n.docKey === selectedDocKey) ||
      filteredNodes[0] ||
      allCatalogNodes[0],
    [allCatalogNodes, filteredNodes, selectedDocKey],
  );

  // Al cambiar de nodo, ajustar modo inicial del escenario visual
  useEffect(() => {
    if (!selectedNode) return;
    if (
      selectedNode.id.startsWith('scraper_agy_') ||
      selectedNode.id === 'forensic_doc_verifier'
    ) {
      setPreviewStageMode('agent_satellite');
    } else {
      setPreviewStageMode('stage2_square');
    }
    setCopiedNodeMd(false);
    setCopiedTenshiPrompt(false);
  }, [selectedNode?.docKey]);

  const currentNodeDoc = useMemo(
    () => (selectedNode ? buildNodeSmartDownDoc(selectedNode, disabledApps) : null),
    [selectedNode, disabledApps],
  );

  const handleCopyCurrentSmartDown = useCallback(async () => {
    if (!currentNodeDoc) return;
    try {
      await navigator.clipboard.writeText(currentNodeDoc.markdown);
      setCopiedNodeMd(true);
      showToast({
        message: `SmartDown de «${selectedNode?.shortLabel || 'Nodo'}» copiado al portapapeles.`,
        status: 'success',
      });
      setTimeout(() => setCopiedNodeMd(false), 2400);
    } catch {
      showToast({ message: 'No se pudo copiar al portapapeles.', status: 'error' });
    }
  }, [currentNodeDoc, selectedNode, showToast]);

  const handleCopyTenshiPrompt = useCallback(async () => {
    if (!currentNodeDoc) return;
    try {
      await navigator.clipboard.writeText(currentNodeDoc.tenshiVoicePrompt);
      setCopiedTenshiPrompt(true);
      showToast({
        message: 'Prompt listo para pegar o dictar en Tenshi IA.',
        status: 'success',
      });
      setTimeout(() => setCopiedTenshiPrompt(false), 2400);
    } catch {
      showToast({ message: 'No se pudo copiar el prompt.', status: 'error' });
    }
  }, [currentNodeDoc, showToast]);

  const handleDownloadFullEncyclopedia = useCallback(async () => {
    if (downloadingAllMd) return;
    setDownloadingAllMd(true);
    try {
      let mdContent = '';
      try {
        const res = await fetch('/api/sgsst/automatizaciones/nodes-docs?format=markdown&raw=1', {
          credentials: 'include',
        });
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().startsWith('#') && text.length > 500) {
            mdContent = text;
          }
        }
      } catch {
        // Fallback instantáneo en cliente
      }

      if (!mdContent) {
        mdContent = buildCompleteEncyclopediaMarkdown(disabledApps);
      }

      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Enciclopedia-SmartDown-Nodos-WAPPY-IA.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      showToast({
        message: `Enciclopedia SmartDown completa (${allCatalogNodes.length} nodos) descargada en .md.`,
        status: 'success',
      });
    } catch {
      showToast({
        message: 'Error al generar la descarga de la enciclopedia.',
        status: 'error',
      });
    } finally {
      setDownloadingAllMd(false);
    }
  }, [downloadingAllMd, disabledApps, allCatalogNodes.length, showToast]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10030] flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-2 sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative flex flex-col bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-200 min-w-0 ${
          isFullscreen
            ? 'w-full h-full rounded-2xl'
            : 'w-full max-w-[1440px] h-[92vh] rounded-3xl'
        }`}
      >
        {/* Luces ambientales decorativas WAPPY (0 interferencia táctil) */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />

        {/* ═══ 1. CABECERA SUPERIOR UNIFICADA ═══ */}
        <div className="relative z-10 px-4 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex flex-col gap-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0 text-teal-600 dark:text-[#C7F303]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-extrabold bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent tracking-tight truncate">
                  Enciclopedia SmartDown de Nodos WAPPY
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-500/10 border border-slate-400/30 text-[10.5px] font-extrabold text-slate-700 dark:text-slate-200">
                    <Layers className="w-3 h-3 text-teal-500" />
                    {globalCounts.total} Nodos Documentados
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter((prev) => (prev === 'active' ? 'all' : 'active'))
                    }
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10.5px] font-extrabold cursor-pointer transition-colors ${
                      statusFilter === 'active'
                        ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-800 dark:text-emerald-200'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                    title="Filtrar solo nodos activos"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {globalCounts.active} Activos
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter((prev) =>
                        prev === 'construction' ? 'all' : 'construction',
                      )
                    }
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10.5px] font-extrabold cursor-pointer transition-colors ${
                      statusFilter === 'construction'
                        ? 'bg-amber-500/25 border-amber-500/60 text-amber-800 dark:text-amber-200'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                    }`}
                    title="Filtrar nodos en Construcción"
                  >
                    🚧 {globalCounts.construction} En Construcción
                  </button>
                </div>
              </div>
            </div>

            {/* Acciones Superiores (WAPPY 14-Group ExpandableButton) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <ExpandableButton
                type="button"
                size="sm"
                variant="orange"
                isActive={viewMode === 'visual'}
                icon={<Eye className="w-3.5 h-3.5" />}
                label="Vista SmartDown Visual"
                onClick={() => setViewMode('visual')}
              />
              <ExpandableButton
                type="button"
                size="sm"
                variant="indigo"
                isActive={viewMode === 'markdown'}
                icon={<Code2 className="w-3.5 h-3.5" />}
                label="Código SmartDown (.md)"
                onClick={() => setViewMode('markdown')}
              />
              <ExpandableButton
                type="button"
                size="sm"
                variant="fuchsia"
                isActive={copiedNodeMd}
                icon={
                  copiedNodeMd ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
                label={copiedNodeMd ? '¡SmartDown Copiado!' : 'Copiar SmartDown del Nodo'}
                onClick={handleCopyCurrentSmartDown}
              />
              <ExpandableButton
                type="button"
                size="sm"
                variant="green"
                disabled={downloadingAllMd}
                icon={
                  downloadingAllMd ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )
                }
                label={
                  downloadingAllMd
                    ? 'Generando .md...'
                    : 'Descargar Enciclopedia Completa (.md)'
                }
                onClick={handleDownloadFullEncyclopedia}
              />
              <ExpandableButton
                type="button"
                size="sm"
                variant="neutral"
                isActive={isFullscreen}
                icon={
                  isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )
                }
                label={isFullscreen ? 'Restaurar Ventana' : 'Pantalla Completa'}
                onClick={() => setIsFullscreen((v) => !v)}
              />
              <ExpandableButton
                type="button"
                size="sm"
                variant="danger"
                icon={<X className="w-4 h-4" />}
                label="Cerrar"
                onClick={onClose}
              />
            </div>
          </div>

          {/* Buscador Instantáneo + Filtros de las 8 Familias */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 min-w-0">
            <div className="relative w-full lg:w-[330px] xl:w-[350px] shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (mobileShowDetail) setMobileShowDetail(false);
                }}
                placeholder="Buscar por nombre, ID, Hito, norma, casilla o portal..."
                className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Botonera de las 8 Familias con Contador Exacto */}
            <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
              {NODE_DOC_FAMILIES.map((fam) => {
                const famIcon =
                  fam.id === 'all' ? (
                    <Layers className="w-3.5 h-3.5" />
                  ) : fam.id === 'triggers' ? (
                    <Zap className="w-3.5 h-3.5" />
                  ) : fam.id === 'extractors' ? (
                    <Database className="w-3.5 h-3.5" />
                  ) : fam.id === 'ai_memories' ? (
                    <Brain className="w-3.5 h-3.5" />
                  ) : fam.id === 'connectors' ? (
                    <Wrench className="w-3.5 h-3.5" />
                  ) : fam.id === 'skills_subagents' ? (
                    <Bot className="w-3.5 h-3.5" />
                  ) : fam.id === 'hitos' ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : fam.id === 'logic_dag' ? (
                    <GitFork className="w-3.5 h-3.5" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  );

                return (
                  <ExpandableButton
                    key={fam.id}
                    type="button"
                    size="sm"
                    variant={fam.variant}
                    isActive={selectedFamily === fam.id}
                    icon={famIcon}
                    badge={familyCounts[fam.id] ?? 0}
                    label={fam.shortLabel}
                    title={`${fam.label} (${familyCounts[fam.id] ?? 0} nodos)`}
                    onClick={() => {
                      setSelectedFamily(fam.id);
                      setMobileShowDetail(false);
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Sub-Filtro de los 8 Hitos cuando se elige «Aplicativos Somos SST» */}
          {selectedFamily === 'hitos' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mr-1">
                Filtrar por Hito:
              </span>
              {HITOS_8_FILTER_TABS.map((hTab, idx) => {
                const countInHito =
                  hTab.id === 'all'
                    ? HITO_APP_NODES.length
                    : HITO_APP_NODES.filter((h) => h.hitoId === hTab.id).length;
                const hitoVariants: ExpandableButtonVariant[] = [
                  'teal',
                  'emerald',
                  'cyan',
                  'amber',
                  'purple',
                  'indigo',
                  'fuchsia',
                  'blue',
                  'orange',
                ];
                return (
                  <ExpandableButton
                    key={hTab.id}
                    type="button"
                    size="sm"
                    variant={hitoVariants[idx % hitoVariants.length]}
                    isActive={selectedHitoSubFilter === hTab.id}
                    icon={<ShieldCheck className="w-3.5 h-3.5" />}
                    badge={countInHito}
                    label={hTab.label.replace(/\s*\(\d+\)\s*$/, '')}
                    onClick={() => {
                      setSelectedHitoSubFilter(hTab.id);
                      setMobileShowDetail(false);
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Sub-Filtro de Subgrupos cuando se elige «Herramientas y Conectores» */}
          {selectedFamily === 'connectors' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-300 mr-1">
                Subgrupo de Herramientas:
              </span>
              {TOOL_SUBGROUP_TABS.map((tTab, idx) => {
                const countInSub =
                  tTab.id === 'all_tools'
                    ? INPUT_CONNECTOR_NODES.length
                    : INPUT_CONNECTOR_NODES.filter((c) => c.category === tTab.id).length;
                const subVariants: ExpandableButtonVariant[] = [
                  'cyan',
                  'teal',
                  'blue',
                  'amber',
                  'purple',
                ];
                return (
                  <ExpandableButton
                    key={tTab.id}
                    type="button"
                    size="sm"
                    variant={subVariants[idx % subVariants.length]}
                    isActive={selectedToolSubFilter === tTab.id}
                    icon={<Wrench className="w-3.5 h-3.5" />}
                    badge={countInSub}
                    label={tTab.label}
                    onClick={() => {
                      setSelectedToolSubFilter(tTab.id);
                      setMobileShowDetail(false);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ 2. CUERPO PRINCIPAL DE 2 COLUMNAS (0PX HORIZONTAL OVERFLOW) ═══ */}
        <div className="relative z-10 flex-1 flex flex-col lg:flex-row min-h-0 min-w-0 overflow-hidden">
          {/* COLUMNA IZQUIERDA: LISTA NAVEGABLE DE NODOS */}
          <div
            className={`${
              mobileShowDetail ? 'hidden lg:flex' : 'flex'
            } flex-col flex-1 lg:flex-none w-full lg:w-[340px] xl:w-[375px] lg:shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 min-h-0`}
          >
            <div className="px-4 py-2.5 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] font-extrabold text-slate-600 dark:text-slate-300 shrink-0">
              <span>
                Mostrando <strong className="text-teal-600 dark:text-[#C7F303]">{filteredNodes.length}</strong>{' '}
                de {allCatalogNodes.length} nodos
              </span>
              {(searchQuery || statusFilter !== 'all' || selectedFamily !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFamily('all');
                    setSelectedHitoSubFilter('all');
                    setSelectedToolSubFilter('all_tools');
                    setStatusFilter('all');
                  }}
                  className="text-[10.5px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5">
              {filteredNodes.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <AlertTriangle className="w-7 h-7 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    No se encontraron nodos con ese criterio.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Prueba buscando por término normativo (ej. «1427», «0312», «ARL», «SIMIT», «EMO», «OCR»).
                  </p>
                </div>
              ) : (
                filteredNodes.map((item) => {
                  const isSelected = selectedNode?.docKey === item.docKey;
                  const underConst = isNodeConstruction(item);
                  const miniIconId =
                    item.id === 'agent_extra'
                      ? 'subagent_researcher'
                      : item.defaultShape === 'custom_satellite' && item.subGroup === 'skill'
                        ? 'skill'
                        : item.defaultShape === 'custom_satellite' && item.subGroup === 'rule'
                          ? 'rule'
                          : item.id;

                  return (
                    <button
                      key={item.docKey}
                      type="button"
                      onClick={() => {
                        setSelectedDocKey(item.docKey);
                        setMobileShowDetail(true);
                      }}
                      className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer min-w-0 ${
                        isSelected
                          ? 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-500/70 ring-1 ring-teal-500/30 shadow-xs'
                          : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-teal-400/60 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      {/* Mini-réplica del icono con forma y borde del lienzo */}
                      <div
                        className={`w-10 h-10 shrink-0 flex items-center justify-center bg-white dark:bg-slate-800 border-2 shadow-2xs relative ${
                          item.defaultShape === 'circle_model' ||
                          item.defaultShape === 'circle_memory' ||
                          item.defaultShape === 'circle_tool' ||
                          item.defaultShape === 'custom_satellite'
                            ? 'rounded-full'
                            : item.defaultShape === 'trigger'
                              ? 'rounded-l-2xl rounded-r-lg'
                              : 'rounded-xl'
                        } ${
                          underConst
                            ? 'border-dashed border-amber-400'
                            : item.id === 'forensic_doc_verifier'
                              ? 'border-rose-400'
                              : item.familyId === 'hitos'
                                ? 'border-teal-400'
                                : item.familyId === 'ai_memories'
                                  ? 'border-indigo-400'
                                  : item.familyId === 'logic_dag'
                                    ? 'border-emerald-400'
                                    : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.defaultShape === 'if_router' ? (
                          <GitFork className="w-5 h-5 text-emerald-600" />
                        ) : item.defaultShape === 'logic_merge' ? (
                          <GitMerge className="w-5 h-5 text-cyan-600" />
                        ) : item.defaultShape === 'logic_loop' ? (
                          <Repeat className="w-5 h-5 text-violet-600" />
                        ) : item.defaultShape === 'logic_human_approval' ? (
                          <UserCheck className="w-5 h-5 text-amber-600" />
                        ) : item.defaultShape === 'logic_filter' ||
                          item.defaultShape === 'logic_switch' ? (
                          <Sliders className="w-5 h-5 text-emerald-600" />
                        ) : (
                          renderOfficialNodeSvg(miniIconId, 'w-5 h-5')
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {item.shortLabel}
                          </span>
                          {underConst ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-300 text-[8.5px] font-black uppercase shrink-0">
                              🚧 Constr.
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-black shrink-0">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.label}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9.5px] font-bold text-teal-700 dark:text-teal-300 truncate">
                            {item.badge}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 truncate">
                            · {item.id}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* PANEL PRINCIPAL DERECHO: ESCENARIO DEL NODO + DOCUMENTACIÓN SMARTDOWN COMPLETA */}
          <div
            className={`${
              mobileShowDetail ? 'block' : 'hidden lg:block'
            } flex-1 min-w-0 min-h-0 overflow-y-auto bg-white dark:bg-slate-950 p-4 sm:p-6`}
          >
            {/* Botón volver en móvil (< lg) */}
            <div className="flex lg:hidden items-center justify-between pb-2 mb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <ExpandableButton
                type="button"
                size="sm"
                variant="neutral"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                label="Volver a la Lista de Nodos"
                onClick={() => setMobileShowDetail(false)}
              />
              <span className="text-[11px] font-bold text-slate-500">
                {filteredNodes.findIndex((n) => n.docKey === selectedNode?.docKey) + 1} /{' '}
                {filteredNodes.length}
              </span>
            </div>

            {selectedNode && currentNodeDoc && (
              <div className="space-y-5 min-w-0">
                {/* Encabezado de Ficha del Nodo Seleccionado */}
                <div className="shrink-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800 min-w-0">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-[10.5px] font-extrabold">
                        {selectedNode.familyLabel}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10.5px] font-extrabold">
                        {selectedNode.badge}
                      </span>
                      <code className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10.5px] font-mono font-bold text-slate-600 dark:text-slate-300">
                        {selectedNode.id}
                      </code>
                      {currentNodeDoc.isUnderConstruction ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10.5px] font-extrabold">
                          <Hammer className="w-3 h-3" />
                          🚧 En Construcción
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-extrabold">
                          <Sparkles className="w-3 h-3" />
                          Activo en Lienzo
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug break-words">
                      {selectedNode.label}
                    </h3>
                  </div>
                </div>

                {/* ESCENARIO DE VISTA PREVIA REAL DEL LIENZO WAPPY */}
                <NodeCanvasStageReplica
                  node={selectedNode}
                  isUnderConstruction={currentNodeDoc.isUnderConstruction}
                  previewMode={previewStageMode}
                  onChangePreviewMode={setPreviewStageMode}
                />

                {/* CONTENIDO SMARTDOWN: VISTA VISUAL RICA vs CÓDIGO .MD PURO */}
                {viewMode === 'visual' ? (
                  <div className="shrink-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-surface-primary/60 dark:bg-slate-900/40 p-4 sm:p-6">
                    <SmartDownVisualArticle
                      doc={currentNodeDoc}
                      node={selectedNode}
                      onCopyPrompt={handleCopyTenshiPrompt}
                      promptCopied={copiedTenshiPrompt}
                    />
                  </div>
                ) : (
                  <div className="shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#C7F303] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {selectedNode.id}.smartdown.md
                      </span>
                      <ExpandableButton
                        type="button"
                        size="sm"
                        variant="fuchsia"
                        isActive={copiedNodeMd}
                        icon={
                          copiedNodeMd ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                        label={copiedNodeMd ? '¡Copiado!' : 'Copiar Código .md'}
                        onClick={handleCopyCurrentSmartDown}
                      />
                    </div>
                    <pre className="p-4 sm:p-5 font-mono text-xs leading-relaxed text-slate-200 overflow-x-auto whitespace-pre-wrap break-words">
                      {currentNodeDoc.markdown}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default WappyNodesDocumentationModal;
