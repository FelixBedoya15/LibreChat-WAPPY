'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CanvasSession = require('~/models/CanvasSession');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const PESVWorkspaceSession = require('~/models/PESVWorkspaceSession');
const ChemicalCompatibilitySession = require('~/models/ChemicalCompatibilitySession');
const CompanyInfo = require('~/models/CompanyInfo');
const XLSX = require('xlsx');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { syncCanvasToLiveEditor } = require('./syncBridge');
const {
  exportIPEVARToExcel,
  exportMatrizPESVToExcel,
  exportCompatibilidadToExcel
} = require('./excelGenerator');

async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

function hasHeader(html) {
  if (!html || typeof html !== 'string') return false;
  const lower = html.toLowerCase();
  // A document only has the official WAPPY corporate header (Image 2) when it contains
  // .wappy-standard-header-banner AND does NOT have unreplaced {{empresa_nombre}} template placeholders
  if (lower.includes('{{empresa_nombre}}') || lower.includes('{{empresa_nit}}')) {
    return false;
  }
  return lower.includes('wappy-standard-header-banner');
}

function replaceCompanyVariables(html, companyInfo) {
  if (!html || typeof html !== 'string') return html;
  const ci = companyInfo || {};
  const replacements = {
    '{{empresa_nombre}}': ci.companyName || 'WAPPY LTDA',
    '{{empresa_nit}}': ci.nit || '9014373103',
    '{{representante_legal}}': ci.legalRepresentative || ci.responsibleSST || 'Representante Legal',
    '{{numero_trabajadores}}': String(ci.workerCount || '17'),
    '{{nivel_riesgo}}': ci.riskLevel || 'V',
    '{{arl}}': ci.arl || 'Sura',
    '{{ciudad_domicilio}}': ci.city || 'Medellín',
    '{{departamento}}': ci.departamento || 'Antioquia',
    '{{direccion}}': ci.address || 'Sede Principal',
    '{{tipo_empresa}}': ci.companyType || 'Persona Jurídica',
    '{{actividad_economica}}': ci.economicActivity || 'Actividades Empresariales',
    '{{codigo_ciiu}}': ci.ciiu || '6201',
    '{{orden_jerarquico}}': '1. Gerencia General / Representante Legal · 2. Dirección de Operaciones y SG-SST · 3. Coordinadores de Área · 4. Personal Operativo y Administrativo',
    '{{horarios_trabajo}}': 'Lunes a Viernes de 8:00 a.m. a 5:30 p.m. (Con 1 hora de almuerzo)',
    '{{forma_pago}}': 'Transferencia Bancaria Electrónica',
    '{{periodicidad_pago}}': 'Quincenal / Mensual',
  };
  let out = html;
  for (const [key, val] of Object.entries(replacements)) {
    out = out.split(key).join(val);
  }
  return out;
}

/**
 * Strips any legacy/template fake banner and placeholder company table at the start of a template
 * so buildStandardHeader({ title, companyInfo }) can prepend the official WAPPY header (Image 2).
 */
function stripFakeTemplateHeader(html) {
  if (!html || typeof html !== 'string') return html;
  if (html.includes('wappy-standard-header-banner')) return html;

  let cleaned = html;

  // 1. Remove outer wrapper div if it starts with <div class="rit-document" or <div style="font-family:
  // Actually keep outer wrapper or strip inner fake banner:
  // Pattern A: Template banner comments `<!-- Contenedor del Encabezado...` through the end of `<!-- Tabla Resumen... </table>\s*</div>`
  cleaned = cleaned.replace(
    /<!--\s*Contenedor del Encabezado[\s\S]*?<\/table>\s*<\/div>/i,
    '',
  );

  // Pattern B: Any leading banner div with linear-gradient or solid background-color (#0e7490, #0f766e, #042f2e, etc.) followed by a summary table before the first <h2> or <h3>
  cleaned = cleaned.replace(
    /<div[^>]*style="[^"]*background(?:-color)?:\s*(?:linear-gradient|#0e7490|#0f766e|#042f2e|#4f46e5|#0284c7|#6366f1)[^"]*"[^>]*>[\s\S]*?<\/div>\s*(?:<div[^>]*>\s*)?<table[\s\S]*?<\/table>(?:\s*<\/div>)?/i,
    '',
  );

  // Pattern C: RIT backend template `<h1>REGLAMENTO INTERNO DE TRABAJO</h1>` + `INFORMACIÓN GENERAL DE LA EMPRESA` table
  cleaned = cleaned.replace(
    /<h1[^>]*>\s*REGLAMENTO INTERNO DE TRABAJO\s*<\/h1>\s*<table[\s\S]*?INFORMACI[ÓO]N GENERAL DE LA EMPRESA[\s\S]*?<\/table>/i,
    '',
  );

  // Pattern D: Fallback if a standalone `INFORMACIÓN GENERAL DE LA EMPRESA` or `INFORMACIÓN RESUMIDA DE LA ENTIDAD` table without `wappy-entity-table` remains at the top
  if (!cleaned.includes('wappy-entity-table')) {
    cleaned = cleaned.replace(
      /(?:<div[^>]*>\s*)?<table[^>]*>[\s\S]{0,1500}?(?:INFORMACI[ÓO]N GENERAL DE LA EMPRESA|INFORMACI[ÓO]N RESUMIDA DE LA ENTIDAD|DATOS GENERALES DEL COMIT[ÉE]|DATOS GENERALES DEL TRABAJADOR|INFORMACI[ÓO]N DEL REGISTRO)[\s\S]*?<\/table>(?:\s*<\/div>)?/i,
      '',
    );
  }

  return cleaned.trim();
}

function detectFileType(content, defaultType = 'text') {
  if (!content) return defaultType;
  if (Array.isArray(content)) {
    if (content.length === 0) return defaultType;
    if (Array.isArray(content[0])) return 'excel';
    if (typeof content[0] === 'object') return 'presentation';
    return defaultType;
  }
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) return defaultType;
          if (Array.isArray(parsed[0])) return 'excel';
          if (typeof parsed[0] === 'object') return 'presentation';
        }
      } catch (e) {}
    } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          if (parsed.estadoAnimo || parsed.totalMuestras) return 'animo';
          if (parsed.preliminarClasificacion || parsed.totalReportesBuzon) return 'actos_condiciones';
        }
      } catch (e) {}
    }
    if (trimmed.toLowerCase().includes('<!doctype html>') || trimmed.toLowerCase().includes('<html')) {
      return 'html';
    }
  }
  return defaultType;
}

