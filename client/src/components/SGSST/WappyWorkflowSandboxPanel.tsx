import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Copy,
  Check,
  RotateCcw,
  X,
  ShieldCheck,
  Sparkles,
  Clock,
  Cpu,
  Building2,
  GitFork,
  Mail,
  Bell,
  Layers,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Code2,
  Lock,
  Loader2,
  Zap,
  Database,
  ArrowRight,
  ClipboardCheck,
  Download,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  ZoomIn,
  Search,
  LayoutGrid,
  List,
  Paperclip,
} from 'lucide-react';
import ExpandableButton from '~/components/Common/ExpandableButton';
import { getRotatedAgentAvatar } from './workflowNodesCatalog';

export interface ScraperCapturedEvidence {
  workerName?: string;
  cedula?: string;
  cargo?: string;
  portal?: string;
  title?: string;
  pdfUrl?: string | null;
  pdfDownloadUrl?: string | null;
  pdfAbsoluteUrl?: string | null;
  pdfFileName?: string | null;
  imageUrl?: string | null;
  imageDownloadUrl?: string | null;
  imageAbsoluteUrl?: string | null;
  imageFileName?: string | null;
}

export interface SandboxNodeTraceStep {
  nodeKey?: string;
  nodeId: string;
  title: string;
  category?: string;
  stage?: string;
  status: 'ok' | 'simulated_blocked' | 'skipped' | 'warning' | 'error' | string;
  durationMs: number;
  recordsCount?: number;
  surgicalFields?: string[];
  inputContext?: string;
  inputSummary?: string;
  outputPreview?: string;
  details?: string;
  sourceNodeKey?: string;
  sourceNodeTitle?: string;
  inputItems?: Array<Record<string, any>>;
  outputItems?: Array<Record<string, any>>;
  evidenceFiles?: ScraperCapturedEvidence[];
  evidences?: ScraperCapturedEvidence[];
  logs?: Array<{
    timestamp?: string;
    level: 'info' | 'success' | 'warn' | 'error';
    message: string;
    detail?: string;
  }>;
  error?: string | null;
}

export interface SandboxAgentOutput {
  agentKey?: string;
  agentId?: string;
  agentName: string;
  roleLabel?: string;
  avatarName?: string;
  avatarSrc?: string;
  aiEngine?: string;
  modelUsed?: string;
  durationMs?: number;
  promptUsed?: string;
  responseMarkdown: string;
  responseHtml?: string;
}

export interface SandboxEmailPreview {
  blocked?: boolean;
  from?: string;
  recipients: string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  reason?: string;
}

export interface SandboxNotificationPreview {
  blocked?: boolean;
  channel?: string;
  title: string;
  message: string;
  tenshiVoiceSummary?: string;
}

export interface SandboxHitoImpactPreview {
  nodeId: string;
  title: string;
  operationMode?: string;
  blocked?: boolean;
  summary: string;
}

export interface SandboxSimulationResponse {
  success?: boolean;
  sandboxMode?: boolean;
  outputsBlocked?: boolean;
  executedAt?: string;
  totalDurationMs: number;
  aiEngine?: string;
  modelUsed: string;
  company?: {
    id?: string;
    name?: string;
    nit?: string;
    sector?: string;
    workersCount?: number;
  };
  ifEvaluation?: {
    included?: boolean;
    conditionMet?: boolean;
    branchTaken: 'SÍ' | 'NO' | string;
    reason?: string;
  };
  finalResponseMarkdown: string;
  finalResponseHtml: string;
  agentOutputs: SandboxAgentOutput[];
  nodeTrace: SandboxNodeTraceStep[];
  interceptedOutputs?: {
    emailsSentCount?: number;
    notificationsSentCount?: number;
    hitosModifiedCount?: number;
    emailPreview?: SandboxEmailPreview;
    notificationPreview?: SandboxNotificationPreview;
    hitoImpacts?: SandboxHitoImpactPreview[];
    acpmPreview?: {
      blocked?: boolean;
      tasksWouldCreate?: number;
      summary?: string;
    };
  };
  emailPreview?: SandboxEmailPreview;
  notificationPreview?: SandboxNotificationPreview;
  hitoImpacts?: SandboxHitoImpactPreview[];
  evidenceFiles?: ScraperCapturedEvidence[];
  evidences?: ScraperCapturedEvidence[];
}

export interface WappyWorkflowSandboxPanelProps {
  open: boolean;
  running: boolean;
  result: SandboxSimulationResponse | null;
  error: string | null;
  mockTriggerInput: string;
  onChangeMockTriggerInput: (val: string) => void;
  onRunSimulation: () => void;
  onClearSimulation: () => void;
  onClose: () => void;
  activeStepNodeId: string | null;
  onSelectStepNode: (nodeIdOrKey: string | null) => void;
  emailsStr?: string;
  liveSteps?: SandboxNodeTraceStep[];
  totalPlannedSteps?: number;
  activeStepTitle?: string | null;
  onOpenEvidence?: (evidence: ScraperCapturedEvidence, preferredMode?: 'image' | 'pdf') => void;
}

export const QUICK_MOCK_SCENARIOS: Array<{
  id: string;
  label: string;
  shortBadge: string;
  mockInput: string;
}> = [
  {
    id: 'live_company',
    label: '🟢 Probar solo con los Datos Reales Actuales de mi Empresa (En Vivo)',
    shortBadge: 'En Vivo (BD Real)',
    mockInput: '',
  },
  {
    id: 'emo_alturas',
    label: '⚠️ Simular Trabajador con Examen Médico (EMO) y Curso de Alturas Próximo a Vencer',
    shortBadge: 'EMO + Alturas',
    mockInput:
      '[SIMULACIÓN DISPARADOR SG-SST] Trabajador: Carlos Andrés Mejía Soto (CC 1.037.614.892) · Cargo: Técnico Liniero / Trabajo en Alturas · Alerta detectada: Examen Médico Ocupacional Periódico (EMO) vence en 4 días y Certificado de Reentrenamiento en Trabajo Seguro en Alturas (Res. 4272 de 2021) vencido hace 2 días. Validar restricciones y generar plan de acción inmediato antes de autorizar ingreso a poste o andamio.',
  },
  {
    id: 'qr_peligro_critico',
    label: '🚨 Simular Reporte QR de Peligro Crítico / Acto Inseguro en Planta',
    shortBadge: 'Reporte QR Crítico',
    mockInput:
      '[SIMULACIÓN REPORTE QR EN PLANTA] Fecha: Hoy · Área: Bodega Principal y Zona de Soldadura · Severidad: CRÍTICA · Reportante: Operario de Turno · Descripción: Se evidencia cableado trifásico 220V con aislamiento roto sobre piso húmedo junto a estantería metálica y operario realizando corte con pulidora sin careta facial ni mampara ignífuga. Riesgo inminente de electrocución y proyección de partículas.',
  },
  {
    id: 'correo_incapacidad',
    label: '📩 Simular Correo Entrante con Incapacidad / Restricción Médica Laboral',
    shortBadge: 'Incapacidad / Restricción',
    mockInput:
      '[SIMULACIÓN CORREO ENTRANTE EPS/ARL] De: medicina.laboral@eps-salud.co · Asunto: Concepto de Rehabilitación y Restricciones Médicas — Laura Valentina Gómez (CC 1.018.442.310) · Contenido: Se emite incapacidad temporal por 15 días por lumbago mecánico agudo (CIE-10 M54.5) y restricción médica laboral por 60 días: prohibido levantamiento de cargas superiores a 5 kg, movimientos repetitivos de flexo-extensión de tronco y bipedestación prolongada mayor a 2 horas continuas.',
  },
  {
    id: 'sin_novedades_no',
    label: '✅ Simular Escenario Sin Novedades (Para probar la Rama NO de la Condición Si/No)',
    shortBadge: 'Rama NO (Sin Hallazgos)',
    mockInput:
      '[SIMULACIÓN AUDITORÍA SIN HALLAZGOS CRÍTICOS] Estado operativo 100% en regla: 0 exámenes médicos vencidos, 0 cursos de alturas vencidos, 0 accidentes o incidentes ATEL reportados en el periodo, 0 actos o condiciones inseguras pendientes. Todos los controles del SG-SST se encuentran al día (Probar evaluación por la Rama NO de la Condición Si/No).',
  },
];

/**
 * Normaliza URLs de evidencias capturadas (`/api/sgsst/automatizaciones/evidencias/...`)
 * a rutas relativas del navegador para que funcionen igual en localhost:3080, app.wappy.club y wappy.club.
 */
export function normalizeEvidenceUrlForBrowser(rawUrl?: string | null): string | null {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return null;
  const evIdx = trimmed.indexOf('/api/sgsst/automatizaciones/evidencias/');
  if (evIdx >= 0) {
    return trimmed.slice(evIdx);
  }
  return trimmed;
}

function stripEvidenceDownloadQuery(url?: string | null): string {
  const norm = normalizeEvidenceUrlForBrowser(url) || '';
  if (!norm) return '';
  return norm
    .replace(/([?&])download=1(&|$)/i, '$1')
    .replace(/[?&]+$/, '');
}

/**
 * Dispara la descarga directa de un certificado/soporte (`.pdf` o `.png`) usando un `<a>` efímero,
 * permitiendo usar `<ExpandableButton />` con su física de expansión/contracción intacta.
 */
export function triggerDirectFileDownload(rawUrl?: string | null, fileName?: string | null): void {
  if (typeof document === 'undefined') return;
  const norm = normalizeEvidenceUrlForBrowser(rawUrl);
  if (!norm) return;
  const href =
    norm.includes('/api/sgsst/automatizaciones/evidencias/') && !/[?&]download=1\b/i.test(norm)
      ? norm.includes('?')
        ? `${norm}&download=1`
        : `${norm}?download=1`
      : norm;
  const a = document.createElement('a');
  a.href = href;
  a.setAttribute('download', String(fileName || '').trim() || '');
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch (_) {}
  }, 150);
}

/**
 * Normaliza cualquier objeto de `evidenceFiles` / `evidences` (tanto con `pdfUrl`/`imageUrl`
 * como objetos planos `{ url, downloadUrl, fileName, mimeType, type }`).
 */
export function normalizeAnyEvidenceEntry(
  raw?: Record<string, any> | null,
  fallbackPortal?: string,
): ScraperCapturedEvidence | null {
  if (!raw || typeof raw !== 'object') return null;

  let rawPdfUrl: string | null =
    (typeof raw.pdfUrl === 'string' && raw.pdfUrl.trim()) ||
    (typeof raw.pdfAbsoluteUrl === 'string' && raw.pdfAbsoluteUrl.trim()) ||
    null;
  let rawPdfDlUrl: string | null =
    (typeof raw.pdfDownloadUrl === 'string' && raw.pdfDownloadUrl.trim()) || null;
  let rawImgUrl: string | null =
    (typeof raw.imageUrl === 'string' && raw.imageUrl.trim()) ||
    (typeof raw.imageAbsoluteUrl === 'string' && raw.imageAbsoluteUrl.trim()) ||
    null;
  let rawImgDlUrl: string | null =
    (typeof raw.imageDownloadUrl === 'string' && raw.imageDownloadUrl.trim()) || null;

  // Soporte para objetos planos `{ url, downloadUrl, fileUrl, fileName, mimeType, type }`
  const genericUrl = String(raw.url ?? raw.fileUrl ?? raw.href ?? '').trim();
  const genericDlUrl = String(raw.downloadUrl ?? '').trim();
  const genericFileName = String(raw.fileName ?? raw.filename ?? raw.name ?? '').trim();
  const genericMime = String(raw.mimeType ?? raw.type ?? '').toLowerCase();

  if (genericUrl || genericDlUrl) {
    const cleanGeneric = stripEvidenceDownloadQuery(genericUrl || genericDlUrl);
    const isPdf =
      genericMime.includes('pdf') ||
      /\.pdf(\?|$)/i.test(cleanGeneric) ||
      /\.pdf$/i.test(genericFileName);
    const isImage =
      genericMime.includes('image') ||
      genericMime.includes('png') ||
      genericMime.includes('jpeg') ||
      /\.(png|jpe?g|webp)(\?|$)/i.test(cleanGeneric) ||
      /\.(png|jpe?g|webp)$/i.test(genericFileName);

    if (isPdf) {
      if (!rawPdfUrl) rawPdfUrl = cleanGeneric;
      if (!rawPdfDlUrl && genericDlUrl) rawPdfDlUrl = genericDlUrl;
    } else if (isImage) {
      if (!rawImgUrl) rawImgUrl = cleanGeneric;
      if (!rawImgDlUrl && genericDlUrl) rawImgDlUrl = genericDlUrl;
    }
  }

  if (!rawPdfUrl && !rawPdfDlUrl && !rawImgUrl && !rawImgDlUrl) {
    return extractEvidenceFromRow(raw, fallbackPortal);
  }

  const pdfUrl = stripEvidenceDownloadQuery(rawPdfUrl || rawPdfDlUrl) || null;
  const pdfDownloadUrl =
    normalizeEvidenceUrlForBrowser(rawPdfDlUrl) ||
    (pdfUrl ? (pdfUrl.includes('?') ? `${pdfUrl}&download=1` : `${pdfUrl}?download=1`) : null);
  const imageUrl = stripEvidenceDownloadQuery(rawImgUrl || rawImgDlUrl) || null;
  const imageDownloadUrl =
    normalizeEvidenceUrlForBrowser(rawImgDlUrl) ||
    (imageUrl
      ? imageUrl.includes('?')
        ? `${imageUrl}&download=1`
        : `${imageUrl}?download=1`
      : null);

  if (!pdfUrl && !imageUrl) return null;

  const workerName = String(
    raw.workerName ??
      raw['Nombre Completo'] ??
      raw.nombreCompleto ??
      raw.nombre ??
      raw.Colaborador ??
      raw.Trabajador ??
      '',
  ).trim();
  const cedula = String(
    raw.cedula ??
      raw['Cédula / Documento'] ??
      raw['Cédula'] ??
      raw.documento ??
      raw.Documento ??
      raw.CC ??
      '',
  ).trim();
  const cargo = String(raw.cargo ?? raw.Cargo ?? '').trim();
  const portal = String(
    raw.portal ??
      raw.Portal ??
      raw.PortalObjetivo ??
      raw.entidad ??
      raw.Entidad ??
      fallbackPortal ??
      '',
  ).trim();
  const title = String(
    raw.title ??
      raw.curso ??
      raw.Curso ??
      raw['Curso / Norma'] ??
      raw.certificadoNombre ??
      '',
  ).trim();

  return {
    workerName: workerName || undefined,
    cedula: cedula || undefined,
    cargo: cargo || undefined,
    portal: portal || undefined,
    title: title || 'Certificado / Soporte Oficial',
    pdfUrl,
    pdfDownloadUrl,
    pdfAbsoluteUrl: raw.pdfAbsoluteUrl ? String(raw.pdfAbsoluteUrl) : null,
    pdfFileName:
      raw.pdfFileName
        ? String(raw.pdfFileName)
        : pdfUrl && /\.pdf$/i.test(genericFileName)
          ? genericFileName
          : null,
    imageUrl,
    imageDownloadUrl,
    imageAbsoluteUrl: raw.imageAbsoluteUrl ? String(raw.imageAbsoluteUrl) : null,
    imageFileName:
      raw.imageFileName
        ? String(raw.imageFileName)
        : imageUrl && /\.(png|jpe?g|webp)$/i.test(genericFileName)
          ? genericFileName
          : null,
  };
}

