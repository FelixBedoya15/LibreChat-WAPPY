'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CanvasSession = require('~/models/CanvasSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { syncCanvasToLiveEditor } = require('./syncBridge');

async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

function hasHeader(html) {
  if (!html) return false;
  const lower = html.toLowerCase();
  return (
    lower.includes('información resumida de la entidad') ||
    lower.includes('linear-gradient') ||
    lower.includes('registro de inducción') ||
    lower.includes('formato de inspección') ||
    lower.includes('datos generales') ||
    lower.includes('proceso: sg-sst') ||
    lower.includes('proceso:sg-sst')
  );
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

  const headerStartIdx = html.indexOf('<div style="background: linear-gradient');
  if (headerStartIdx === -1) {
    const tableStartIdx = html.indexOf('<div style="overflow-x: auto;');
    if (tableStartIdx === -1) return null;

    const endIdx = html.indexOf(tableEndMatch[0], tableStartIdx);
    if (endIdx === -1) return null;
    return html.substring(tableStartIdx, endIdx + tableEndMatch[0].length);
  }

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

  const currentHasHeader = hasHeader(stringContent);
  const currentHasSignature = hasSignature(stringContent);

  if (currentHasHeader && currentHasSignature) {
    return stringContent;
  }

  let headerHtml = null;
  let signatureHtml = null;

  if (existingContent) {
    if (!currentHasHeader) {
      headerHtml = extractExistingHeader(existingContent);
    }
    if (!currentHasSignature) {
      signatureHtml = extractExistingSignature(existingContent);
    }
  }

  let companyInfo = null;
  if ((!currentHasHeader && !headerHtml) || (!currentHasSignature && !signatureHtml)) {
    companyInfo =
      (await CompanyInfo.findOne({ user: userId, isActive: true })) ||
      (await CompanyInfo.findOne({ user: userId }));
  }

  if (!currentHasHeader) {
    if (!headerHtml) {
      headerHtml = buildStandardHeader({
        title: title || 'DOCUMENTO DE TRABAJO',
        companyInfo,
      });
    }
    stringContent = headerHtml + '\n\n' + stringContent;
  }

  if (!currentHasSignature) {
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

    res.json({
      content: session.content,
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

    const processedContent = await processTextDocument(
      finalContent,
      fileType,
      finalTitle,
      userId,
      existingContent,
    );

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

      if (contentChanged || titleChanged) {
        if (isManual) {
          const nextVersion = session.version + 1;

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
    if (versionItem.fileType) {
      session.fileType = versionItem.fileType;
    }

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
 */
router.post('/app-builder/generate', requireJwtAuth, async (req, res) => {
  try {
    const { taskType, systemPrompt, userInput, history, excelCols } = req.body;
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

    if (taskType === 'chat') {
      const prevMsgs = (history || [])
        .map((m) => `${m.sender === 'user' ? 'Usuario' : 'Agente'}: ${m.text}`)
        .join('\n');
      promptText = `Eres un agente de Inteligencia Artificial especializado creado a la medida en el ecosistema WAPPY.
      
## PERSONALIDAD / INSTRUCCIONES DEL SISTEMA
${systemPrompt || 'Eres un asesor empático de seguridad y salud en el trabajo.'}

## CONTEXTO DE LA EMPRESA
${companyContext || 'No hay información de la empresa registrada.'}

## HISTORIAL DE LA CONVERSACIÓN
${prevMsgs || 'Inicio de conversación.'}

## NUEVO MENSAJE DEL USUARIO
Usuario: ${userInput}

Responde de forma concisa, profesional y de acuerdo a tu personalidad. Usa formato markdown para dar estructura si es necesario.`;
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
      promptText = `Genera la estructura de una PRESENTACIÓN DE DIAPOSITIVAS de capacitación de SST:
      
## PROPÓSITO DE LA CAPACITACIÓN
${userInput || 'Capacitación en Higiene Postural y Pausas Activas'}

## INSTRUCCIONES DE COMPORTAMIENTO (ALMA DE IA DEL APLICATIVO)
${systemPrompt || 'Presentación profesional.'}

## CONTEXTO DE LA EMPRESA
${companyContext || 'No hay información de la empresa registrada.'}

## REQUISITO DE RESPUESTA:
Debes responder ÚNICAMENTE con un arreglo JSON válido conteniendo exactamente 5 diapositivas. Cada diapositiva debe tener un "title" y un "content" (un párrafo corto explicativo).
NO incluyas explicaciones ni bloques de código de markdown. Responde solo con el JSON crudo. Ejemplo:
[
  {"title": "...", "content": "..."},
  ...
]`;
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

    const preferredModel = 'gemini-3.5-flash';
    const result = await generateWithKeyRotation(preferredModel, req.user.id, promptText);
    const response = await result.response;
    const outputText = response.text();

    res.json({ result: outputText.trim() });
  } catch (error) {
    logger.error('[AppBuilder Generate API] Error:', error);
    res.status(500).json({ error: error.message || 'Error al procesar la solicitud con IA' });
  }
});

module.exports = router;