function hasSignature(html) {
  if (!html) return false;
  const lower = html.toLowerCase();
  return (
    lower.includes('signature-placeholder') ||
    lower.includes('responsable sg-sst') ||
    lower.includes('responsable sst') ||
    lower.includes('trabajador inducido') ||
    lower.includes('representante legal')
  );
}

/**
 * Busca y extrae el bloque del encabezado corporativo (contenedor con degradado linear-gradient y tabla resumen de la entidad)
 * existente en el contenido previo para evitar sobrescribir las ediciones manuales.
 */
function extractExistingHeader(html) {
  if (!html || !hasHeader(html)) {
    return null;
  }

  let tableEndMatch = html.match(/<\/table>\s*<\/div>/i);
  if (!tableEndMatch) {
    tableEndMatch = html.match(/<\/table>/i);
  }
  if (!tableEndMatch) return null;

  let headerStartIdx = html.indexOf('<style id="__wappy_report_responsive_styles__"');
  if (headerStartIdx === -1) {
    headerStartIdx = html.indexOf('<div class="wappy-standard-header-banner"');
  }
  if (headerStartIdx === -1) {
    headerStartIdx = html.indexOf('<div style="background: linear-gradient');
  }
  if (headerStartIdx === -1) return null;

  const endIdx = html.indexOf(tableEndMatch[0], headerStartIdx);
  if (endIdx === -1) return null;
  return html.substring(headerStartIdx, endIdx + tableEndMatch[0].length);
}

/**
 * Busca y extrae la sección de firmas desde el índice `<div style="margin-top: 50px;"` hasta el final
 * del contenido previo para conservar las firmas digitales y ediciones manuales.
 */
function extractExistingSignature(html) {
  if (!html || !hasSignature(html)) return null;

  const variations = [
    '<div style="margin-top: 60px;',
    '<div style="margin-top:60px;',
    '<div style="margin-top: 50px;',
    '<div style="margin-top:50px;',
    '<div style="page-break-inside:avoid;',
    '<div class="signature-placeholder',
  ];

  for (const variation of variations) {
    const index = html.lastIndexOf(variation);
    if (index !== -1) {
      return html.substring(index);
    }
  }
  return null;
}

/**
 * Helper to automatically prepend standard company header and append signature section to text (Word) Canvas documents.
 * Safe against consecutive duplicates by inspecting content substrings and reusing existing headers/signatures.
 */
async function processTextDocument(content, fileType, title, userId, existingContent) {
  if (fileType !== 'text') {
    return content;
  }

  let stringContent = (content || '').trim();
  if (!stringContent) return stringContent;

  const currentHasHeader = hasHeader(stringContent);
  const currentHasSignature = hasSignature(stringContent);
  const hasPlaceholders = stringContent.includes('{{empresa_') || stringContent.includes('{{representante_');

  if (currentHasHeader && currentHasSignature && !hasPlaceholders) {
    return stringContent;
  }

  let companyInfo = null;
  if (!currentHasHeader || !currentHasSignature || hasPlaceholders) {
    companyInfo =
      (await CompanyInfo.findOne({ user: userId, isActive: true })) ||
      (await CompanyInfo.findOne({ user: userId }));
  }

  if (hasPlaceholders && companyInfo) {
    stringContent = replaceCompanyVariables(stringContent, companyInfo);
  }

  if (!currentHasHeader) {
    stringContent = stripFakeTemplateHeader(stringContent);
    const headerHtml = buildStandardHeader({
      title: title || 'DOCUMENTO DE TRABAJO',
      companyInfo,
    });
    stringContent = headerHtml + '\n\n' + stringContent;
  }

  if (!currentHasSignature) {
    let signatureHtml = existingContent ? extractExistingSignature(existingContent) : null;
    if (!signatureHtml && companyInfo) {
      signatureHtml = buildSignatureSection(companyInfo);
    }
    if (signatureHtml) {
      stringContent = stringContent + '\n\n' + signatureHtml;
    }
  }

  return stringContent;
}

/**
 * GET /api/sgsst/canvas/desktop-token
 * Genera un token JWT de larga duración (365 días) para el aplicativo de escritorio.
 */
router.get('/desktop-token', requireJwtAuth, async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const userId = req.user.id;
    // Firmar token que dura 365 días usando JWT_SECRET
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '365d' });
    return res.status(200).json({ token });
  } catch (error) {
    logger.error('[desktop-token] Error generating token:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sgsst/canvas/history
 * Obtiene el historial de todos los documentos canvas de la empresa.
 */
router.get('/history', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    const { conversationId } = req.query;

    // Cruzar con conversaciones activas de LibreChat (no archivadas ni expiradas/eliminadas)
    const { Conversation } = require('~/db/models');
    const activeConvos = await Conversation.find({
      user: userId,
      $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
      $and: [{ $or: [{ expiredAt: null }, { expiredAt: { $exists: false } }] }],
    })
      .select('conversationId')
      .lean();
    const activeConvoIds = activeConvos.map((c) => c.conversationId);

    const query = companyId ? { companyId } : { user: userId };

    if (conversationId) {
      query.conversationId = conversationId;
    } else {
      query.conversationId = { $in: activeConvoIds };
    }

    const sessions = await CanvasSession.find(query).sort({ updatedAt: -1 }).limit(50);

    const conversations = sessions.map((session) => ({
      conversationId: session.conversationId,
      title: session.title || 'Archivo sin título',
      updatedAt: session.updatedAt,
      fileType: session.fileType,
    }));

    res.json({ conversations });
  } catch (error) {
    logger.error('[Canvas History GET] Error:', error);
    res.status(500).json({ error: 'Error al obtener el historial de Canvas' });
  }
});

/**
 * GET /api/sgsst/canvas/:conversationId
 * Obtiene la sesión de canvas activa de una conversación.
 */