/**
 * Extrae defensivamente metadatos de certificado/evidencia desde una fila de `outputItems`.
 */
export function extractEvidenceFromRow(
  row?: Record<string, any> | null,
  fallbackPortal?: string,
): ScraperCapturedEvidence | null {
  if (!row || typeof row !== 'object') return null;

  let rawPdfUrl: string | null =
    typeof row.pdfUrl === 'string' && row.pdfUrl.trim() ? row.pdfUrl.trim() : null;
  let rawPdfDlUrl: string | null =
    typeof row.pdfDownloadUrl === 'string' && row.pdfDownloadUrl.trim()
      ? row.pdfDownloadUrl.trim()
      : null;
  let rawImgUrl: string | null =
    typeof row.imageUrl === 'string' && row.imageUrl.trim() ? row.imageUrl.trim() : null;
  let rawImgDlUrl: string | null =
    typeof row.imageDownloadUrl === 'string' && row.imageDownloadUrl.trim()
      ? row.imageDownloadUrl.trim()
      : null;

  // Respaldo si `certificado` o `soporte` trae enlaces Markdown o URL directa a `/evidencias/`
  const certFieldStr = String(
    row.certificado ?? row['Certificado / Soporte'] ?? row.Certificado ?? row.soporte ?? '',
  ).trim();
  if (certFieldStr && certFieldStr.includes('/api/sgsst/automatizaciones/evidencias/')) {
    const matches =
      certFieldStr.match(/(?:https?:\/\/[^\s)"'>]+)?\/api\/sgsst\/automatizaciones\/evidencias\/[^\s)"'>]+/gi) ||
      [];
    matches.forEach((u) => {
      const cleanU = stripEvidenceDownloadQuery(u);
      if (/\.pdf$/i.test(cleanU)) {
        if (!rawPdfUrl) rawPdfUrl = cleanU;
        if (!rawPdfDlUrl && /download=1/i.test(u)) rawPdfDlUrl = normalizeEvidenceUrlForBrowser(u);
      } else if (/\.(png|jpe?g|webp)$/i.test(cleanU)) {
        if (!rawImgUrl) rawImgUrl = cleanU;
        if (!rawImgDlUrl && /download=1/i.test(u)) rawImgDlUrl = normalizeEvidenceUrlForBrowser(u);
      }
    });
  }

  const pdfUrl = stripEvidenceDownloadQuery(rawPdfUrl || rawPdfDlUrl) || null;
  const pdfDownloadUrl =
    normalizeEvidenceUrlForBrowser(rawPdfDlUrl) ||
    (pdfUrl ? (pdfUrl.includes('?') ? `${pdfUrl}&download=1` : `${pdfUrl}?download=1`) : null);
  const imageUrl = stripEvidenceDownloadQuery(rawImgUrl || rawImgDlUrl) || null;
  const imageDownloadUrl =
    normalizeEvidenceUrlForBrowser(rawImgDlUrl) ||
    (imageUrl
      ? imageUrl.includes('?')
        ? `${imageUrl}&download=1`
        : `${imageUrl}?download=1`
      : null);

  if (!pdfUrl && !imageUrl) return null;

  const workerName = String(
    row.workerName ??
      row['Nombre Completo'] ??
      row.nombreCompleto ??
      row.nombre ??
      row.Colaborador ??
      row.Trabajador ??
      '',
  ).trim();
  const cedula = String(
    row.cedula ??
      row['Cédula / Documento'] ??
      row['Cédula'] ??
      row.documento ??
      row.Documento ??
      row.CC ??
      '',
  ).trim();
  const cargo = String(row.cargo ?? row.Cargo ?? '').trim();
  const portal = String(
    row.portal ??
      row.Portal ??
      row.PortalObjetivo ??
      row.entidad ??
      row.Entidad ??
      fallbackPortal ??
      '',
  ).trim();
  const title = String(
    row.title ??
      row.curso ??
      row.Curso ??
      row['Curso / Norma'] ??
      row.certificadoNombre ??
      (typeof row.certificado === 'string' &&
      !row.certificado.includes('/api/sgsst/automatizaciones/evidencias/')
        ? row.certificado
        : '') ??
      '',
  ).trim();

  return {
    workerName: workerName || undefined,
    cedula: cedula || undefined,
    cargo: cargo || undefined,
    portal: portal || undefined,
    title: title || 'Certificado Oficial Capturado',
    pdfUrl,
    pdfDownloadUrl,
    pdfFileName: row.pdfFileName ? String(row.pdfFileName) : null,
    imageUrl,
    imageDownloadUrl,
    imageFileName: row.imageFileName ? String(row.imageFileName) : null,
  };
}

/**
 * Recolecta y deduplica todos los certificados/evidencias de `evidenceFiles`, `evidences`, `nodeTrace`, `liveSteps` y `outputItems`.
 */
export function collectUniqueScraperEvidences(
  steps?: SandboxNodeTraceStep[] | null,
  extraEvidences?: Array<ScraperCapturedEvidence | Record<string, any>> | null,
): ScraperCapturedEvidence[] {
  const byKey = new Map<string, ScraperCapturedEvidence>();

  const getBaseStem = (url?: string | null): string => {
    const clean = stripEvidenceDownloadQuery(url);
    if (!clean) return '';
    const lastSeg = clean.split('/').pop() || '';
    return lastSeg.replace(/\.(pdf|png|jpe?g|webp)$/i, '').toLowerCase();
  };

  const upsertEvidence = (
    rawInput?: ScraperCapturedEvidence | Record<string, any> | null,
    fallbackPortal?: string,
  ) => {
    const rawEv = normalizeAnyEvidenceEntry(rawInput as Record<string, any>, fallbackPortal);
    if (!rawEv) return;
    const pdfUrl = stripEvidenceDownloadQuery(rawEv.pdfUrl || rawEv.pdfDownloadUrl) || null;
    const imageUrl = stripEvidenceDownloadQuery(rawEv.imageUrl || rawEv.imageDownloadUrl) || null;
    if (!pdfUrl && !imageUrl) return;

    const pdfDownloadUrl =
      normalizeEvidenceUrlForBrowser(rawEv.pdfDownloadUrl) ||
      (pdfUrl ? (pdfUrl.includes('?') ? `${pdfUrl}&download=1` : `${pdfUrl}?download=1`) : null);
    const imageDownloadUrl =
      normalizeEvidenceUrlForBrowser(rawEv.imageDownloadUrl) ||
      (imageUrl
        ? imageUrl.includes('?')
          ? `${imageUrl}&download=1`
          : `${imageUrl}?download=1`
        : null);

    const stem = getBaseStem(pdfUrl || imageUrl);

    // Buscar si ya existe por pdfUrl, imageUrl o stem común (.pdf + .png del mismo soporte) para fusionar sin duplicar
    let matchKey = '';
    for (const [k, existing] of byKey.entries()) {
      const existingStem = getBaseStem(existing.pdfUrl || existing.imageUrl);
      if (
        (pdfUrl && existing.pdfUrl === pdfUrl) ||
        (imageUrl && existing.imageUrl === imageUrl) ||
        (stem && existingStem && stem === existingStem)
      ) {
        matchKey = k;
        break;
      }
    }
    if (!matchKey) {
      matchKey = stem ? `stem:${stem}` : `${pdfUrl || ''}::${imageUrl || ''}`;
    }

    const prev = byKey.get(matchKey);
    byKey.set(matchKey, {
      workerName: rawEv.workerName?.trim() || prev?.workerName || undefined,
      cedula: rawEv.cedula?.trim() || prev?.cedula || undefined,
      cargo: rawEv.cargo?.trim() || prev?.cargo || undefined,
      portal: rawEv.portal?.trim() || prev?.portal || fallbackPortal || undefined,
      title:
        (rawEv.title && rawEv.title !== 'Certificado / Soporte Oficial' ? rawEv.title.trim() : '') ||
        prev?.title ||
        rawEv.title?.trim() ||
        'Certificado / Evidencia Oficial',
      pdfUrl: pdfUrl || prev?.pdfUrl || null,
      pdfDownloadUrl: pdfDownloadUrl || prev?.pdfDownloadUrl || null,
      pdfAbsoluteUrl: rawEv.pdfAbsoluteUrl || prev?.pdfAbsoluteUrl || null,
      pdfFileName: rawEv.pdfFileName || prev?.pdfFileName || null,
      imageUrl: imageUrl || prev?.imageUrl || null,
      imageDownloadUrl: imageDownloadUrl || prev?.imageDownloadUrl || null,
      imageAbsoluteUrl: rawEv.imageAbsoluteUrl || prev?.imageAbsoluteUrl || null,
      imageFileName: rawEv.imageFileName || prev?.imageFileName || null,
    });
  };

  if (Array.isArray(extraEvidences)) {
    extraEvidences.forEach((ev) => upsertEvidence(ev));
  }

  const safeSteps = Array.isArray(steps) ? steps : [];
  safeSteps.forEach((st) => {
    if (Array.isArray(st?.evidenceFiles)) {
      st.evidenceFiles.forEach((ev) => upsertEvidence(ev, st.title));
    }
    if (Array.isArray(st?.evidences)) {
      st.evidences.forEach((ev) => upsertEvidence(ev, st.title));
    }
    if (Array.isArray((st as any)?.capturedEvidences)) {
      (st as any).capturedEvidences.forEach((ev: any) => upsertEvidence(ev, st.title));
    }
    if (Array.isArray(st?.outputItems)) {
      st.outputItems.forEach((row) => {
        const extracted = extractEvidenceFromRow(row, st.title);
        if (extracted) upsertEvidence(extracted, st.title);
      });
    }
    if (
      typeof st?.outputPreview === 'string' &&
      st.outputPreview.includes('/api/sgsst/automatizaciones/evidencias/')
    ) {
      const previewRowEv = extractEvidenceFromRow(
        { certificado: st.outputPreview, portal: st.title },
        st.title,
      );
      if (previewRowEv) upsertEvidence(previewRowEv, st.title);
    }
  });

  return Array.from(byKey.values());
}

/**
 * Limpia defensivamente imágenes y bloques sueltos de evidencias `/api/sgsst/automatizaciones/evidencias/...`
 * dentro del mensaje ejecutivo del Agente IA cuando ya se muestran en el Campo Aparte / Pestaña Archivos.
 */
export function stripNoiseEvidencesFromAgentResponse(content: string): string {
  const safe = String(content || '');
  if (!safe || !safe.includes('/api/sgsst/automatizaciones/evidencias/')) {
    return safe;
  }

  // Si viene como HTML pre-renderizado
  if (
    safe.trim().startsWith('<') &&
    (safe.includes('<div') || safe.includes('<p') || safe.includes('<table') || safe.includes('<h'))
  ) {
    return safe
      .replace(
        /<img\b[^>]*src="[^"]*\/api\/sgsst\/automatizaciones\/evidencias\/[^"]*"[^>]*>/gi,
        '',
      )
      .replace(
        /<p[^>]*>\s*(?:<a\b[^>]*href="[^"]*\/api\/sgsst\/automatizaciones\/evidencias\/[^"]*"[^>]*>[\s\S]*?<\/a>\s*[|·\s]*)+<\/p>/gi,
        '',
      );
  }

  // Limpieza sobre Markdown
  const cleanedLines: string[] = [];
  const rawLines = safe.split('\n');

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    // 1. Omitir líneas que sean únicamente una imagen Markdown de evidencia
    if (
      /^!\[[^\]]*\]\([^)]*\/api\/sgsst\/automatizaciones\/evidencias\/[^)]+\)\s*$/i.test(trimmed)
    ) {
      continue;
    }

    // 2. Omitir líneas de viñeta o párrafo que solo contengan enlaces/imágenes de descarga de evidencias
    if (
      trimmed.includes('/api/sgsst/automatizaciones/evidencias/') &&
      !trimmed.startsWith('|')
    ) {
      const strippedLinks = trimmed
        .replace(/^[-*•>\d.)\s]+/, '')
        .replace(/!\[[^\]]*\]\([^)]*\/api\/sgsst\/automatizaciones\/evidencias\/[^)]+\)/gi, '')
        .replace(/\[[^\]]*\]\([^)]*\/api\/sgsst\/automatizaciones\/evidencias\/[^)]+\)/gi, '')
        .replace(/[|·—–\-:\s]+/g, '')
        .trim();
      if (!strippedLinks) {
        continue;
      }
    }

    // 3. Quitar imágenes Markdown incrustadas dentro de celdas de tabla o párrafos y enlaces redundantes a evidencias
    let lineOut = rawLine.replace(
      /!\[[^\]]*\]\([^)]*\/api\/sgsst\/automatizaciones\/evidencias\/[^)]+\)/gi,
      '',
    );
    if (lineOut.trim().startsWith('|') && lineOut.includes('/api/sgsst/automatizaciones/evidencias/')) {
      lineOut = lineOut
        .replace(
          /\[([^\]]*)\]\([^)]*\/api\/sgsst\/automatizaciones\/evidencias\/[^)]+\)/gi,
          '',
        )
        .replace(/\|\s*[·|]+\s*\|/g, '| — |');
    }

    cleanedLines.push(lineOut);
  }

  // Omitir encabezados huérfanos al final si su contenido eran solo imágenes de certificados
  while (cleanedLines.length > 0) {
    const last = cleanedLines[cleanedLines.length - 1].trim();
    if (!last) {
      cleanedLines.pop();
      continue;
    }
    if (
      /^#{1,4}\s*.*(certificados?|evidencias?|soportes?|galer[ií]a|archivos?\s+descargados?).*$/i.test(
        last,
      )
    ) {
      cleanedLines.pop();
      continue;
    }
    break;
  }

  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function escapeHtmlAttr(val: string): string {
  return String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildEvidenceLinkHtml(labelHtml: string, rawUrl: string): string {
  const normUrl = normalizeEvidenceUrlForBrowser(rawUrl) || rawUrl;
  const safeHref = escapeHtmlAttr(normUrl);
  const isEvidenceRoute = normUrl.includes('/api/sgsst/automatizaciones/evidencias/');
  const hasDownload = /[?&]download=1\b/i.test(normUrl);
  const cleanPath = stripEvidenceDownloadQuery(normUrl);
  const isPdf = /\.pdf$/i.test(cleanPath);
  const isImage = /\.(png|jpe?g|webp)$/i.test(cleanPath);

  if (isEvidenceRoute || isPdf || isImage) {
    if (hasDownload) {
      return `<a href="${safeHref}" download class="inline-flex items-center gap-1 px-2.5 py-1 my-0.5 mr-1 rounded-xl border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 text-[11px] font-extrabold no-underline transition-all">${labelHtml}</a>`;
    }
    if (isImage || (!isPdf && isEvidenceRoute)) {
      return `<a href="${safeHref}" data-wappy-evidence-open="image" data-wappy-evidence-url="${safeHref}" class="inline-flex items-center gap-1 px-2.5 py-1 my-0.5 mr-1 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 text-[11px] font-extrabold no-underline cursor-pointer transition-all">${labelHtml}</a>`;
    }
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1 my-0.5 mr-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 text-[11px] font-extrabold no-underline transition-all">${labelHtml}</a>`;
  }

  return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-teal-600 dark:text-teal-400 font-bold underline hover:opacity-80">${labelHtml}</a>`;
}

function formatInlineMarkdownWithEvidences(escapedText: string): string {
  const tokens: string[] = [];
  const stash = (htmlSnippet: string): string => {
    const idx = tokens.length;
    tokens.push(htmlSnippet);
    return `\u0000WPYTOK_${idx}\u0000`;
  };

  // 1. Imágenes Markdown ![alt](url)
  let out = escapedText.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, rawUrl) => {
    const unescapedUrl = String(rawUrl || '').replace(/&amp;/g, '&');
    const normUrl = normalizeEvidenceUrlForBrowser(unescapedUrl) || unescapedUrl;
    const safeSrc = escapeHtmlAttr(normUrl);
    const safeAlt = escapeHtmlAttr(alt || 'Certificado Oficial');
    return stash(
      `<span class="block my-2"><img src="${safeSrc}" alt="${safeAlt}" data-wappy-evidence-img="${safeSrc}" data-wappy-evidence-title="${safeAlt}" class="max-h-72 w-auto max-w-full rounded-xl border border-teal-500/30 shadow-md my-2 cursor-zoom-in object-contain bg-white hover:border-teal-500 transition-all" /></span>`,
    );
  });

  // 2. Enlaces Markdown [texto](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, rawUrl) => {
    const unescapedUrl = String(rawUrl || '').replace(/&amp;/g, '&');
    return stash(buildEvidenceLinkHtml(label, unescapedUrl));
  });

  // 3. Código en línea, negrita y cursiva
  out = out
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');

  // Restaurar tokens HTML
  out = out.replace(/\u0000WPYTOK_(\d+)\u0000/g, (_, idxStr) => tokens[Number(idxStr)] || '');
  return out;
}

