'use strict';

/**
 * liveAiEdit.js — Inline AI text editing for the Live Analysis Editor
 * POST /api/live/ai-edit-text
 * Body: { selectedText, instruction, surroundingContext? }
 * Response: { editedText }
 */

const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS } = require('./sgsst/sgsstGemini');
const { logger } = require('~/config');

router.post('/ai-edit-text', requireJwtAuth, async (req, res) => {
  const { selectedText, instruction, surroundingContext } = req.body;
  const userId = req.user?.id;

  if (!selectedText || !instruction) {
    return res.status(400).json({ error: 'selectedText e instruction son requeridos.' });
  }

  const prompt = `
Eres un asistente experto en redacción de informes técnicos de Seguridad y Salud en el Trabajo (SST/HSE).

TAREA: Editar el fragmento de texto indicado según la instrucción del usuario.

CONTEXTO DEL DOCUMENTO (opcional, para coherencia):
"""
${surroundingContext ? surroundingContext.slice(0, 1500) : '(No provisto)'}
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
1. Devuelve ÚNICAMENTE el texto editado, sin explicaciones, sin comillas envolventes, sin prefijos.
2. Mantén el mismo formato HTML de los elementos editados (si el original era <p>, <li>, <h3>, etc.).
3. Mantén coherencia con el contexto del documento.
4. Escribe en el mismo idioma del texto original (normalmente español).
5. NO inventes datos que no existan en el contexto.
`;

  try {
    const modelName = SGSST_FALLBACK_MODELS[0];
    logger.info(`[LiveAiEdit] Editing text for user ${userId}, model: ${modelName}`);

    const result = await generateWithKeyRotation(modelName, userId, prompt);
    const editedText = result.response.text().trim();

    logger.info(`[LiveAiEdit] Done — original: ${selectedText.length} chars → edited: ${editedText.length} chars`);
    return res.json({ editedText });

  } catch (err) {
    logger.error('[LiveAiEdit] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