router.get('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    let session = await CanvasSession.findOne({ conversationId });

    if (!session) {
      return res.json({
        content: '',
        title: 'Archivo sin título',
        fileType: 'text',
        version: 1,
        history: [],
      });
    }

    let servedContent = session.content;
    if (session.fileType === 'text' && typeof servedContent === 'string' && servedContent.trim().length > 0) {
      if (!hasHeader(servedContent) || !hasSignature(servedContent) || servedContent.includes('{{empresa_')) {
        try {
          servedContent = await processTextDocument(
            servedContent,
            'text',
            session.title,
            req.user?.id || session.user,
            session.content,
          );
          session.content = servedContent;
          await session.save();
        } catch (_) {}
      }
    } else if (session.fileType === 'html' && typeof servedContent === 'string' && servedContent.length > 0) {
      try {
        const CanvasTool = require('~/app/clients/tools/structured/CanvasTool');
        if (typeof CanvasTool.injectStandaloneCssIfMissing === 'function') {
          servedContent = CanvasTool.injectStandaloneCssIfMissing(servedContent);
        }
      } catch (_) {}
    }

    res.json({
      content: servedContent,
      title: session.title,
      fileType: session.fileType,
      version: session.version,
      history: session.history || [],
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    logger.error('[Canvas GET] Error:', error);
    res.status(500).json({ error: 'Error al obtener la sesión de Canvas' });
  }
});

/**
 * POST /api/sgsst/canvas/:conversationId
 * Crea o actualiza la sesión de canvas de una conversación.
 * Registra un historial de versiones si el contenido cambia sustancialmente.
 */
router.post('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    let { content, title, fileType } = req.body;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    if (!fileType) {
      return res.status(400).json({ error: 'El campo "fileType" es requerido.' });
    }

    let finalTitle = title;
    let finalContent = content;

    // --- Dynamic Title Extraction ---
    if (fileType === 'text' && typeof content === 'string') {
      const isDefaultTitle = (t) =>
        !t ||
        t === 'Archivo sin título' ||
        t === 'Archivo de Canvas sin título' ||
        t === 'DOCUMENTO DE TRABAJO' ||
        t.trim() === '';
      if (isDefaultTitle(finalTitle)) {
        const match = content.match(/<(h[12])\b[^>]*>(.*?)<\/\1>/i);
        if (match) {
          const extractedTitle = match[2].replace(/<[^>]*>/g, '').trim();
          if (extractedTitle) {
            finalTitle = extractedTitle;
            finalContent = content.replace(match[0], '');
            // Clean up leading spaces or empty tags
            finalContent = finalContent.replace(
              /^\s*(?:<p>\s*<br\s*\/?>\s*<\/p>|<p>\s*<\/p>|\s)+/i,
              '',
            );
          }
        }
      }
    }
    // ---------------------------------

    let session = await CanvasSession.findOne({ conversationId });
    const existingContent = session ? session.content : null;

    let processedContent = await processTextDocument(
      finalContent,
      fileType,
      finalTitle,
      userId,
      existingContent,
    );

    if (fileType === 'html' && typeof processedContent === 'string' && processedContent.length > 0) {
      try {
        const CanvasTool = require('~/app/clients/tools/structured/CanvasTool');
        if (typeof CanvasTool.injectStandaloneCssIfMissing === 'function') {
          processedContent = CanvasTool.injectStandaloneCssIfMissing(processedContent);
        }
      } catch (_) {}
    }

    if (!session) {
      // Crear nueva sesión
      session = new CanvasSession({
        user: userId,
        companyId,
        conversationId,
        title: finalTitle || 'Archivo sin título',
        fileType,
        content: processedContent ?? '',
        version: 1,
        history: [
          {
            version: 1,
            content: processedContent ?? '',
            title: finalTitle || 'Archivo sin título',
            fileType,
            updatedAt: new Date(),
          },
        ],
      });
      await session.save();
    } else {
      // Comprobar si el contenido realmente cambió
      const contentChanged = JSON.stringify(session.content) !== JSON.stringify(processedContent);

      // Smart title checking: avoid overwriting a custom title with the default "Archivo sin título" placeholder
      const isDefaultTitle = (t) =>
        !t || t === 'Archivo sin título' || t === 'Archivo de Canvas sin título';
      const existingIsDefault = isDefaultTitle(session.title);
      const newIsDefault = isDefaultTitle(finalTitle);

      let savedTitle = finalTitle || session.title;
      if (newIsDefault && !existingIsDefault) {
        savedTitle = session.title;
      }

      const titleChanged = session.title !== savedTitle && savedTitle !== undefined;

      const { isManual } = req.body;

      if (isManual || contentChanged || titleChanged) {
        if (isManual) {
          const maxHistoryVersion = (session.history || []).reduce((max, item) => Math.max(max, item.version || 0), 0);
          const nextVersion = Math.max(maxHistoryVersion, session.version || 0) + 1;

          // Agregar al historial limitando a los últimos 20 cambios
          const newHistoryItem = {
            version: nextVersion,
            content: processedContent ?? session.content,
            title: savedTitle,
            fileType: fileType || session.fileType,
            updatedAt: new Date(),
          };

          const maxHistory = req.user.role === 'USER' ? 5 : 20;
          const updatedHistory = [...(session.history || []), newHistoryItem].slice(-maxHistory);

          session.content = processedContent ?? session.content;
          session.title = savedTitle;
          if (fileType) session.fileType = fileType;
          if (companyId) session.companyId = companyId; // Sync active company ID
          session.version = nextVersion;
          session.history = updatedHistory;
        } else {
          // Auto-save: update content/title in-place without creating a new version
          session.content = processedContent ?? session.content;
          session.title = savedTitle;
          if (fileType) session.fileType = fileType;
          if (companyId) session.companyId = companyId; // Sync active company ID
        }

        await session.save();
      }
    }

    // Sincronizar de vuelta a LiveEditor si es un documento de texto
    if (session.fileType === 'text') {
      await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
    }

    res.json({
      success: true,
      version: session.version,
      title: session.title,
      content: session.content,
      fileType: session.fileType,
      history: session.history || [],
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    logger.error('[Canvas POST] Error:', error);
    res.status(500).json({ error: 'Error al guardar la sesión de Canvas' });
  }
});

/**
 * DELETE /api/sgsst/canvas/:conversationId
 * Borra el documento canvas de la conversación.
 */
router.delete('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    await CanvasSession.findOneAndDelete({ conversationId });

    // También eliminamos la sesión de LiveEditor relacionada
    const LiveEditorSession = require('~/models/LiveEditorSession');
    await LiveEditorSession.findOneAndDelete({ conversationId });

    res.json({ success: true });
  } catch (error) {
    logger.error('[Canvas DELETE] Error:', error);
    res.status(500).json({ error: 'Error al vaciar Canvas' });
  }
});

/**
 * POST /api/sgsst/canvas/:conversationId/rename
 * Renombra el título del documento Canvas principal y el de su última versión en el historial.
 */