function upgradeExistingEvidenceHtml(rawHtml: string): string {
  let html = String(rawHtml || '');
  // Normalizar cualquier URL absoluta que apunte a `/api/sgsst/automatizaciones/evidencias/`
  html = html.replace(
    /https?:\/\/[^/"'\s>]+\/api\/sgsst\/automatizaciones\/evidencias\//gi,
    '/api/sgsst/automatizaciones/evidencias/',
  );
  // Estilizar imágenes de evidencias existentes
  html = html.replace(
    /<img\b([^>]*?)src="(\/api\/sgsst\/automatizaciones\/evidencias\/[^"]+)"([^>]*)>/gi,
    (full, pre, src, post) => {
      if (full.includes('data-wappy-evidence-img')) return full;
      return `<img${pre}src="${src}" data-wappy-evidence-img="${src}" class="max-h-72 w-auto max-w-full rounded-xl border border-teal-500/30 shadow-md my-2 cursor-zoom-in object-contain bg-white"${post}>`;
    },
  );
  // Estilizar enlaces a evidencias existentes (que no envuelvan un <img)
  html = html.replace(
    /<a\b([^>]*?)href="(\/api\/sgsst\/automatizaciones\/evidencias\/[^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi,
    (full, _pre, href, _post, inner) => {
      if (/<img\b/i.test(inner)) {
        return inner;
      }
      if (full.includes('data-wappy-evidence-open') || full.includes('border-green-500/30')) {
        return full;
      }
      return buildEvidenceLinkHtml(inner, href);
    },
  );
  return html;
}

/**
 * Renderiza Markdown o HTML de resultados de flujo y `outputPreview` soportando tablas,
 * tarjetas `wappy-card`, insignias clicables `[...](/api/sgsst/automatizaciones/evidencias/...)`
 * y miniaturas ampliables `![alt](/api/sgsst/automatizaciones/evidencias/...)`.
 */
export function renderWorkflowMarkdownToInteractiveHtml(md: string): string {
  const safe = String(md || '').trim();
  if (!safe) return '<p>Sin contenido generado.</p>';
  if (
    safe.startsWith('<') &&
    (safe.includes('<div') || safe.includes('<p') || safe.includes('<table') || safe.includes('<h'))
  ) {
    return upgradeExistingEvidenceHtml(safe);
  }

  // Extraer bloques ```wappy-card antes de escapar HTML
  const cardBlocks: string[] = [];
  const withoutCards = safe.replace(/```wappy-card[\s\S]*?```/gi, (match) => {
    try {
      const jsonStr = match.replace(/```wappy-card/i, '').replace(/```$/, '').trim();
      const card = JSON.parse(jsonStr);
      const items = Array.isArray(card.items) ? card.items : [];
      const itemsHtml = items
        .map((it: any) => {
          const t = escapeHtmlAttr(typeof it === 'string' ? it : it?.title || '');
          const d = escapeHtmlAttr(typeof it === 'string' ? '' : it?.description || it?.subtitle || '');
          return `<li class="mb-1"><strong>${t}</strong>${d ? `: ${d}` : ''}</li>`;
        })
        .join('');
      const idx = cardBlocks.length;
      cardBlocks.push(
        `<div class="my-3 p-3.5 rounded-2xl border border-teal-500/30 bg-teal-500/10"><h4 class="text-xs font-black text-teal-700 dark:text-teal-300 mb-1">${escapeHtmlAttr(card.title || 'Resumen de Gestión')}</h4>${card.subtitle || card.description ? `<p class="text-xs opacity-90 mb-2">${escapeHtmlAttr(card.subtitle || card.description)}</p>` : ''}${itemsHtml ? `<ul class="list-disc pl-5 text-xs">${itemsHtml}</ul>` : ''}</div>`,
      );
      return `\n@@WAPPY_CARD_BLOCK_${idx}@@\n`;
    } catch (_) {
      return '';
    }
  });

  const escaped = withoutCards
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  let tableRows: string[][] = [];

  const closeList = () => {
    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }
  };

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const headerRow = tableRows[0];
    const bodyRows = tableRows.slice(1);
    let tbl = '<div class="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-800"><table class="w-full border-collapse text-xs"><thead><tr>';
    headerRow.forEach((cell) => {
      tbl += `<th class="p-2 text-left font-extrabold bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">${formatInlineMarkdownWithEvidences(cell)}</th>`;
    });
    tbl += '</tr></thead><tbody>';
    bodyRows.forEach((row) => {
      tbl += '<tr class="border-b border-slate-100 dark:border-slate-800/80 last:border-b-0">';
      row.forEach((cell) => {
        tbl += `<td class="p-2 align-middle">${formatInlineMarkdownWithEvidences(cell)}</td>`;
      });
      tbl += '</tr>';
    });
    tbl += '</tbody></table></div>';
    htmlLines.push(tbl);
    tableRows = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Filas de tabla Markdown | col | col |
    if (line.startsWith('|') && line.endsWith('|') && line.length > 2) {
      closeList();
      if (line.replace(/[\s|:-]/g, '').length === 0) {
        continue;
      }
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    }

    flushTable();

    if (!line) {
      closeList();
      continue;
    }

    const cardMatch = line.match(/^@@WAPPY_CARD_BLOCK_(\d+)@@$/);
    if (cardMatch) {
      closeList();
      htmlLines.push(cardBlocks[Number(cardMatch[1])] || '');
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      closeList();
      htmlLines.push('<hr class="my-3 border-slate-200 dark:border-slate-800" />');
    } else if (line.startsWith('#### ')) {
      closeList();
      htmlLines.push(
        `<h4 class="text-xs font-extrabold mt-3 mb-1 text-teal-700 dark:text-teal-300">${formatInlineMarkdownWithEvidences(line.slice(5))}</h4>`,
      );
    } else if (line.startsWith('### ')) {
      closeList();
      htmlLines.push(
        `<h3 class="text-sm font-extrabold mt-3.5 mb-1.5 text-teal-700 dark:text-teal-300">${formatInlineMarkdownWithEvidences(line.slice(4))}</h3>`,
      );
    } else if (line.startsWith('## ')) {
      closeList();
      htmlLines.push(
        `<h2 class="text-base font-extrabold mt-4 mb-2 text-slate-900 dark:text-white">${formatInlineMarkdownWithEvidences(line.slice(3))}</h2>`,
      );
    } else if (line.startsWith('# ')) {
      closeList();
      htmlLines.push(
        `<h1 class="text-lg font-black mt-4 mb-2 text-slate-900 dark:text-white">${formatInlineMarkdownWithEvidences(line.slice(2))}</h1>`,
      );
    } else if (line.startsWith('&gt; ')) {
      closeList();
      htmlLines.push(
        `<blockquote class="pl-3 py-1 my-2 border-l-3 border-teal-500/60 bg-teal-500/5 rounded-r-lg text-xs italic">${formatInlineMarkdownWithEvidences(line.slice(5))}</blockquote>`,
      );
    } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      if (!inList) {
        htmlLines.push('<ul class="list-disc pl-5 my-2 space-y-1">');
        inList = true;
      }
      htmlLines.push(
        `<li class="leading-relaxed">${formatInlineMarkdownWithEvidences(line.slice(2))}</li>`,
      );
    } else {
      closeList();
      htmlLines.push(
        `<p class="my-1.5 leading-relaxed">${formatInlineMarkdownWithEvidences(line)}</p>`,
      );
    }
  }

  flushTable();
  closeList();
  return htmlLines.join('\n');
}

/**
 * Delegador de clics para abrir el Lightbox de Certificados/Evidencias al hacer clic en imágenes o insignias.
 */
