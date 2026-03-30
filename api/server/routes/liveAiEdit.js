'use strict';

/**
 * liveAiEdit.js — Inline AI text editing for the Live Analysis Editor
 * POST /api/live/ai-edit-text
 * Body: { selectedText, instruction, surroundingContext?, fullReportText?, reportSourceData? }
 * Response: { editedText }
 */

const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS } = require('./sgsst/sgsstGemini');
const { logger } = require('~/config');

router.post('/ai-edit-text', requireJwtAuth, async (req, res) => {
  const { selectedText, instruction, surroundingContext, fullReportText, reportSourceData } = req.body;
  const userId = req.user?.id;

  if (!selectedText || !instruction) {
    return res.status(400).json({ error: 'selectedText e instruction son requeridos.' });
  }

  // Build the source data context block if provided
  let sourceDataBlock = '';
  if (reportSourceData) {
    try {
      const dataStr = typeof reportSourceData === 'string'
        ? reportSourceData
        : JSON.stringify(reportSourceData, null, 2);
      // Limit to 4000 chars to avoid token overflow
      sourceDataBlock = `
DATOS DE ORIGEN DEL INFORME (base de datos utilizada para generar el informe):
\`\`\`json
${dataStr.slice(0, 4000)}${dataStr.length > 4000 ? '\n...(truncado)' : ''}
\`\`\`
`;
    } catch (e) {
      // ignore serialization errors
    }
  }

  // Use the entire report text if available, otherwise fall back to surroundingContext
  const reportContext = fullReportText || surroundingContext || '';

  const prompt = `
Eres un asistente experto en redacción de informes técnicos de Seguridad y Salud en el Trabajo (SST/HSE).

TAREA: Editar el fragmento de texto indicado según la instrucción del usuario, usando como contexto el informe completo y los datos de origen.
${sourceDataBlock}
INFORME COMPLETO (para coherencia y contexto):
"""
${reportContext.slice(0, 6000)}${reportContext.length > 6000 ? '\n...(fragmento truncado)' : ''}
"""

TEXTO SELECCIONADO A EDITAR:
"""
${selectedText}
"""

INSTRUCCIÓN DEL USUARIO:
"""
${instruction}
"""

REGLAS CRÍTICAS:
1. Si la instrucción requiere de datos actuales, normativa reciente, artículos o investigaciones, UTILIZA TU HERRAMIENTA DE BÚSQUEDA WEB para fundamentarte antes de responder.
2. Devuelve ÚNICAMENTE el texto editado, sin explicaciones, sin comillas envolventes, sin prefijos.
3. Mantén el mismo formato HTML si el texto lo tiene (p, li, h3, strong, etc.).
4. Mantén coherencia con el informe completo y con los datos de origen.
5. Escribe en el mismo idioma del texto original (normalmente español).
6. NO inventes datos; básate fuertemente en tu BÚSQUEDA WEB si no conoces la información, o en los DATOS DE ORIGEN provistos.
`;

  try {
    const modelName = SGSST_FALLBACK_MODELS[0];
    logger.info(`[LiveAiEdit] Editing text for user ${userId}, model: ${modelName}, reportLen: ${reportContext.length}, hasSourceData: ${!!reportSourceData}, usingWebSearch: true`);

    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: true });
    let editedText = result.response.text().trim();

    logger.info(`[LiveAiEdit] Done — original: ${selectedText.length} chars → edited: ${editedText.length} chars`);
    return res.json({ editedText });

  } catch (err) {
    logger.error('[LiveAiEdit] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