router.post('/:conversationId/rename', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    let session = await CanvasSession.findOne({ conversationId });
    if (!session) {
      return res.status(404).json({ error: 'Sesión de Canvas no encontrada' });
    }

    session.title = title;

    // Si hay historial, actualizamos el título de la última versión
    if (session.history && session.history.length > 0) {
      const lastIndex = session.history.length - 1;
      session.history[lastIndex].title = title;
    }

    session.markModified('history');
    await session.save();

    // Sincronizar de vuelta a LiveEditor si es un documento de texto
    if (session.fileType === 'text') {
      const userId = req.user.id;
      await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
    }

    res.json({ success: true, title: session.title, history: session.history });
  } catch (error) {
    logger.error('[Canvas Rename] Error:', error);
    res.status(500).json({ error: 'Error al renombrar el lienzo Canvas' });
  }
});

/**
 * POST /api/sgsst/canvas/:conversationId/versions/:version/rename
 * Renombra una versión específica en el historial de canvas de la conversación.
 */
router.post('/:conversationId/versions/:version/rename', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId, version } = req.params;
    const { title } = req.body;
    const versionNum = parseInt(version, 10);

    let session = await CanvasSession.findOne({ conversationId });
    if (!session) {
      return res.status(404).json({ error: 'Sesión de Canvas no encontrada' });
    }

    let updated = false;
    session.history = session.history.map((item) => {
      if (item.version === versionNum) {
        item.title = title;
        updated = true;
      }
      return item;
    });

    if (updated) {
      if (session.version === versionNum) {
        session.title = title;
      }
      session.markModified('history');
      await session.save();
    }

    res.json({ success: true, history: session.history });
  } catch (error) {
    logger.error('[Canvas Version Rename] Error:', error);
    res.status(500).json({ error: 'Error al renombrar la versión' });
  }
});

/**
 * DELETE /api/sgsst/canvas/:conversationId/versions/:version
 * Elimina una versión específica en el historial de canvas de la conversación.
 */
router.delete('/:conversationId/versions/:version', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId, version } = req.params;
    const versionNum = parseInt(version, 10);

    let session = await CanvasSession.findOne({ conversationId });
    if (!session) {
      return res.status(404).json({ error: 'Sesión de Canvas no encontrada' });
    }

    session.history = session.history.filter((item) => item.version !== versionNum);
    session.markModified('history');
    await session.save();

    res.json({ success: true, history: session.history });
  } catch (error) {
    logger.error('[Canvas Version Delete] Error:', error);
    res.status(500).json({ error: 'Error al eliminar la versión' });
  }
});

/**
 * POST /api/sgsst/canvas/:conversationId/versions/:version/restore
 * Restaura el documento a una versión específica sin crear duplicados en el historial.
 */
router.post('/:conversationId/versions/:version/restore', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId, version } = req.params;
    const versionNum = parseInt(version, 10);

    let session = await CanvasSession.findOne({ conversationId });
    if (!session) {
      return res.status(404).json({ error: 'Sesión de Canvas no encontrada' });
    }

    const versionItem = session.history.find((item) => item.version === versionNum);
    if (!versionItem) {
      return res.status(404).json({ error: 'Versión no encontrada en el historial' });
    }

    session.content = versionItem.content;
    session.title = versionItem.title;
    session.version = versionNum;
    session.fileType = versionItem.fileType || detectFileType(versionItem.content, session.fileType || 'text');

    // Sincronizar hacia LiveEditor si aplica
    if (session.fileType === 'text') {
      const userId = req.user.id;
      await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
    }

    await session.save();

    res.json({
      success: true,
      version: session.version,
      title: session.title,
      content: session.content,
      fileType: session.fileType,
      history: session.history || [],
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    logger.error('[Canvas Version Restore] Error:', error);
    res.status(500).json({ error: 'Error al restaurar la versión' });
  }
});

/**
 * POST /api/sgsst/canvas/app-builder/generate
 * Unified generation endpoint for all custom App Builder canvas modules & IA Soul.
/**
 * POST /api/sgsst/canvas/app-builder/generate y /ai-chat
 * Generador de contenido asistido por IA para Canvas y Copilot de Aplicativos HTML.
 */