export function handleEvidenceContainerClick(
  e: React.MouseEvent<HTMLElement>,
  knownEvidences: ScraperCapturedEvidence[],
  onOpenEvidence?: (evidence: ScraperCapturedEvidence, preferredMode?: 'image' | 'pdf') => void,
): void {
  if (!onOpenEvidence) return;
  const target = e.target as HTMLElement | null;
  if (!target) return;

  const findMatchingEvidence = (rawUrl: string, fallbackTitle?: string): ScraperCapturedEvidence => {
    const cleanTarget = stripEvidenceDownloadQuery(rawUrl);
    const found = (Array.isArray(knownEvidences) ? knownEvidences : []).find(
      (ev) =>
        (ev.imageUrl && stripEvidenceDownloadQuery(ev.imageUrl) === cleanTarget) ||
        (ev.pdfUrl && stripEvidenceDownloadQuery(ev.pdfUrl) === cleanTarget),
    );
    if (found) return found;
    const isPdf = /\.pdf$/i.test(cleanTarget);
    const dlUrl = cleanTarget.includes('?') ? `${cleanTarget}&download=1` : `${cleanTarget}?download=1`;
    return {
      title: fallbackTitle?.trim() || 'Certificado Oficial Capturado',
      imageUrl: isPdf ? null : cleanTarget,
      imageDownloadUrl: isPdf ? null : dlUrl,
      pdfUrl: isPdf ? cleanTarget : null,
      pdfDownloadUrl: isPdf ? dlUrl : null,
    };
  };

  const imgEl = target.closest('img') as HTMLImageElement | null;
  if (imgEl) {
    const imgSrc = imgEl.getAttribute('data-wappy-evidence-img') || imgEl.getAttribute('src') || '';
    if (imgSrc && imgSrc.includes('/api/sgsst/automatizaciones/evidencias/')) {
      e.preventDefault();
      e.stopPropagation();
      const ev = findMatchingEvidence(
        imgSrc,
        imgEl.getAttribute('data-wappy-evidence-title') || imgEl.alt || 'Certificado Oficial',
      );
      onOpenEvidence(ev, 'image');
      return;
    }
  }

  const anchorEl = target.closest('a[data-wappy-evidence-open]') as HTMLAnchorElement | null;
  if (anchorEl) {
    const url =
      anchorEl.getAttribute('data-wappy-evidence-url') || anchorEl.getAttribute('href') || '';
    if (url) {
      e.preventDefault();
      e.stopPropagation();
      const ev = findMatchingEvidence(url, anchorEl.textContent || 'Certificado Oficial');
      const isPdf = /\.pdf$/i.test(stripEvidenceDownloadQuery(url));
      onOpenEvidence(ev, isPdf ? 'pdf' : 'image');
    }
  }
}