async function handleAiGeneration(req, res) {
  try {
    const {
      taskType = 'chat',
      systemPrompt,
      userInput,
      history,
      excelCols,
      model,
      context,
      appData,
    } = req.body;
    const { generateWithKeyRotation } = require('./sgsstGemini');
    const { buildCompanyContextString } = require('./reportHeader');

    // Load active company context if available
    let companyContext = '';
    try {
      const ci =
        (await CompanyInfo.findOne({ user: req.user.id, isActive: true })) ||
        (await CompanyInfo.findOne({ user: req.user.id }));
      if (ci && ci.companyName) {
        companyContext = buildCompanyContextString(ci);
      }
    } catch (e) {
      logger.warn('[AppBuilder Generate] Error loading company context:', e.message);
    }

    let promptText = '';

    if (taskType === 'chat' || taskType === 'copilot') {
      const prevMsgs = (history || [])
        .map((m) => `${m.sender === 'user' || m.role === 'user' ? 'Usuario' : 'Asistente IA'}: ${m.text || m.content || ''}`)
        .join('\n');

      const dataPayload = context || (appData ? (typeof appData === 'string' ? appData : JSON.stringify(appData, null, 2)) : '');

      promptText = `Eres el Asistente de Inteligencia Artificial especializado (WAPPY AI Copilot) integrado en este aplicativo de Seguridad y Salud en el Trabajo (SG-SST).
      
## TU ROL E INSTRUCCIONES:
${systemPrompt || 'Eres un consultor experto en SG-SST que ayuda al usuario a interpretar indicadores, analizar causas raíz de accidentes, proponer planes de acción conformes a la Resolución 0312 de 2019 / Decreto 1072 de 2015 y resolver dudas sobre los datos diligenciados.'}

## CONTEXTO DE LA EMPRESA ACTIVA:
${companyContext || 'No hay información de empresa registrada.'}

${dataPayload ? `## DATOS ACTUALES DEL APLICATIVO (TABLAS, MÉTRICAS, REGISTROS EN PANTALLA):\n${dataPayload}\n` : ''}

## HISTORIAL DE LA CONVERSACIÓN:
${prevMsgs || 'Inicio de conversación.'}

## MENSAJE / CONSULTA DEL USUARIO:
Usuario: ${userInput}

## REGLAS DE RESPUESTA:
1. Responde de forma directa, concisa, profesional y con valor técnico.
2. Si el usuario pregunta sobre métricas o registros específicos, básate rigurosamente en los DATOS ACTUALES DEL APLICATIVO suministrados arriba.
3. Puedes utilizar formato Markdown (negritas, listas, viñetas) para que la respuesta sea fácil de leer en la interfaz.`;
    } else if (taskType === 'word') {
      promptText = `Genera un DOCUMENTO técnico completo de Seguridad y Salud en el Trabajo (SG-SST) basado en las siguientes especificaciones:
      
## NOMBRE O PROPÓSITO DEL DOCUMENTO
${userInput || 'Documento Técnico de SST'}

## INSTRUCCIONES DE COMPORTAMIENTO (ALMA DE IA DEL APLICATIVO)
${systemPrompt || 'Generar un informe formal y profesional.'}

## CONTEXTO DE LA EMPRESA
${companyContext || 'No hay información de la empresa registrada.'}

## INSTRUCCIONES DE FORMATO:
- Genera un contenido elegante y estructurado usando directamente etiquetas HTML del cuerpo (body). NO incluyas <html>, <head>, <body>, ni <style>.
- Usa títulos elegantes <h2>, <h3>, párrafos estructurados y tablas de ser necesario con estilos inline elegantes.
- Agrega secciones profesionales: Introducción, Objetivos, Desarrollo, Recomendaciones y Conclusiones.
- Al final, NO incluyas tablas de firmas ni nombres, ya que el sistema los añade automáticamente.`;
    } else if (taskType === 'excel') {
      promptText = `Genera una MATRIZ O TABLA DE EXCEL (Hoja de cálculo) en formato JSON para un caso de Seguridad y Salud en el Trabajo (SG-SST):
      
## CASO / PROPÓSITO
${userInput || 'Matriz de Riesgos o Seguimiento'}

## ESTRUCTURA DE COLUMNAS DESEADA
${(excelCols || []).join(', ') || 'Riesgo, Descripción, Nivel, Control Propuesto, Responsable'}

## INSTRUCCIONES DE COMPORTAMIENTO (ALMA DE IA DEL APLICATIVO)
${systemPrompt || 'Generar una matriz organizada.'}

## CONTEXTO DE LA EMPRESA
${companyContext || 'No hay información de la empresa registrada.'}

## REQUISITO DE RESPUESTA:
Debes responder ÚNICAMENTE con un arreglo JSON válido conteniendo 5 filas de datos. Cada fila debe ser un objeto cuyas llaves sean EXACTAMENTE los nombres de las columnas indicadas.
NO incluyas explicaciones, introducciones, ni bloques de código de markdown. Responde solo con el JSON crudo. Ejemplo:
[
  {"Riesgo": "...", "Descripción": "...", "Nivel": "...", "Control Propuesto": "...", "Responsable": "..."},
  ...
]`;
    } else if (taskType === 'slides') {
      promptText = `Diseña una PRESENTACIÓN EJECUTIVA MAGISTRAL de 8 diapositivas de alto impacto (estilo McKinsey / Gamma.app) para Seguridad y Salud en el Trabajo (SG-SST):

## PROPÓSITO DE LA PRESENTACIÓN / CAPACITACIÓN
${userInput || 'Capacitación en Higiene Postural y Pausas Activas'}

## INSTRUCCIONES DE COMPORTAMIENTO (ALMA DE IA DEL APLICATIVO)
${systemPrompt || 'Presentación ejecutiva, técnica y persuasiva bajo normativa colombiana (Decreto 1072 de 2015 / Resolución 0312 de 2019).'}

## CONTEXTO DE LA EMPRESA
${companyContext || 'Empresa colombiana comprometida con el SG-SST.'}

## REQUISITO ESTRICTO DE ESTRUCTURA JSON (8 DIAPOSITIVAS VARIADAS):
Debes responder ÚNICAMENTE con un arreglo JSON válido de 8 objetos de diapositiva.
Cada diapositiva DEBE incluir:
- "title": Action Title ejecutivo (un hallazgo o conclusión clara, NO palabras genéricas).
- "subtitle": Subtítulo de contexto técnico.
- "kicker": Etiqueta superior en mayúsculas (ej. "DIAGNÓSTICO SG-SST", "INDICADORES CRÍTICOS").
- "layout": Alterna entre "title" (slide 1), "kpi-grid" (slide 2), "columns" (slide 3), "table" (slide 4), "chart" (slide 5), "timeline" (slide 6), "quote" (slide 7) y "bullets" (slide 8).
- "theme": Uno de ["wappy-dark", "emerald-sst", "cobalt", "forest", "corporate-light", "wappy-cream", "sunset", "charcoal"].
- "bullets": Arreglo obligatorio en TODAS las diapositivas con 3 a 5 puntos ejecutivos en texto limpio sin etiquetas HTML.
- Campos específicos según layout:
  * Si layout="kpi-grid": "kpis": [{"label": "...", "value": "...", "delta": "+12% vs meta", "trend": "up", "description": "..."}] (4 KPIs).
  * Si layout="columns": "columns": [{"title": "...", "badge": "...", "theme": "info", "items": ["...", "..."]}] (2 o 3 columnas).
  * Si layout="table": "tableHtml": "<table><thead><tr><th>...</th></tr></thead><tbody><tr><td>...</td></tr></tbody></table>" (mínimo 4 filas reales).
  * Si layout="chart": "chartConfig": {"type": "bar", "title": "...", "data": [{"label": "...", "val": 45}], "labels": ["..."], "datasets": [{"label": "...", "data": [45], "color": "#14b8a6"}]}.
  * Si layout="timeline": "steps": [{"phase": "Fase 1 — Planear", "title": "...", "detail": "..."}] (4 fases).
  * Si layout="quote": "quote": "Cita técnica o legal...", "citation": "Decreto 1072 de 2015 / Res. 0312 de 2019".
- "takeaway": Frase ejecutiva de conclusión en el pie de la diapositiva.
- "speakerNotes": Guía breve de locución para el presentador.

NO incluyas bloques markdown (\`\`\`json) ni texto fuera del arreglo JSON.`;
    } else if (taskType === 'html') {
      promptText = `Diseña una interfaz web o componente interactivo elegante usando HTML y TailwindCSS (si aplica) o estilos inline:
      
## PROPÓSITO / DESCRIPCIÓN DEL PROTOTIPO
${userInput || 'Dashboard de Indicadores de SST'}

## INSTRUCCIONES DE COMPORTAMIENTO (ALMA DE IA DEL APLICATIVO)
${systemPrompt || 'Interfaz limpia.'}

## CONTEXTO DE LA EMPRESA
${companyContext || 'No hay información de la empresa registrada.'}

## REQUISITO DE RESPUESTA:
Genera el código HTML interactivo autocontenido. Puedes usar Tailwind CSS (clases cargadas por CDN en el visor) y estilos inline. Utiliza colores de WAPPY (verdes, esmeralda, cyan) para que se vea súper tecnológico y moderno.
Genera ÚNICAMENTE el código HTML del componente, sin bloques de código de markdown de tres comillas.`;
    }

    const preferredModel = (typeof model === 'string' && model.trim() && model !== 'gemini-3.7-flash') ? model.trim() : 'gemini-3.6-flash';
    const result = await generateWithKeyRotation(preferredModel, req.user.id, promptText);
    const response = await result.response;
    const outputText = response.text();

    res.json({
      success: true,
      result: outputText.trim(),
      model: preferredModel,
    });
  } catch (error) {
    logger.error('[AppBuilder Generate API] Error:', error);
    res.status(500).json({ error: error.message || 'Error al procesar la solicitud con IA' });
  }
}

router.post('/app-builder/generate', requireJwtAuth, handleAiGeneration);
router.post('/ai-chat', requireJwtAuth, handleAiGeneration);

/**
 * GET /api/sgsst/canvas/models
 * Retorna los modelos de texto oficiales configurados en WAPPY para selección en los aplicativos HTML.
 */
router.get('/models', requireJwtAuth, (req, res) => {
  res.json({
    models: [
      { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', badge: 'Ultra Rápido' },
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', badge: 'Recomendado' },
    ],
    default: 'gemini-3.5-flash-lite',
  });
});

/**
 * GET /api/sgsst/canvas/:conversationId/view
 * Renderiza el documento Canvas de forma visual para previsualizarlo o imprimirlo (público).
 */
router.get('/:conversationId/view', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const session = await CanvasSession.findOne({ conversationId });

    if (!session) {
      return res.status(404).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Documento no encontrado o sesión de Canvas vacía.</h1>');
    }

    if (session.fileType === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(session.content);
    }

    const title = session.title || 'Documento de Canvas';

    // Renderizado imprimible 16:9 cuando es Presentación Ejecutiva (`presentation`)
    if (session.fileType === 'presentation') {
      let slides = [];
      if (Array.isArray(session.content)) {
        slides = session.content;
      } else if (typeof session.content === 'string') {
        try {
          const parsed = JSON.parse(session.content);
          slides = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.slides) ? parsed.slides : [];
        } catch (_) {}
      }

      const slideCardsHtml = slides
        .map((s, idx) => {
          const sTitle = s?.title || `Diapositiva #${idx + 1}`;
          const sSub = s?.subtitle || '';
          const sKicker = s?.kicker || s?.badge || `DIAPOSITIVA 0${idx + 1}`;
          const bullets = Array.isArray(s?.bullets) ? s.bullets : [];
          const kpis = Array.isArray(s?.kpis) ? s.kpis : [];
          const columns = Array.isArray(s?.columns) ? s.columns : [];
          const steps = Array.isArray(s?.steps) ? s.steps : [];
          const chartData = Array.isArray(s?.chartConfig?.data) ? s.chartConfig.data : [];

          let bodyHtml = '';
          if (kpis.length > 0) {
            bodyHtml += `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">${kpis
              .map(
                (k) => `<div class="p-4 rounded-xl bg-slate-800/80 border border-teal-500/30">
                  <div class="text-xs uppercase tracking-wider text-teal-400 font-semibold">${k.label || 'Indicador'}</div>
                  <div class="text-2xl font-extrabold text-white mt-1">${k.value || '0'}</div>
                  ${k.delta ? `<div class="text-xs text-emerald-400 mt-1">${k.delta}</div>` : ''}
                  ${k.description ? `<div class="text-xs text-slate-300 mt-1">${k.description}</div>` : ''}
                </div>`,
              )
              .join('')}</div>`;
          }
          if (columns.length > 0) {
            bodyHtml += `<div class="grid grid-cols-1 md:grid-cols-${Math.min(columns.length, 3)} gap-4 my-4">${columns
              .map(
                (col) => `<div class="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
                  <div class="font-bold text-teal-300 mb-2">${col.title || 'Pilar'}</div>
                  <ul class="space-y-1.5 text-sm text-slate-200 list-disc pl-4">
                    ${(Array.isArray(col.items) ? col.items : []).map((it) => `<li>${it}</li>`).join('')}
                  </ul>
                </div>`,
              )
              .join('')}</div>`;
          }
          if (steps.length > 0) {
            bodyHtml += `<div class="grid grid-cols-1 md:grid-cols-4 gap-3 my-4">${steps
              .map(
                (st, si) => `<div class="p-3.5 rounded-xl bg-slate-800/70 border-l-4 border-teal-400">
                  <div class="text-xs font-bold text-teal-400 uppercase">${st.phase || `Fase ${si + 1}`}</div>
                  <div class="font-bold text-white text-sm mt-1">${st.title || ''}</div>
                  <div class="text-xs text-slate-300 mt-1">${st.detail || st.description || ''}</div>
                </div>`,
              )
              .join('')}</div>`;
          }
          if (s?.tableHtml) {
            bodyHtml += `<div class="my-4 overflow-x-auto text-sm [&_table]:w-full [&_th]:bg-teal-900/60 [&_th]:text-teal-200 [&_th]:p-2.5 [&_th]:text-left [&_td]:p-2.5 [&_td]:border-t [&_td]:border-slate-700">${s.tableHtml}</div>`;
          }
          if (chartData.length > 0) {
            const maxVal = Math.max(...chartData.map((d) => Number(d.val) || 1), 1);
            bodyHtml += `<div class="my-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <div class="text-xs font-bold uppercase tracking-wider text-teal-300 mb-3">${s.chartConfig?.title || 'Análisis Cuantitativo'}</div>
              <div class="space-y-2.5">
                ${chartData
                  .map(
                    (d) => `<div>
                      <div class="flex justify-between text-xs text-slate-200 mb-1"><span>${d.label}</span><span class="font-bold text-teal-300">${d.val}</span></div>
                      <div class="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                        <div class="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full" style="width: ${Math.min(100, Math.round(((Number(d.val) || 0) / maxVal) * 100))}%"></div>
                      </div>
                    </div>`,
                  )
                  .join('')}
              </div>
            </div>`;
          }
          if (s?.quote) {
            bodyHtml += `<blockquote class="my-4 p-5 rounded-xl bg-teal-950/50 border-l-4 border-teal-400 italic text-slate-100 text-base">
              "${s.quote}"
              ${s.citation ? `<footer class="mt-2 text-xs font-semibold text-teal-300 not-italic">— ${s.citation}</footer>` : ''}
            </blockquote>`;
          }
          if (bullets.length > 0) {
            bodyHtml += `<ul class="space-y-2 my-3 text-slate-200 text-sm list-disc pl-5">
              ${bullets.map((b) => `<li>${typeof b === 'object' ? JSON.stringify(b) : b}</li>`).join('')}
            </ul>`;
          }

          return `<section class="slide-page bg-slate-900 text-white rounded-2xl p-8 md:p-10 mb-8 shadow-xl border border-slate-700/80 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span class="text-xs font-bold uppercase tracking-widest text-teal-400">${sKicker}</span>
                <span class="text-xs text-slate-400">${idx + 1} / ${slides.length}</span>
              </div>
              <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white">${sTitle}</h2>
              ${sSub ? `<p class="text-sm text-slate-300 mt-1.5">${sSub}</p>` : ''}
              <div class="mt-4">${bodyHtml}</div>
            </div>
            ${
              s?.takeaway
                ? `<div class="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-teal-300">
                    <span><strong>Conclusión Clave:</strong> ${s.takeaway}</span>
                    <span class="text-slate-500">WAPPY IA • SG-SST</span>
                  </div>`
                : ''
            }
          </section>`;
        })
        .join('\n');

      const presentationHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Presentación Ejecutiva</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b1120; font-family: system-ui, -apple-system, sans-serif; }
    .slide-page { min-height: 480px; page-break-after: always; }
    @media print {
      body { background-color: #0b1120; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .slide-page { margin-bottom: 0; border-radius: 0; page-break-inside: avoid; }
    }
  </style>
</head>
<body class="p-6 md:p-12 max-w-5xl mx-auto">
  <div class="no-print fixed top-4 right-4 z-50 flex gap-2">
    <button onclick="window.print()" class="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold text-sm shadow-lg cursor-pointer">
      Imprimir / Guardar PDF (16:9)
    </button>
  </div>
  <header class="mb-8 text-white no-print">
    <h1 class="text-2xl font-bold">${title}</h1>
    <p class="text-xs text-slate-400">Vista Ejecutiva Imprimible • ${slides.length} diapositivas</p>
  </header>
  ${slideCardsHtml}
</body>
</html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(presentationHtml);
    }

    // Renderizado estilizado en tabla HTML cuando es Hoja de Cálculo (`excel`)
    if (session.fileType === 'excel') {
      let sheets = {};
      if (Array.isArray(session.content)) {
        sheets = { 'Hoja 1': session.content };
      } else if (session.content && typeof session.content === 'object') {
        sheets = session.content;
      } else if (typeof session.content === 'string') {
        try {
          const parsed = JSON.parse(session.content);
          sheets = Array.isArray(parsed) ? { 'Hoja 1': parsed } : parsed;
        } catch (_) {
          sheets = { 'Hoja 1': [[session.content]] };
        }
      }

      const tablesHtml = Object.entries(sheets)
        .map(([sheetName, rows]) => {
          if (!Array.isArray(rows) || rows.length === 0) return '';
          const headers = Array.isArray(rows[0]) ? rows[0] : [String(rows[0])];
          const bodyRows = rows.slice(1);
          return `<div class="mb-8">
            <h2 class="text-lg font-bold text-teal-800 mb-3">${sheetName}</h2>
            <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table class="w-full text-sm text-left border-collapse">
                <thead class="bg-teal-700 text-white uppercase text-xs">
                  <tr>${headers.map((h) => `<th class="px-4 py-3 border border-teal-800">${h ?? ''}</th>`).join('')}</tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  ${bodyRows
                    .map(
                      (r, ri) =>
                        `<tr class="${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-teal-50/40">
                          ${(Array.isArray(r) ? r : [r]).map((c) => `<td class="px-4 py-2.5 border border-slate-200 text-slate-700">${c ?? ''}</td>`).join('')}
                        </tr>`,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>`;
        })
        .join('\n');

      const excelHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Hoja de Cálculo SG-SST</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body class="bg-slate-100 p-6 md:p-10 font-sans">
  <div class="no-print fixed top-4 right-4 z-50">
    <button onclick="window.print()" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm shadow cursor-pointer">
      Imprimir / Guardar PDF
    </button>
  </div>
  <div class="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
    <h1 class="text-2xl font-extrabold text-slate-900 mb-1">${title}</h1>
    <p class="text-xs text-slate-500 mb-6">WAPPY IA • Hoja de Cálculo Corporativa SG-SST</p>
    ${tablesHtml}
  </div>
</body>
</html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(excelHtml);
    }

    // Para tipo "text" (Word) u otros, envolvemos en un contenedor premium de lectura y Tailwind
    const htmlPage = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #f3f4f6;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .canvas-container {
      background-color: #ffffff;
      max-width: 900px;
      margin: 40px auto;
      padding: 45px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    @media print {
      body {
        background-color: #ffffff;
      }
      .canvas-container {
        margin: 0;
        padding: 0;
        box-shadow: none;
        border: none;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- Botones flotantes no imprimibles -->
  <div class="no-print fixed top-4 right-4 flex space-x-2">
    <button onclick="window.print()" class="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 font-medium text-sm transition-all duration-200 cursor-pointer">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-14.326 0C3.768 7.28 3 8.215 3 9.456v6.292a2.25 2.25 0 001.75 2.208h1.092"></path>
      </svg>
      Imprimir / PDF
    </button>
  </div>

  <div class="canvas-container">
    ${session.content}
  </div>
</body>
</html>
    `;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlPage);
  } catch (error) {
    logger.error('[Canvas View GET] Error:', error);
    res.status(500).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Error al generar la vista del documento.</h1>');
  }
});

function renderMatrixTable(title, rows) {
  if (!rows || rows.length === 0) {
    return `<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Matriz vacía o sin datos.</h1>`;
  }

  // Get keys to use as headers (excluding MongoDB fields or internal IDs)
  const excludeKeys = ['_id', 'id', 'createdAt', 'updatedAt', '__v', 'userId', 'companyId', 'conversationId'];
  const headers = Object.keys(rows[0]).filter(k => !excludeKeys.includes(k));

  const tableHeader = headers.map(h => `<th class="px-4 py-3 bg-teal-600 text-white font-bold text-sm text-left uppercase tracking-wider">${h.replace(/_/g, ' ').toUpperCase()}</th>`).join('');
  const tableRows = rows.map(row => {
    return `<tr class="border-b border-gray-200 hover:bg-gray-50">` + 
      headers.map(h => {
        let val = row[h];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        return `<td class="px-4 py-3 text-sm text-gray-700 leading-relaxed">${val ?? ''}</td>`;
      }).join('') + `</tr>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #f3f4f6;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .canvas-container {
      background-color: #ffffff;
      max-width: 1200px;
      margin: 40px auto;
      padding: 45px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    @media print {
      body {
        background-color: #ffffff;
      }
      .canvas-container {
        margin: 0;
        padding: 0;
        box-shadow: none;
        border: none;
        max-width: 100%;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="no-print fixed top-4 right-4 flex space-x-2">
    <a href="./excel" class="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 font-medium text-sm transition-all duration-200 cursor-pointer text-decoration-none" style="text-decoration: none;">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      Descargar Excel (.xlsx)
    </a>
    <button onclick="window.print()" class="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 font-medium text-sm transition-all duration-200 cursor-pointer">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-14.326 0C3.768 7.28 3 8.215 3 9.456v6.292a2.25 2.25 0 001.75 2.208h1.092"></path>
      </svg>
      Imprimir / PDF
    </button>
  </div>

  <div class="canvas-container">
    <header class="pb-6 mb-8 border-b border-gray-200">
      <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 border border-teal-500/20">WAPPY IA - SG-SST</span>
      <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 mt-2">${title}</h1>
    </header>
    
    <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table class="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            ${tableHeader}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${tableRows}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Helper to build and download Excel spreadsheet workbook from matrixRows
 */
function sendExcelResponse(res, filename, rows) {
  try {
    // Convert array of objects to sheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matriz');

    // Write array buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    logger.error('[Excel Generation] Error:', error);
    res.status(500).send('Error al generar el archivo Excel');
  }
}

/**
 * GET /api/sgsst/canvas/gtc45/:conversationId/view
 * Renderiza la matriz GTC-45 en formato HTML imprimible.
 */
router.get('/gtc45/:conversationId/view', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const session = await GTC45WorkspaceSession.findOne({ conversationId });

    if (!session || !session.matrixRows || session.matrixRows.length === 0) {
      return res.status(404).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Matriz GTC-45 no encontrada o vacía para esta conversación.</h1>');
    }

    const html = renderMatrixTable('Matriz de Identificación de Peligros y Valoración de Riesgos GTC-45', session.matrixRows);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    logger.error('[Canvas GTC45 View GET] Error:', error);
    res.status(500).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Error al generar la vista de la matriz GTC-45.</h1>');
  }
});

/**
 * GET /api/sgsst/canvas/gtc45/:conversationId/excel
 * Descarga la matriz GTC-45 en formato Excel (.xlsx).
 */
router.get('/gtc45/:conversationId/excel', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const session = await GTC45WorkspaceSession.findOne({ conversationId });

    if (!session || !session.matrixRows || session.matrixRows.length === 0) {
      return res.status(404).send('Matriz no encontrada o vacía.');
    }

    const buffer = await exportIPEVARToExcel(session.matrixRows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Matriz_GTC45_${conversationId}.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    logger.error('[Canvas GTC45 Excel GET] Error:', error);
    res.status(500).send('Error al descargar el archivo Excel');
  }
});

/**
 * GET /api/sgsst/canvas/pesv/:conversationId/view
 * Renderiza la matriz de Seguridad Vial PESV en formato HTML imprimible.
 */
router.get('/pesv/:conversationId/view', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const session = await PESVWorkspaceSession.findOne({ conversationId });

    if (!session || !session.matrixRows || session.matrixRows.length === 0) {
      return res.status(404).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Matriz PESV no encontrada o vacía para esta conversación.</h1>');
    }

    const html = renderMatrixTable('Plan Estratégico de Seguridad Vial (PESV) - Matriz de Riesgo Vial', session.matrixRows);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    logger.error('[Canvas PESV View GET] Error:', error);
    res.status(500).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Error al generar la vista de la matriz PESV.</h1>');
  }
});

/**
 * GET /api/sgsst/canvas/pesv/:conversationId/excel
 * Descarga la matriz PESV en formato Excel (.xlsx).
 */
router.get('/pesv/:conversationId/excel', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const session = await PESVWorkspaceSession.findOne({ conversationId });

    if (!session || !session.matrixRows || session.matrixRows.length === 0) {
      return res.status(404).send('Matriz no encontrada o vacía.');
    }

    const buffer = await exportMatrizPESVToExcel(session.matrixRows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Matriz_PESV_${conversationId}.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    logger.error('[Canvas PESV Excel GET] Error:', error);
    res.status(500).send('Error al descargar el archivo Excel');
  }
});

/**
 * GET /api/sgsst/canvas/chemical/:conversationId/view
 * Renderiza la matriz de Compatibilidad Química en formato HTML imprimible.
 */
router.get('/chemical/:conversationId/view', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const session = await ChemicalCompatibilitySession.findOne({ conversationId });

    if (!session || !session.matrixRows || session.matrixRows.length === 0) {
      return res.status(404).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Matriz de Compatibilidad Química no encontrada o vacía para esta conversación.</h1>');
    }

    const html = renderMatrixTable('Matriz de Compatibilidad y Almacenamiento Químico', session.matrixRows);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    logger.error('[Canvas Chemical View GET] Error:', error);
    res.status(500).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Error al generar la vista de la matriz química.</h1>');
  }
});

/**
 * GET /api/sgsst/canvas/chemical/:conversationId/excel
 * Descarga la matriz de Compatibilidad Química en formato Excel (.xlsx).
 */
router.get('/chemical/:conversationId/excel', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const session = await ChemicalCompatibilitySession.findOne({ conversationId });

    if (!session || !session.matrixRows || session.matrixRows.length === 0) {
      return res.status(404).send('Matriz no encontrada o vacía.');
    }

    const buffer = await exportCompatibilidadToExcel(session.matrixRows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Matriz_Quimica_${conversationId}.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    logger.error('[Canvas Chemical Excel GET] Error:', error);
    res.status(500).send('Error al descargar el archivo Excel');
  }
});

module.exports = router;