export default function WappyWorkflowSandboxPanel({
  open,
  running,
  result,
  error,
  mockTriggerInput,
  onChangeMockTriggerInput,
  onRunSimulation,
  onClearSimulation,
  onClose,
  activeStepNodeId,
  onSelectStepNode,
  emailsStr = '',
  liveSteps = [],
  totalPlannedSteps = 0,
  activeStepTitle = '',
  onOpenEvidence,
}: WappyWorkflowSandboxPanelProps) {
  const [activeTab, setActiveTab] = useState<'response' | 'files' | 'trace' | 'outputs' | 'mock'>(
    'response',
  );
  const [responseEvidenceLayout, setResponseEvidenceLayout] = useState<'compact' | 'cards'>(
    'compact',
  );
  const [filesTabLayout, setFilesTabLayout] = useState<'cards' | 'compact'>('cards');
  const [evidenceSearchQuery, setEvidenceSearchQuery] = useState<string>('');
  const [showRawMarkdown, setShowRawMarkdown] = useState<boolean>(false);
  const [showCustomMockBox, setShowCustomMockBox] = useState<boolean>(false);
  const [selectedAgentIdx, setSelectedAgentIdx] = useState<number>(-1); // -1 = Consolidada
  const [selectedTraceIdx, setSelectedTraceIdx] = useState<number>(0);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);

  const activeScenarioId = useMemo(() => {
    const trimmed = (mockTriggerInput || '').trim();
    const matched = QUICK_MOCK_SCENARIOS.find((s) => s.mockInput.trim() === trimmed);
    return matched ? matched.id : 'custom';
  }, [mockTriggerInput]);

  const nodeTrace = useMemo<SandboxNodeTraceStep[]>(() => {
    if (!result) return [];
    const raw = Array.isArray(result.nodeTrace)
      ? result.nodeTrace
      : Array.isArray((result as any).trace)
        ? (result as any).trace
        : [];
    return raw;
  }, [result]);

  const capturedEvidences = useMemo<ScraperCapturedEvidence[]>(() => {
    const combinedSteps: SandboxNodeTraceStep[] = [
      ...nodeTrace,
      ...(Array.isArray(liveSteps) ? liveSteps : []),
    ];
    const topEvidences: Array<ScraperCapturedEvidence | Record<string, any>> = [
      ...(Array.isArray(result?.evidenceFiles) ? result!.evidenceFiles! : []),
      ...(Array.isArray(result?.evidences) ? result!.evidences! : []),
      ...(Array.isArray((result as any)?.capturedEvidences) ? (result as any).capturedEvidences : []),
    ];

    // Respaldo adicional si finalResponseMarkdown contiene rutas de evidencias no listadas aún
    const rawFinalMd = String(result?.finalResponseMarkdown || '');
    if (rawFinalMd.includes('/api/sgsst/automatizaciones/evidencias/')) {
      const fallbackEv = extractEvidenceFromRow({ certificado: rawFinalMd });
      if (fallbackEv) topEvidences.push(fallbackEv);
    }

    return collectUniqueScraperEvidences(combinedSteps, topEvidences);
  }, [nodeTrace, liveSteps, result]);

  const filteredEvidences = useMemo<ScraperCapturedEvidence[]>(() => {
    const q = evidenceSearchQuery.trim().toLowerCase();
    if (!q) return capturedEvidences;
    return capturedEvidences.filter((ev) =>
      [ev.workerName, ev.cedula, ev.portal, ev.title, ev.cargo, ev.pdfFileName, ev.imageFileName]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q)),
    );
  }, [capturedEvidences, evidenceSearchQuery]);

  const agentOutputs = useMemo<SandboxAgentOutput[]>(() => {
    if (!result) return [];
    const raw = Array.isArray(result.agentOutputs)
      ? result.agentOutputs
      : Array.isArray((result as any).agents)
        ? (result as any).agents
        : [];
    return raw;
  }, [result]);

  const finalMarkdown = useMemo(() => {
    if (!result) return '';
    return (
      result.finalResponseMarkdown?.trim() ||
      (result as any).finalResponse?.trim() ||
      (result as any).response?.trim() ||
      agentOutputs[agentOutputs.length - 1]?.responseMarkdown?.trim() ||
      ''
    );
  }, [result, agentOutputs]);

  const finalHtml = useMemo(() => {
    if (!result) return '';
    if (finalMarkdown) {
      return renderWorkflowMarkdownToInteractiveHtml(finalMarkdown);
    }
    if (result.finalResponseHtml?.trim()) {
      return renderWorkflowMarkdownToInteractiveHtml(result.finalResponseHtml);
    }
    return '<p>Sin contenido generado.</p>';
  }, [result, finalMarkdown]);

  const emailPreview = useMemo<SandboxEmailPreview>(() => {
    const raw = result?.interceptedOutputs?.emailPreview || result?.emailPreview;
    const fallbackRecipients = emailsStr
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    return {
      blocked: true,
      from: raw?.from || 'notificaciones@wappy.club',
      recipients:
        Array.isArray(raw?.recipients) && raw!.recipients.length > 0
          ? raw!.recipients
          : fallbackRecipients.length > 0
            ? fallbackRecipients
            : ['sst@tuempresa.com (Destinatario configurado)'],
      subject:
        raw?.subject ||
        `[MODO DESARROLLO · NO ENVIADO] Bitácora SG-SST — ${result?.company?.name || 'Empresa Activa'}`,
      htmlBody: raw?.htmlBody || finalHtml,
      textBody: raw?.textBody || finalMarkdown,
      reason:
        raw?.reason ||
        'Interceptado por el Escenario de Desarrollo (Modo Sandbox). Cero correos externos despachados.',
    };
  }, [result, emailsStr, finalHtml, finalMarkdown]);

  const notificationPreview = useMemo<SandboxNotificationPreview>(() => {
    const raw = result?.interceptedOutputs?.notificationPreview || result?.notificationPreview;
    return {
      blocked: true,
      channel: raw?.channel || 'Campanita WAPPY + Chat de Tenshi IA',
      title:
        raw?.title ||
        `🛡️ Reporte Automatizado SG-SST (${result?.company?.name || 'Empresa Activa'})`,
      message:
        raw?.message ||
        (finalMarkdown
          ? finalMarkdown.slice(0, 420) + (finalMarkdown.length > 420 ? '…' : '')
          : 'Notificación interna interceptada en Modo Desarrollo.'),
      tenshiVoiceSummary:
        raw?.tenshiVoiceSummary ||
        'Hola equipo SST, ejecuté la simulación del flujo en el Escenario de Desarrollo sin disparar alertas externas.',
    };
  }, [result, finalMarkdown]);

  const hitoImpacts = useMemo<SandboxHitoImpactPreview[]>(() => {
    const raw = result?.interceptedOutputs?.hitoImpacts || result?.hitoImpacts;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return nodeTrace
      .filter((step) => step.category === 'hito' || step.stage === 'hitos' || step.nodeId?.startsWith('hito'))
      .map((step) => ({
        nodeId: step.nodeId,
        title: step.title,
        operationMode: 'Simulación sin escritura en BD',
        blocked: true,
        summary:
          step.outputPreview ||
          'Actualización de Hito SST simulada en memoria (sin alterar registros productivos).',
      }));
  }, [result, nodeTrace]);

  const currentTraceStep = useMemo<SandboxNodeTraceStep | null>(() => {
    if (nodeTrace.length === 0) return null;
    const safeIdx = Math.min(Math.max(0, selectedTraceIdx), nodeTrace.length - 1);
    return nodeTrace[safeIdx] || nodeTrace[0];
  }, [nodeTrace, selectedTraceIdx]);

  const handleCopyFinalResponse = () => {
    if (!finalMarkdown) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(finalMarkdown).catch(() => {});
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2500);
    }
  };

  if (!open) return null;

  const totalSec = result?.totalDurationMs
    ? (result.totalDurationMs / 1000).toFixed(1)
    : '0.0';
  const branchTaken = result?.ifEvaluation?.branchTaken || 'SÍ';

  return (
    <div
      id="wappy-workflow-sandbox-panel"
      className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/70 dark:border-[#C7F303]/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl transition-all min-w-0 max-w-full"
    >
      {/* Luces ambientales WAPPY */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl" />

      {/* ─── 1. CABECERA EJECUTIVA DEL ESCENARIO DE DESARROLLO ─── */}
      <div className="relative z-10 p-4 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-[#C7F303] shrink-0 shadow-xs">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-[#C7F303] dark:to-teal-300 bg-clip-text text-transparent">
                  🧪 ESCENARIO DE DESARROLLO & SIMULACIÓN EN VIVO (MODO SANDBOX)
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-[#C7F303]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  🛡️ SALIDAS BLOQUEADAS: 0 correos enviados · 0 alertas disparadas
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Prueba tu flujo completo con datos reales de tu empresa o escenarios simulados y verifica la respuesta exacta del Agente IA sin enviar correos ni notificaciones externas.
              </p>
            </div>
          </div>

          {/* Botonera WAPPY (ExpandableButton sin alwaysExpanded) */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <ExpandableButton
              size="sm"
              variant="emerald"
              disabled={running}
              icon={
                running ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )
              }
              label={running ? 'Ejecutando Simulación...' : 'Dar Play al Flujo (Sin Enviar Salidas)'}
              title="Dar Play al Flujo en Modo Desarrollo (Sin Enviar Salidas)"
              onClick={() => {
                setActiveTab('response');
                onRunSimulation();
              }}
            />

            {result && (
              <ExpandableButton
                size="sm"
                variant="teal"
                icon={
                  copiedResponse ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
                label={copiedResponse ? '¡Respuesta Copiada!' : 'Copiar Respuesta Final'}
                title="Copiar Respuesta Final al portapapeles"
                onClick={handleCopyFinalResponse}
              />
            )}

            {(result || error || mockTriggerInput) && (
              <ExpandableButton
                size="sm"
                variant="amber"
                disabled={running}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                label="Limpiar Simulación"
                title="Limpiar resultado de la simulación actual"
                onClick={() => {
                  setSelectedAgentIdx(-1);
                  setSelectedTraceIdx(0);
                  onClearSimulation();
                }}
              />
            )}

            <ExpandableButton
              size="sm"
              variant="neutral"
              icon={<X className="w-3.5 h-3.5" />}
              label="Cerrar Escenario"
              title="Cerrar Escenario de Desarrollo"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Resumen de métricas cuando hay resultado */}
        {result && (
          <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              ⏱️ Tiempo total: <strong>{totalSec}s</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              <Cpu className="w-3.5 h-3.5" />
              🧠 Motor / Modelo: <strong>{result.modelUsed || 'gemini-3.6-flash'}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              <Building2 className="w-3.5 h-3.5" />
              🏢 Empresa: <strong>{result.company?.name || 'Empresa Activa'}</strong>
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
                String(branchTaken).toUpperCase().includes('NO')
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              🔀 Condición Si/No: <strong>Rama {branchTaken}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ─── 2. BARRA DE ESCENARIOS RÁPIDOS DE PRUEBA (INPUT MOCK EN 1 CLIC) ─── */}
      <div className="relative z-10 px-4 py-3 bg-slate-50/90 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Escenarios Rápidos de Prueba (Elige un disparador en 1 clic antes de pulsar ▶ Dar Play):
          </span>
          <button
            type="button"
            onClick={() => setShowCustomMockBox((v) => !v)}
            className="text-[10.5px] font-extrabold text-purple-600 dark:text-[#C7F303] hover:underline flex items-center gap-1"
          >
            {showCustomMockBox ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Ocultar entrada personalizada
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Personalizar dato de entrada (Mock)
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_MOCK_SCENARIOS.map((sc) => {
            const isSelected = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  onChangeMockTriggerInput(sc.mockInput);
                  if (sc.id !== 'live_company') {
                    setShowCustomMockBox(true);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold transition text-left border ${
                  isSelected
                    ? 'bg-emerald-500/15 dark:bg-[#C7F303]/20 border-emerald-500 dark:border-[#C7F303] text-emerald-900 dark:text-[#C7F303] shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                }`}
              >
                {sc.label}
              </button>
            );
          })}
        </div>

        {showCustomMockBox && (
          <div className="mt-2.5">
            <textarea
              rows={2}
              value={mockTriggerInput}
              onChange={(e) => onChangeMockTriggerInput(e.target.value)}
              placeholder="Escribe aquí un evento simulado (ej. reporte QR, correo entrante, alerta de vencimiento) o déjalo vacío para probar solo con los datos reales actuales de tu empresa..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        )}
      </div>

      {/* ─── 3. BARRA DE PESTAÑAS DEL ESCENARIO DE DESARROLLO ─── */}
      <div className="relative z-10 px-4 pt-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
        {[
          {
            id: 'response' as const,
            label: '✨ 1. Respuesta Final del Flujo',
            badge: agentOutputs.length > 1 ? `${agentOutputs.length} Agentes IA` : 'Consolidada',
            highlightBadge: false,
          },
          {
            id: 'files' as const,
            label: '📎 Archivos / Certificados',
            badge: `${capturedEvidences.length}`,
            highlightBadge: capturedEvidences.length > 0,
          },
          {
            id: 'trace' as const,
            label: `🔗 2. Traza Nodo por Nodo (${nodeTrace.length} pasos)`,
            badge: `${nodeTrace.length}`,
            highlightBadge: false,
          },
          {
            id: 'outputs' as const,
            label: '🛡️ 3. Salidas Interceptadas (Sin Enviar)',
            badge: '0 Enviadas',
            highlightBadge: false,
          },
          {
            id: 'mock' as const,
            label: '🧪 4. Entrada de Prueba (Mock)',
            badge: mockTriggerInput.trim() ? 'Mock Activo' : 'BD en Vivo',
            highlightBadge: false,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-t-xl text-xs font-extrabold transition flex items-center gap-2 border-b-2 cursor-pointer ${
                isActive
                  ? 'border-emerald-500 dark:border-[#C7F303] text-emerald-700 dark:text-[#C7F303] bg-emerald-500/10 dark:bg-[#C7F303]/10'
                  : tab.highlightBadge
                    ? 'border-transparent text-teal-700 dark:text-teal-300 bg-teal-500/5 hover:bg-teal-500/10'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-lg text-[9.5px] font-black transition ${
                  tab.highlightBadge
                    ? 'bg-[#C7F303] text-[#0E1300] ring-1 ring-emerald-500/40 shadow-2xs'
                    : isActive
                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-[#C7F303]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── 4. CUERPO DE LAS 4 PESTAÑAS ─── */}
      <div className="relative z-10 p-4">
        {/* Estado de error */}
        {error && (
          <div className="mb-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <div className="font-extrabold">Error al ejecutar la simulación en el Escenario de Desarrollo</div>
                <p className="mt-0.5 text-[11px] opacity-90">{error}</p>
              </div>
            </div>
            <ExpandableButton
              size="sm"
              variant="emerald"
              icon={<Play className="w-3.5 h-3.5" />}
              label="Reintentar Simulación"
              onClick={onRunSimulation}
            />
          </div>
        )}

        {/* Estado ejecutando en vivo paso por paso */}
        {running && (
          <div className="py-6 px-4 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-[#C7F303]">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {activeStepTitle
                  ? `⏳ Ejecutando Paso #${liveSteps.length + 1}${totalPlannedSteps ? ` de ${totalPlannedSteps}` : ''}: ${activeStepTitle}...`
                  : 'Ejecutando Flujo Consecutivo en Escenario de Desarrollo (Modo Sandbox)...'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
                Avanzando nodo por nodo en el orden exacto de tus conexiones ({liveSteps.length}
                {totalPlannedSteps ? ` / ${totalPlannedSteps}` : ''} pasos completados). Nodos desconectados ignorados y salidas bloqueadas.
              </p>
            </div>
            {liveSteps.length > 0 && (
              <div className="w-full max-w-2xl mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {liveSteps.map((st, idx) => (
                  <span
                    key={`${st.nodeKey || st.nodeId}_${idx}`}
                    className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold flex items-center gap-1 border ${
                      st.status === 'simulated_blocked'
                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-800 dark:text-[#C7F303] border-emerald-500/30'
                    }`}
                  >
                    <span>
                      {st.status === 'simulated_blocked' ? '🛡️' : '✓'} Paso #{idx + 1}: {st.title}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Galería en vivo si algún paso scraper ya capturó certificados mientras termina la corrida */}
        {running && capturedEvidences.length > 0 && (
          <div className="mt-3 rounded-2xl border border-[#0D9488]/50 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent p-3.5 space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                📎 Certificados y Evidencias Oficiales Capturadas en Vivo ({capturedEvidences.length})
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-[#C7F303]">
                ✓ Listos para visualizar o descargar
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 min-w-0">
              {capturedEvidences.map((ev, evIdx) => (
                <div
                  key={`live_ev_${evIdx}_${ev.pdfUrl || ev.imageUrl || evIdx}`}
                  className="rounded-xl border border-teal-500/30 bg-white/90 dark:bg-slate-900/90 p-2.5 flex items-center gap-2.5 min-w-0"
                >
                  {ev.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence?.(ev, 'image')}
                      className="w-12 h-12 rounded-lg overflow-hidden border border-teal-500/30 bg-slate-100 dark:bg-slate-800 shrink-0 cursor-zoom-in"
                      title="Ver certificado ampliado"
                    >
                      <img
                        src={ev.imageUrl}
                        alt={ev.title || 'Certificado'}
                        className="w-full h-full object-cover object-top"
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence?.(ev, 'pdf')}
                      className="w-12 h-12 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 cursor-pointer"
                      title="Ver PDF oficial"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-extrabold text-slate-900 dark:text-white truncate">
                      {ev.workerName || 'Colaborador Verificado'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {ev.cedula ? `CC ${ev.cedula} · ` : ''}
                      {ev.portal || ev.title || 'Soporte Oficial'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado inicial sin probar aún */}
        {!running && !result && !error && activeTab !== 'mock' && activeTab !== 'files' && (
          <div className="py-8 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-[#C7F303]">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Listo para probar tu flujo sin enviar correos ni notificaciones
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mt-1">
                Selecciona arriba un escenario rápido (o usa los datos reales en vivo de tu empresa) y pulsa el botón <strong>▶ Dar Play al Flujo</strong> para ver la respuesta exacta y la traza nodo por nodo.
              </p>
            </div>
            <ExpandableButton
              size="md"
              variant="emerald"
              icon={<Play className="w-4 h-4 fill-current" />}
              label="Dar Play al Flujo (Sin Enviar Salidas)"
              onClick={onRunSimulation}
            />
          </div>
        )}

        {/* ─── PESTAÑA 1: RESPUESTA FINAL DEL FLUJO (VISTA PREVIA) ─── */}
        {!running && result && activeTab === 'response' && (
          <div className="space-y-3 min-w-0">
            {/* Banner superior obligatorio de confirmación */}
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#C7F303] shrink-0" />
                ✅ Esta es la respuesta exacta que producirá tu flujo al final. Ningún correo ni notificación externa fue enviado.
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowRawMarkdown((v) => !v)}
                  className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800 border border-emerald-500/30 text-[10.5px] font-extrabold text-emerald-800 dark:text-[#C7F303] flex items-center gap-1 hover:bg-white transition"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  {showRawMarkdown ? 'Ver Vista Formateada' : 'Ver Markdown Puro'}
                </button>
              </div>
            </div>

            {/* ─── CAMPO APARTE DEDICADO: CERTIFICADOS Y ARCHIVOS DESCARGADOS (FUERA DEL MENSAJE DEL AGENTE IA) ─── */}
            {capturedEvidences.length > 0 && (
              <div
                id="wappy-sandbox-evidences-box"
                className="rounded-2xl border-2 border-[#0D9488]/60 dark:border-teal-400/50 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent p-3.5 sm:p-4 space-y-3 min-w-0 max-w-full shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-teal-900 dark:text-teal-200 truncate">
                        📎 Certificados y Archivos Descargados ({capturedEvidences.length})
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                        Campo aparte para abrir o descargar soportes sin saturar el mensaje ejecutivo del Agente IA.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {/* Selector Vista Compacta de Filas vs Vista de Tarjetas con Miniatura */}
                    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-teal-500/30">
                      <button
                        type="button"
                        onClick={() => setResponseEvidenceLayout('compact')}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                          responseEvidenceLayout === 'compact'
                            ? 'bg-teal-500/15 text-teal-800 dark:text-[#C7F303] border border-teal-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Vista compacta de filas (ideal cuando hay varios certificados)"
                      >
                        <List className="w-3.5 h-3.5 shrink-0" />
                        <span>Filas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setResponseEvidenceLayout('cards')}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                          responseEvidenceLayout === 'cards'
                            ? 'bg-teal-500/15 text-teal-800 dark:text-[#C7F303] border border-teal-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Vista de tarjetas con miniatura grande"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                        <span>Tarjetas</span>
                      </button>
                    </div>

                    <ExpandableButton
                      type="button"
                      size="sm"
                      variant="emerald"
                      icon={<ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                      badge={capturedEvidences.length}
                      label="Ver todos en pestaña Archivos"
                      title="Abrir todos los certificados y archivos en su pestaña dedicada"
                      onClick={() => setActiveTab('files')}
                    />
                  </div>
                </div>

                {responseEvidenceLayout === 'compact' ? (
                  /* ─── VISTA COMPACTA DE FILAS (Súper limpia y escaneable sin ocupar media pantalla) ─── */
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 max-h-[270px] overflow-y-auto pr-0.5 min-w-0">
                    {capturedEvidences.map((ev, evIdx) => {
                      const dlHref =
                        ev.pdfDownloadUrl ||
                        ev.pdfUrl ||
                        ev.imageDownloadUrl ||
                        ev.imageUrl ||
                        '';
                      const dlName = ev.pdfFileName || ev.imageFileName || null;
                      return (
                        <div
                          key={`comp_ev_${evIdx}_${ev.pdfUrl || ev.imageUrl || evIdx}`}
                          className="rounded-xl border border-teal-500/30 bg-white/95 dark:bg-slate-900/95 p-2.5 flex items-center justify-between gap-2.5 hover:border-teal-500/60 transition min-w-0"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {ev.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => onOpenEvidence?.(ev, 'image')}
                                className="w-11 h-11 rounded-lg overflow-hidden border border-teal-500/30 bg-slate-100 dark:bg-slate-800 shrink-0 cursor-zoom-in"
                                title="Ampliar certificado en HD"
                              >
                                <img
                                  src={ev.imageUrl}
                                  alt={ev.workerName || ev.title || 'Certificado'}
                                  className="w-full h-full object-cover object-top bg-white"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenEvidence?.(ev, 'pdf')}
                                className="w-11 h-11 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 cursor-pointer"
                                title="Abrir visor PDF"
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {ev.workerName || 'Colaborador / Registro Verificado'}
                              </div>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[10px]">
                                {ev.cedula && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                    CC {ev.cedula}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/30 font-extrabold text-teal-700 dark:text-teal-300 truncate max-w-[180px]">
                                  🏛️ {ev.portal || ev.title || 'Portal Oficial'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="teal"
                              icon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                              label="Vista Previa"
                              title="Ver certificado en modal ampliado"
                              onClick={() => onOpenEvidence?.(ev, ev.imageUrl ? 'image' : 'pdf')}
                            />
                            {ev.pdfUrl && (
                              <ExpandableButton
                                type="button"
                                size="sm"
                                variant="cyan"
                                icon={<FileText className="w-3.5 h-3.5 shrink-0" />}
                                label="Visor PDF"
                                title="Abrir PDF en el visor modal o pestaña nueva"
                                onClick={() => onOpenEvidence?.(ev, 'pdf')}
                              />
                            )}
                            {dlHref && (
                              <ExpandableButton
                                type="button"
                                size="sm"
                                variant="emerald"
                                icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                                label="Descargar"
                                title="Descargar archivo oficial (.pdf / .png)"
                                onClick={() => triggerDirectFileDownload(dlHref, dlName)}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ─── VISTA DE TARJETAS CON MINIATURA GRANDE ─── */
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0">
                    {capturedEvidences.map((ev, evIdx) => {
                      const dlHref =
                        ev.pdfDownloadUrl ||
                        ev.pdfUrl ||
                        ev.imageDownloadUrl ||
                        ev.imageUrl ||
                        '';
                      const dlName = ev.pdfFileName || ev.imageFileName || null;
                      return (
                        <div
                          key={`gal_ev_${evIdx}_${ev.pdfUrl || ev.imageUrl || evIdx}`}
                          className="group/evcard rounded-2xl border border-teal-500/30 bg-white/95 dark:bg-slate-900/95 p-3 flex flex-col justify-between gap-2.5 shadow-xs hover:border-teal-500/60 hover:shadow-md transition-all min-w-0"
                        >
                          <div className="space-y-2.5 min-w-0">
                            {ev.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => onOpenEvidence?.(ev, 'image')}
                                className="group/thumb relative w-full h-36 sm:h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-zoom-in block text-left"
                                title="Haz clic para abrir el Certificado en pantalla ampliada (HD)"
                              >
                                <img
                                  src={ev.imageUrl}
                                  alt={ev.title || ev.workerName || 'Certificado Oficial'}
                                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/thumb:scale-105 bg-white"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <span className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-slate-950/80 text-white text-[10px] font-extrabold flex items-center gap-1 backdrop-blur-xs opacity-90 group-hover/thumb:opacity-100 transition-opacity">
                                  <ZoomIn className="w-3 h-3 text-[#C7F303]" />
                                  Ver Certificado HD
                                </span>
                                {ev.pdfUrl && (
                                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white text-[9.5px] font-black shadow-xs">
                                    PDF + PNG
                                  </span>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenEvidence?.(ev, 'pdf')}
                                className="w-full h-36 sm:h-40 rounded-xl border border-dashed border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10 flex flex-col items-center justify-center gap-2 p-3 text-center cursor-pointer transition-colors"
                                title="Haz clic para abrir el Visor de PDF Oficial"
                              >
                                <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300 flex items-center justify-center">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="text-xs font-extrabold text-teal-800 dark:text-teal-200 line-clamp-2">
                                  {ev.pdfFileName || ev.title || 'Certificado PDF Oficial'}
                                </div>
                                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Clic para previsualizar PDF
                                </span>
                              </button>
                            )}

                            <div className="space-y-1 min-w-0">
                              <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {ev.workerName || 'Colaborador / Registro Verificado'}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                {ev.cedula && (
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
                                    CC {ev.cedula}
                                  </span>
                                )}
                                {ev.portal && (
                                  <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30 font-extrabold text-teal-700 dark:text-teal-300 truncate max-w-full">
                                    🏛️ {ev.portal}
                                  </span>
                                )}
                              </div>
                              {ev.title && (
                                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 line-clamp-2 leading-snug">
                                  {ev.title}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="teal"
                              icon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                              label="Vista Previa"
                              title="Abrir certificado en modal ampliado"
                              onClick={() => onOpenEvidence?.(ev, ev.imageUrl ? 'image' : 'pdf')}
                            />
                            {ev.pdfUrl && (
                              <ExpandableButton
                                type="button"
                                size="sm"
                                variant="cyan"
                                icon={<FileText className="w-3.5 h-3.5 shrink-0" />}
                                label="Visor PDF"
                                title="Previsualizar PDF en modal"
                                onClick={() => onOpenEvidence?.(ev, 'pdf')}
                              />
                            )}
                            {dlHref && (
                              <ExpandableButton
                                type="button"
                                size="sm"
                                variant="emerald"
                                icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                                label="Descargar"
                                title="Descargar archivo oficial (.pdf / .png)"
                                onClick={() => triggerDirectFileDownload(dlHref, dlName)}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Selector / Tarjetas de Agentes IA cuando hay 1 o múltiples Agentes IA en el flujo */}
            {agentOutputs.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  {agentOutputs.length > 1
                    ? `Orquestación Multi-Agente IA (${agentOutputs.length} Agentes ejecutados en cadena):`
                    : 'Agente IA Ejecutado en la Simulación:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {agentOutputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAgentIdx(-1)}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                        selectedAgentIdx === -1
                          ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-700 dark:text-[#C7F303]">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          Respuesta Final Consolidada
                        </div>
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-[#C7F303]">
                          Dictamen unificado de los {agentOutputs.length} Agentes IA
                        </div>
                      </div>
                    </button>
                  )}

                  {agentOutputs.map((ag, idx) => {
                    const avatarInfo = getRotatedAgentAvatar(idx, ag.avatarSrc);
                    const isSelected =
                      agentOutputs.length === 1 ? true : selectedAgentIdx === idx;
                    return (
                      <button
                        key={ag.agentKey || `ag_${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedAgentIdx(idx);
                          if (ag.agentKey) {
                            onSelectStepNode(ag.agentKey);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-purple-500/10 border-purple-500 ring-1 ring-purple-500/30'
                            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:to-purple-950/90 border border-emerald-200 dark:border-purple-800 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={ag.avatarSrc || avatarInfo.src}
                            alt={ag.avatarName || avatarInfo.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/assets/tenshi.png';
                            }}
                            className="w-10 h-10 object-contain drop-shadow-sm"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {ag.agentName || `Agente IA #${idx + 1}`}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/15 text-purple-700 dark:text-purple-300 shrink-0">
                              {ag.durationMs ? `${(ag.durationMs / 1000).toFixed(1)}s` : `#${idx + 1}`}
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 truncate">
                            {ag.roleLabel || avatarInfo.roleHint} · {ag.modelUsed || result.modelUsed}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visor de la Respuesta Ejecutiva (Consolidada o del Agente seleccionado, libre de ruido de certificados) */}
            {(() => {
              const selectedAgent =
                selectedAgentIdx >= 0 && agentOutputs[selectedAgentIdx]
                  ? agentOutputs[selectedAgentIdx]
                  : null;
              const rawActiveMarkdown = selectedAgent
                ? selectedAgent.responseMarkdown || finalMarkdown
                : finalMarkdown;
              const activeMarkdown =
                capturedEvidences.length > 0
                  ? stripNoiseEvidencesFromAgentResponse(rawActiveMarkdown)
                  : rawActiveMarkdown;
              const activeHtml = selectedAgent
                ? activeMarkdown
                  ? renderWorkflowMarkdownToInteractiveHtml(activeMarkdown)
                  : selectedAgent.responseHtml?.trim()
                    ? renderWorkflowMarkdownToInteractiveHtml(
                        capturedEvidences.length > 0
                          ? stripNoiseEvidencesFromAgentResponse(selectedAgent.responseHtml)
                          : selectedAgent.responseHtml,
                      )
                    : '<p>Sin respuesta disponible.</p>'
                : activeMarkdown
                  ? renderWorkflowMarkdownToInteractiveHtml(activeMarkdown)
                  : result?.finalResponseHtml?.trim()
                    ? renderWorkflowMarkdownToInteractiveHtml(
                        capturedEvidences.length > 0
                          ? stripNoiseEvidencesFromAgentResponse(result.finalResponseHtml)
                          : result.finalResponseHtml,
                      )
                    : '<p>Sin respuesta disponible.</p>';

              return (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-5 shadow-inner max-h-[520px] overflow-y-auto min-w-0 max-w-full">
                  {showRawMarkdown ? (
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200 leading-relaxed">
                      {activeMarkdown || 'Sin respuesta disponible.'}
                    </pre>
                  ) : (
                    <div
                      onClick={(e) =>
                        handleEvidenceContainerClick(e, capturedEvidences, onOpenEvidence)
                      }
                      className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_th]:bg-slate-100 dark:[&_th]:bg-slate-800 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 [&_td]:p-2 [&_h1]:text-base [&_h1]:font-black [&_h2]:text-sm [&_h2]:font-extrabold [&_h3]:text-xs [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{ __html: activeHtml }}
                    />
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ─── PESTAÑA DEDICADA: ARCHIVOS / CERTIFICADOS DESCARGADOS ─── */}
        {!running && activeTab === 'files' && (
          <div className="space-y-3 min-w-0 max-w-full">
            {capturedEvidences.length === 0 ? (
              <div className="py-10 px-4 rounded-2xl border border-dashed border-teal-500/40 bg-teal-500/5 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300">
                  <Paperclip className="w-6 h-6" />
                </div>
                <div className="max-w-lg space-y-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Aún no hay certificados o archivos descargados en esta corrida
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Cuando tu flujo ejecute nodos de Web Scraping oficial (como <strong>MinTrabajo Alturas y Confinados</strong>, <strong>SENA SOFIA Plus</strong>, <strong>ARL</strong>, <strong>Contraloría</strong>, <strong>Procuraduría</strong>, <strong>SIMIT</strong> o <strong>Porvenir</strong>) y encuentre certificados vigentes, aparecerán aquí separados del mensaje del Agente IA listos para ver en HD o descargar en PDF.
                  </p>
                </div>
                {!result && (
                  <ExpandableButton
                    size="sm"
                    variant="emerald"
                    icon={<Play className="w-3.5 h-3.5 fill-current" />}
                    label="Dar Play al Flujo para Buscar Certificados"
                    onClick={onRunSimulation}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-3 min-w-0 max-w-full">
                {/* Barra superior de la pestaña Archivos: Resumen + Buscador rápido (> 4 ítems) + Selector Galería/Lista */}
                <div className="rounded-2xl border border-teal-500/35 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-3.5 flex flex-wrap items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-black text-teal-900 dark:text-teal-200 truncate">
                        📎 {capturedEvidences.length}{' '}
                        {capturedEvidences.length === 1
                          ? 'Certificado / Archivo Oficial Descargado'
                          : 'Certificados y Archivos Oficiales Descargados'}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                        Haz clic en cualquier certificado para abrir el visor HD/PDF o descargarlo directamente a tu equipo.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(capturedEvidences.length > 4 || evidenceSearchQuery.trim() !== '') && (
                      <div className="relative min-w-[210px] sm:min-w-[250px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={evidenceSearchQuery}
                          onChange={(e) => setEvidenceSearchQuery(e.target.value)}
                          placeholder="Buscar por nombre, CC o entidad..."
                          className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-teal-500/30 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                        />
                        {evidenceSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setEvidenceSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-teal-500/30">
                      <button
                        type="button"
                        onClick={() => setFilesTabLayout('cards')}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                          filesTabLayout === 'cards'
                            ? 'bg-teal-500/15 text-teal-800 dark:text-[#C7F303] border border-teal-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                        <span>Galería</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilesTabLayout('compact')}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                          filesTabLayout === 'compact'
                            ? 'bg-teal-500/15 text-teal-800 dark:text-[#C7F303] border border-teal-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <List className="w-3.5 h-3.5 shrink-0" />
                        <span>Lista</span>
                      </button>
                    </div>
                  </div>
                </div>

                {filteredEvidences.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                    Ningún certificado coincide con la búsqueda «{evidenceSearchQuery}».
                  </div>
                ) : filesTabLayout === 'compact' ? (
                  <div className="space-y-2 min-w-0">
                    {filteredEvidences.map((ev, evIdx) => {
                      const dlHref =
                        ev.pdfDownloadUrl ||
                        ev.pdfUrl ||
                        ev.imageDownloadUrl ||
                        ev.imageUrl ||
                        '#';
                      const dlName = ev.pdfFileName || ev.imageFileName || true;
                      return (
                        <div
                          key={`files_row_${evIdx}_${ev.pdfUrl || ev.imageUrl || evIdx}`}
                          className="rounded-2xl border border-teal-500/30 bg-white dark:bg-slate-950 p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 hover:border-teal-500/60 transition min-w-0"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {ev.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => onOpenEvidence?.(ev, 'image')}
                                className="w-12 h-12 rounded-xl overflow-hidden border border-teal-500/30 bg-slate-100 dark:bg-slate-800 shrink-0 cursor-zoom-in"
                                title="Ver certificado en HD"
                              >
                                <img
                                  src={ev.imageUrl}
                                  alt={ev.workerName || ev.title || 'Certificado'}
                                  className="w-full h-full object-cover object-top bg-white"
                                />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenEvidence?.(ev, 'pdf')}
                                className="w-12 h-12 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 cursor-pointer"
                                title="Abrir visor PDF"
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                                {ev.workerName || 'Colaborador / Registro Verificado'}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10.5px]">
                                {ev.cedula && (
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
                                    CC {ev.cedula}
                                  </span>
                                )}
                                {ev.portal && (
                                  <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30 font-extrabold text-teal-700 dark:text-teal-300 truncate max-w-[260px]">
                                    🏛️ {ev.portal}
                                  </span>
                                )}
                                {ev.title && (
                                  <span className="text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[300px]">
                                    · {ev.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="teal"
                              icon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                              label="Ver Certificado"
                              title="Abrir certificado en modal ampliado"
                              onClick={() => onOpenEvidence?.(ev, ev.imageUrl ? 'image' : 'pdf')}
                            />
                            {ev.pdfUrl && (
                              <ExpandableButton
                                type="button"
                                size="sm"
                                variant="cyan"
                                icon={<FileText className="w-3.5 h-3.5 shrink-0" />}
                                label="Abrir PDF"
                                title="Abrir PDF en el visor modal"
                                onClick={() => onOpenEvidence?.(ev, 'pdf')}
                              />
                            )}
                            {dlHref && dlHref !== '#' && (
                              <ExpandableButton
                                type="button"
                                size="sm"
                                variant="emerald"
                                icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                                label={
                                  ev.pdfUrl || ev.pdfDownloadUrl ? 'Descargar PDF' : 'Descargar'
                                }
                                title="Descargar soporte oficial (.pdf / .png)"
                                onClick={() =>
                                  triggerDirectFileDownload(
                                    dlHref,
                                    typeof dlName === 'string' ? dlName : null,
                                  )
                                }
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0">
                    {filteredEvidences.map((ev, evIdx) => {
                      const dlHref =
                        ev.pdfDownloadUrl ||
                        ev.pdfUrl ||
                        ev.imageDownloadUrl ||
                        ev.imageUrl ||
                        '#';
                      const dlName = ev.pdfFileName || ev.imageFileName || true;
                      return (
                        <div
                          key={`files_card_${evIdx}_${ev.pdfUrl || ev.imageUrl || evIdx}`}
                          className="group/evcard rounded-2xl border border-teal-500/30 bg-white dark:bg-slate-950 p-3.5 flex flex-col justify-between gap-3 shadow-xs hover:border-teal-500/60 hover:shadow-md transition-all min-w-0"
                        >
                          <div className="space-y-2.5 min-w-0">
                            {ev.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => onOpenEvidence?.(ev, 'image')}
                                className="group/thumb relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 cursor-zoom-in block text-left"
                                title="Haz clic para abrir el Certificado en pantalla ampliada (HD)"
                              >
                                <img
                                  src={ev.imageUrl}
                                  alt={ev.title || ev.workerName || 'Certificado Oficial'}
                                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/thumb:scale-105 bg-white"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <span className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-slate-950/80 text-white text-[10px] font-extrabold flex items-center gap-1 backdrop-blur-xs opacity-90 group-hover/thumb:opacity-100 transition-opacity">
                                  <ZoomIn className="w-3 h-3 text-[#C7F303]" />
                                  Ver Certificado HD
                                </span>
                                {ev.pdfUrl && (
                                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white text-[9.5px] font-black shadow-xs">
                                    PDF + PNG
                                  </span>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenEvidence?.(ev, 'pdf')}
                                className="w-full h-44 rounded-xl border border-dashed border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10 flex flex-col items-center justify-center gap-2 p-3 text-center cursor-pointer transition-colors"
                                title="Haz clic para abrir el Visor de PDF Oficial"
                              >
                                <div className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-300 flex items-center justify-center">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="text-xs font-extrabold text-teal-800 dark:text-teal-200 line-clamp-2">
                                  {ev.pdfFileName || ev.title || 'Certificado PDF Oficial'}
                                </div>
                                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Clic para previsualizar PDF
                                </span>
                              </button>
                            )}

                            <div className="space-y-1 min-w-0">
                              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                                {ev.workerName || 'Colaborador / Registro Verificado'}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                {ev.cedula && (
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300">
                                    CC {ev.cedula}
                                  </span>
                                )}
                                {ev.portal && (
                                  <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/30 font-extrabold text-teal-700 dark:text-teal-300 truncate max-w-full">
                                    🏛️ {ev.portal}
                                  </span>
                                )}
                              </div>
                              {ev.title && (
                                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 line-clamp-2 leading-snug">
                                  {ev.title}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                            <ExpandableButton
                              type="button"
                              size="sm"
                              variant="teal"
                              icon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                              label="Ver Certificado"
                              title="Abrir certificado en modal ampliado"
                              onClick={() => onOpenEvidence?.(ev, ev.imageUrl ? 'image' : 'pdf')}
                            />
                            {ev.pdfUrl && (
                              <ExpandableButton
                                type="button"
                                size="sm"
                                variant="cyan"
                                icon={<FileText className="w-3.5 h-3.5 shrink-0" />}
                                label="Abrir PDF"
                                title="Abrir PDF en el visor modal"
                                onClick={() => onOpenEvidence?.(ev, 'pdf')}
                              />
                            )}
                            {dlHref && dlHref !== '#' && (
                              <ExpandableButton
                                type="button"
                                size="sm"
                                variant="emerald"
                                icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                                label={
                                  ev.pdfUrl || ev.pdfDownloadUrl ? 'Descargar PDF' : 'Descargar'
                                }
                                title="Descargar soporte oficial (.pdf / .png)"
                                onClick={() =>
                                  triggerDirectFileDownload(
                                    dlHref,
                                    typeof dlName === 'string' ? dlName : null,
                                  )
                                }
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── PESTAÑA 2: TRAZA NODO POR NODO ─── */}
        {!running && result && activeTab === 'trace' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Columna izquierda: Lista de pasos ejecutados */}
            <div className="lg:col-span-5 space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
              {nodeTrace.map((step, idx) => {
                const isSelected = selectedTraceIdx === idx;
                const isBlockedOutput =
                  step.status === 'simulated_blocked' ||
                  step.category === 'output' ||
                  step.stage === 'outputs';
                return (
                  <button
                    key={`${step.nodeKey || step.nodeId}_${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedTraceIdx(idx);
                      onSelectStepNode(step.nodeKey || step.nodeId);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-500/15 dark:bg-[#C7F303]/15 border-emerald-500 dark:border-[#C7F303] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white dark:bg-[#C7F303] dark:text-[#0E1300] text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {step.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>⏱️ {step.durationMs || 0} ms</span>
                          {typeof step.recordsCount === 'number' && (
                            <span>· 📊 {step.recordsCount} reg.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-extrabold shrink-0 border ${
                        isBlockedOutput
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {isBlockedOutput ? '🛡️ Simulado' : '✓ Listo'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Columna derecha: Detalle del nodo seleccionado */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-4 space-y-3 min-w-0">
              {currentTraceStep ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-[#C7F303]">
                        Paso #{selectedTraceIdx + 1} · {currentTraceStep.stage || currentTraceStep.category || 'Nodo del Flujo'}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {currentTraceStep.title}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      ⏱️ Duración ({currentTraceStep.durationMs || 0} ms)
                    </span>
                  </div>

                  {/* Entrada */}
                  <div>
                    <div className="text-[10.5px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      📥 Contexto de Entrada
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {currentTraceStep.inputContext?.trim() ||
                        'Entrada recibida del paso anterior del lienzo WAPPY.'}
                    </div>
                  </div>

                  {/* Campos quirúrgicos */}
                  <div>
                    <div className="text-[10.5px] font-extrabold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      🎯 Campos Quirúrgicos / Filtros Aplicados
                    </div>
                    {Array.isArray(currentTraceStep.surgicalFields) &&
                    currentTraceStep.surgicalFields.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentTraceStep.surgicalFields.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-[10.5px] font-bold"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Lectura estándar completa del nodo ({currentTraceStep.recordsCount ?? 0} registros reales leídos).
                      </div>
                    )}
                  </div>

                  {/* Evidencias capturadas en este paso específico */}
                  {(() => {
                    const stepEvs = collectUniqueScraperEvidences([currentTraceStep]);
                    if (stepEvs.length === 0) return null;
                    return (
                      <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-2.5 space-y-2">
                        <div className="text-[10.5px] font-extrabold uppercase text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          📎 Certificados / Soportes Capturados en este Paso ({stepEvs.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {stepEvs.map((ev, sIdx) => (
                            <div
                              key={`trace_ev_${sIdx}`}
                              className="inline-flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-teal-500/30 bg-white dark:bg-slate-900 text-xs"
                            >
                              {ev.imageUrl && (
                                <img
                                  src={ev.imageUrl}
                                  alt={ev.workerName || 'Certificado'}
                                  onClick={() => onOpenEvidence?.(ev, 'image')}
                                  className="w-8 h-8 rounded-lg object-cover border border-teal-500/30 cursor-zoom-in shrink-0 bg-white"
                                />
                              )}
                                <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100 max-w-[160px] truncate">
                                  {ev.workerName || ev.cedula || ev.title || `Soporte #${sIdx + 1}`}
                                </span>
                                <ExpandableButton
                                  type="button"
                                  size="sm"
                                  variant="teal"
                                  icon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                                  label="Vista Previa"
                                  title="Ver soporte en modal ampliado"
                                  onClick={() => onOpenEvidence?.(ev, ev.imageUrl ? 'image' : 'pdf')}
                                />
                                {(ev.pdfDownloadUrl || ev.pdfUrl || ev.imageDownloadUrl || ev.imageUrl) && (
                                  <ExpandableButton
                                    type="button"
                                    size="sm"
                                    variant="emerald"
                                    icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                                    label="Descargar"
                                    title="Descargar soporte oficial"
                                    onClick={() =>
                                      triggerDirectFileDownload(
                                        ev.pdfDownloadUrl ||
                                          ev.pdfUrl ||
                                          ev.imageDownloadUrl ||
                                          ev.imageUrl,
                                        ev.pdfFileName || ev.imageFileName || null,
                                      )
                                    }
                                  />
                                )}
                              </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Vista previa de salida (con soporte Markdown interactivo para enlaces/imágenes de evidencias) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10.5px] font-extrabold uppercase text-slate-500 dark:text-slate-400">
                        📤 Vista Previa de Salida entregada al siguiente nodo
                      </span>
                      {typeof currentTraceStep.recordsCount === 'number' && (
                        <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400">
                          {currentTraceStep.recordsCount} registros reales leídos
                        </span>
                      )}
                    </div>
                    {(() => {
                      const rawPreviewText =
                        currentTraceStep.outputPreview?.trim() ||
                        currentTraceStep.details?.trim() ||
                        'Paso completado y transmitido al siguiente nodo.';
                      const hasRichMarkdown =
                        rawPreviewText.includes('/api/sgsst/automatizaciones/evidencias/') ||
                        /\[[^\]]+\]\([^)]+\)/.test(rawPreviewText) ||
                        /^\|.+\|$/m.test(rawPreviewText);
                      if (hasRichMarkdown) {
                        return (
                          <div
                            onClick={(e) =>
                              handleEvidenceContainerClick(e, capturedEvidences, onOpenEvidence)
                            }
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 max-h-[260px] overflow-y-auto"
                            dangerouslySetInnerHTML={{
                              __html: renderWorkflowMarkdownToInteractiveHtml(rawPreviewText),
                            }}
                          />
                        );
                      }
                      return (
                        <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[210px] overflow-y-auto">
                          {rawPreviewText}
                        </pre>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500">Selecciona un nodo de la lista izquierda para inspeccionar su traza.</div>
              )}
            </div>
          </div>
        )}

        {/* ─── PESTAÑA 3: SALIDAS INTERCEPTADAS (SIN ENVIAR) ─── */}
        {!running && result && activeTab === 'outputs' && (
          <div className="space-y-4">
            {/* 1. Vista Previa de Correo (Bitácora a Gmail) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Vista Previa de Correo (Bitácora a Gmail)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                  🔒 BLOQUEADO EN MODO DESARROLLO (NO ENVIADO)
                </span>
              </div>
              <div className="p-4 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-slate-500">De:</span>{' '}
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {emailPreview.from || 'notificaciones@wappy.club'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500">Para:</span>{' '}
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {emailPreview.recipients.join(', ')}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-bold text-slate-500">Asunto:</span>{' '}
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {emailPreview.subject}
                    </span>
                  </div>
                </div>
                <div
                  onClick={(e) =>
                    handleEvidenceContainerClick(e, capturedEvidences, onOpenEvidence)
                  }
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 max-h-[260px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: renderWorkflowMarkdownToInteractiveHtml(
                      emailPreview.htmlBody || finalHtml,
                    ),
                  }}
                />
              </div>
            </div>

            {/* 2. Vista Previa de Notificación WAPPY y Chat de Tenshi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-purple-500" />
                    Notificación en WAPPY y Chat de Tenshi
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[9.5px] font-black">
                    🛡️ Simulado
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  <img
                    src="/assets/tenshi.png"
                    alt="Tenshi IA"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/tenshi.png';
                    }}
                    className="w-10 h-10 object-contain shrink-0"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {notificationPreview.title}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap line-clamp-5">
                      {notificationPreview.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Vista Previa de Impacto en Hitos SST y ACPM */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-teal-500" />
                    Impacto en Hitos SST y ACPM
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-black">
                    BD Protegida
                  </span>
                </div>
                {hitoImpacts.length > 0 ? (
                  <div className="space-y-2">
                    {hitoImpacts.map((h, i) => (
                      <div
                        key={`${h.nodeId}_${i}`}
                        className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/20 text-xs"
                      >
                        <div className="font-extrabold text-teal-800 dark:text-teal-300">
                          🛡️ {h.title}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {h.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    {result.interceptedOutputs?.acpmPreview?.summary ||
                      'Ningún registro de Hitos SST ni tarea ACPM fue alterado durante esta corrida en Modo Desarrollo.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── PESTAÑA 4: ENTRADA DE PRUEBA (MOCK) ─── */}
        {activeTab === 'mock' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Personaliza aquí el mensaje, evento o payload JSON/texto con el que deseas poner a prueba tu flujo antes de volver a pulsar <strong>▶ Dar Play</strong>. Si lo dejas en blanco, el flujo se probará únicamente con los registros reales actuales de tu empresa en MongoDB.
            </div>
            <textarea
              rows={5}
              value={mockTriggerInput}
              onChange={(e) => onChangeMockTriggerInput(e.target.value)}
              placeholder="Escribe o pega aquí el texto de prueba (ej. un correo entrante con incapacidad, un reporte QR de peligro crítico o un caso específico que quieras evaluar)..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                {mockTriggerInput.trim()
                  ? `🧪 Usando entrada simulada (${mockTriggerInput.length} caracteres)`
                  : '🟢 Usando exclusivamente Datos Reales en Vivo de tu Empresa Activa'}
              </span>
              <div className="flex items-center gap-2">
                {mockTriggerInput && (
                  <ExpandableButton
                    size="sm"
                    variant="amber"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    label="Restablecer a Datos Reales en Vivo"
                    onClick={() => onChangeMockTriggerInput('')}
                  />
                )}
                <ExpandableButton
                  size="sm"
                  variant="emerald"
                  disabled={running}
                  icon={<Play className="w-3.5 h-3.5 fill-current" />}
                  label="Dar Play con esta Entrada"
                  onClick={() => {
                    setActiveTab('response');
                    onRunSimulation();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BANDEJA REUTILIZABLE DE CERTIFICADOS Y ARCHIVOS DESCARGADOS + VISOR MODAL
   (Usada en Historial de Ejecuciones Reales / Bitácora de `TareasPage.tsx` y Modales)
   ═══════════════════════════════════════════════════════════════════════════ */

export interface WorkflowEvidenceTrayProps {
  evidences: ScraperCapturedEvidence[];
  onOpenEvidence: (evidence: ScraperCapturedEvidence, preferredMode?: 'image' | 'pdf') => void;
  title?: string;
  subtitle?: string;
  defaultLayout?: 'compact' | 'cards';
  className?: string;
}

export function WorkflowEvidenceTray({
  evidences,
  onOpenEvidence,
  title,
  subtitle = 'Bandeja dedicada para previsualizar en modal o descargar certificados (.PDF / .PNG) sin meter ruido visual en el informe.',
  defaultLayout = 'compact',
  className = '',
}: WorkflowEvidenceTrayProps) {
  const [layout, setLayout] = useState<'compact' | 'cards'>(defaultLayout);
  const safeEvidences = Array.isArray(evidences) ? evidences : [];
  if (safeEvidences.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border-2 border-[#0D9488]/60 dark:border-teal-400/50 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent p-3.5 sm:p-4 space-y-3 min-w-0 max-w-full shadow-xs ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
            <Paperclip className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-teal-900 dark:text-teal-200 truncate">
              {title || `📎 Certificados y Soportes Descargados (${safeEvidences.length})`}
            </h4>
            {subtitle && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-teal-500/30 shrink-0">
          <button
            type="button"
            onClick={() => setLayout('compact')}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
              layout === 'compact'
                ? 'bg-teal-500/15 text-teal-800 dark:text-[#C7F303] border border-teal-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista compacta de filas"
          >
            <List className="w-3.5 h-3.5 shrink-0" />
            <span>Filas</span>
          </button>
          <button
            type="button"
            onClick={() => setLayout('cards')}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
              layout === 'cards'
                ? 'bg-teal-500/15 text-teal-800 dark:text-[#C7F303] border border-teal-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista de tarjetas con miniatura"
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>Tarjetas</span>
          </button>
        </div>
      </div>

      {layout === 'compact' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-0.5 min-w-0">
          {safeEvidences.map((ev, idx) => {
            const dlHref =
              ev.pdfDownloadUrl || ev.pdfUrl || ev.imageDownloadUrl || ev.imageUrl || '';
            const dlName = ev.pdfFileName || ev.imageFileName || null;
            return (
              <div
                key={`tray_comp_${idx}_${ev.pdfUrl || ev.imageUrl || idx}`}
                className="rounded-xl border border-teal-500/30 bg-white/95 dark:bg-slate-900/95 p-2.5 flex items-center justify-between gap-2.5 hover:border-teal-500/60 transition min-w-0"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {ev.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(ev, 'image')}
                      className="w-11 h-11 rounded-lg overflow-hidden border border-teal-500/30 bg-slate-100 dark:bg-slate-800 shrink-0 cursor-zoom-in"
                      title="Ampliar certificado en HD"
                    >
                      <img
                        src={ev.imageUrl}
                        alt={ev.workerName || ev.title || 'Certificado'}
                        className="w-full h-full object-cover object-top bg-white"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(ev, 'pdf')}
                      className="w-11 h-11 rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 cursor-pointer"
                      title="Abrir visor PDF"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {ev.workerName?.trim() || ev.title || 'Colaborador / Soporte Oficial'}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[10px]">
                      {ev.cedula && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          CC {ev.cedula}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/30 font-extrabold text-teal-700 dark:text-teal-300 truncate max-w-[180px]">
                        🏛️ {ev.portal || ev.title || 'Portal Oficial'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  <ExpandableButton
                    type="button"
                    size="sm"
                    variant="teal"
                    icon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                    label="Vista Previa"
                    title="Abrir vista previa en modal"
                    onClick={() => onOpenEvidence(ev, ev.imageUrl ? 'image' : 'pdf')}
                  />
                  {ev.pdfUrl && (
                    <ExpandableButton
                      type="button"
                      size="sm"
                      variant="cyan"
                      icon={<FileText className="w-3.5 h-3.5 shrink-0" />}
                      label="Visor PDF"
                      title="Previsualizar PDF en modal"
                      onClick={() => onOpenEvidence(ev, 'pdf')}
                    />
                  )}
                  {dlHref && (
                    <ExpandableButton
                      type="button"
                      size="sm"
                      variant="emerald"
                      icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                      label="Descargar"
                      title="Descargar archivo oficial (.pdf / .png)"
                      onClick={() => triggerDirectFileDownload(dlHref, dlName)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0">
          {safeEvidences.map((ev, idx) => {
            const dlHref =
              ev.pdfDownloadUrl || ev.pdfUrl || ev.imageDownloadUrl || ev.imageUrl || '';
            const dlName = ev.pdfFileName || ev.imageFileName || null;
            return (
              <div
                key={`tray_card_${idx}_${ev.pdfUrl || ev.imageUrl || idx}`}
                className="group/evcard rounded-2xl border border-teal-500/30 bg-white/95 dark:bg-slate-900/95 p-3 flex flex-col justify-between gap-2.5 shadow-xs hover:border-teal-500/60 hover:shadow-md transition-all min-w-0"
              >
                <div className="space-y-2.5 min-w-0">
                  {ev.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(ev, 'image')}
                      className="group/thumb relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-zoom-in block text-left"
                    >
                      <img
                        src={ev.imageUrl}
                        alt={ev.title || ev.workerName || 'Certificado Oficial'}
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/thumb:scale-105 bg-white"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-slate-950/80 text-white text-[10px] font-extrabold flex items-center gap-1 backdrop-blur-xs">
                        <ZoomIn className="w-3 h-3 text-[#C7F303]" />
                        Ver HD
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenEvidence(ev, 'pdf')}
                      className="w-full h-36 rounded-xl border border-dashed border-teal-500/40 bg-teal-500/5 hover:bg-teal-500/10 flex flex-col items-center justify-center gap-2 p-3 text-center cursor-pointer transition-colors"
                    >
                      <FileText className="w-6 h-6 text-teal-600 dark:text-teal-300" />
                      <div className="text-xs font-extrabold text-teal-800 dark:text-teal-200 line-clamp-2">
                        {ev.pdfFileName || ev.title || 'Certificado PDF Oficial'}
                      </div>
                    </button>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {ev.workerName?.trim() || ev.title || 'Colaborador / Soporte Oficial'}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                      {ev.cedula && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                          CC {ev.cedula}
                        </span>
                      )}
                      {ev.portal && (
                        <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/30 font-extrabold text-teal-700 dark:text-teal-300 truncate max-w-full">
                          🏛️ {ev.portal}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                  <ExpandableButton
                    type="button"
                    size="sm"
                    variant="teal"
                    icon={<Eye className="w-3.5 h-3.5 shrink-0" />}
                    label="Vista Previa"
                    onClick={() => onOpenEvidence(ev, ev.imageUrl ? 'image' : 'pdf')}
                  />
                  {ev.pdfUrl && (
                    <ExpandableButton
                      type="button"
                      size="sm"
                      variant="cyan"
                      icon={<FileText className="w-3.5 h-3.5 shrink-0" />}
                      label="Visor PDF"
                      onClick={() => onOpenEvidence(ev, 'pdf')}
                    />
                  )}
                  {dlHref && (
                    <ExpandableButton
                      type="button"
                      size="sm"
                      variant="emerald"
                      icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                      label="Descargar"
                      onClick={() => triggerDirectFileDownload(dlHref, dlName)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface WorkflowEvidenceLightboxModalProps {
  evidence: ScraperCapturedEvidence | null;
  initialMode?: 'image' | 'pdf';
  onClose: () => void;
}

export function WorkflowEvidenceLightboxModal({
  evidence,
  initialMode,
  onClose,
}: WorkflowEvidenceLightboxModalProps) {
  const [mode, setMode] = useState<'image' | 'pdf'>(
    initialMode || (evidence?.imageUrl ? 'image' : 'pdf'),
  );

  useEffect(() => {
    if (!evidence) return;
    if (initialMode === 'pdf' && evidence.pdfUrl) {
      setMode('pdf');
    } else if (evidence.imageUrl) {
      setMode('image');
    } else {
      setMode('pdf');
    }
  }, [evidence, initialMode]);

  useEffect(() => {
    if (!evidence || typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [evidence, onClose]);

  if (!evidence || typeof document === 'undefined') return null;

  const dlHref =
    evidence.pdfDownloadUrl ||
    evidence.pdfUrl ||
    evidence.imageDownloadUrl ||
    evidence.imageUrl ||
    '';
  const dlName = evidence.pdfFileName || evidence.imageFileName || null;
  const openHref =
    (mode === 'pdf' && evidence.pdfUrl
      ? evidence.pdfUrl
      : evidence.pdfUrl || evidence.imageUrl) || '';

  return createPortal(
    <div
      id="wappy-evidence-lightbox-modal"
      role="dialog"
      aria-modal="true"
      aria-label={evidence.title || 'Visor de Certificado Oficial'}
      className="fixed inset-0 z-[10060] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl border border-teal-500/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative px-3.5 sm:px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-cyan-500/10 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-full">
                  {evidence.workerName?.trim() || evidence.title || 'Certificado Oficial'}
                </h3>
                {evidence.cedula?.trim() && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                    CC {evidence.cedula}
                  </span>
                )}
                {evidence.portal?.trim() && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    🌐 {evidence.portal}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                {[
                  evidence.workerName?.trim() ? evidence.title : '',
                  evidence.cargo?.trim() || '',
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Soporte oficial verificado por WAPPY IA'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {evidence.imageUrl && evidence.pdfUrl && (
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 mr-1">
                <button
                  type="button"
                  onClick={() => setMode('image')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    mode === 'image'
                      ? 'bg-teal-500/15 border border-teal-500/40 text-teal-700 dark:text-teal-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Imagen HD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('pdf')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    mode === 'pdf'
                      ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Visor PDF</span>
                </button>
              </div>
            )}

            {dlHref && (
              <ExpandableButton
                type="button"
                size="sm"
                variant="emerald"
                icon={<Download className="w-3.5 h-3.5 shrink-0" />}
                label={
                  evidence.pdfDownloadUrl || evidence.pdfUrl
                    ? 'Descargar PDF Oficial'
                    : 'Descargar Certificado'
                }
                title="Descargar documento oficial"
                onClick={() => triggerDirectFileDownload(dlHref, dlName)}
              />
            )}

            {openHref && (
              <ExpandableButton
                type="button"
                size="sm"
                variant="cyan"
                icon={<ExternalLink className="w-3.5 h-3.5 shrink-0" />}
                label="Abrir en pestaña nueva"
                title="Abrir certificado oficial en pestaña nueva"
                onClick={() => window.open(openHref, '_blank', 'noopener,noreferrer')}
              />
            )}

            <ExpandableButton
              type="button"
              size="sm"
              variant="rose"
              icon={<X className="w-3.5 h-3.5 shrink-0" />}
              label="Cerrar"
              title="Cerrar visor (Esc)"
              onClick={onClose}
            />
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 bg-slate-50/70 dark:bg-slate-950/60">
          {evidence.imageUrl && (mode === 'image' || !evidence.pdfUrl) ? (
            <div className="flex flex-col items-center justify-center gap-2.5">
              <img
                src={evidence.imageUrl}
                alt={
                  evidence.workerName
                    ? `Certificado de ${evidence.workerName}`
                    : evidence.title || 'Certificado'
                }
                className="max-h-[72vh] w-auto max-w-full mx-auto rounded-xl border border-teal-500/30 shadow-xl object-contain bg-white"
              />
              {evidence.imageDownloadUrl && evidence.pdfUrl && (
                <ExpandableButton
                  type="button"
                  size="sm"
                  variant="teal"
                  icon={<ImageIcon className="w-3.5 h-3.5 shrink-0" />}
                  label="Descargar captura HD en PNG"
                  onClick={() =>
                    triggerDirectFileDownload(
                      evidence.imageDownloadUrl,
                      evidence.imageFileName || null,
                    )
                  }
                />
              )}
            </div>
          ) : evidence.pdfUrl ? (
            <iframe
              src={evidence.pdfUrl}
              title={evidence.title || 'Visor PDF Certificado Oficial'}
              className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-slate-700 bg-white shadow-inner"
            />
          ) : (
            <div className="p-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
              No se encontró archivo visual adjunto para esta evidencia.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
