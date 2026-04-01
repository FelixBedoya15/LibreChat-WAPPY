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
const axios = require('axios');

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

  // 1. WEB SEARCH (SearXNG) Integration
  let webContext = '';
  try {
      const searxngUrl = process.env.SEARXNG_INSTANCE_URL || 'https://searxng.wappy-ia.com/search';
      
      // Perform a search based on the instruction provided by the user
      const searchResponse = await axios.get(searxngUrl, {
          params: { q: instruction, format: 'json', language: 'es' },
          timeout: 5000
      });

      if (searchResponse.data && searchResponse.data.results && searchResponse.data.results.length > 0) {
          const topResults = searchResponse.data.results.slice(0, 3);
          const formattedResults = topResults.map(r => `- ${r.title}: ${r.content}`).join('\n');
          webContext = `\nCONTEXTO ENCONTRADO EN INTERNET (SearXNG):\n${formattedResults}\n`;
      }
  } catch (searchError) {
      logger.warn(`[LiveAiEdit] SearXNG Web Search failed: ${searchError.message}`);
  }

  let fieldSpecificPrompt = '';
  if (reportSourceData && reportSourceData.field) {
    if (reportSourceData.field.includes('Anexo E') || reportSourceData.field.includes('Reducción')) {
      fieldSpecificPrompt = `ATENCIÓN: Estás editando el campo de 'Factores de Reducción (Anexo E)' de la matriz GTC-45.
CRÍTICO: Según el Anexo E de la GTC 45, tu análisis DEBE enfocarse en JUSTIFICAR EL CONTROL PROPUESTO evaluando el COSTO-BENEFICIO. 
NO recites fórmulas matemáticas ni expliques cómo se calculó el Nivel de Riesgo. Analiza si el control planteado tiene un impacto real (Factor de Reducción) y si su implementación es lógica, viable y económicamente justificada dada la magnitud del riesgo.`;
    }
  }

  const prompt = `
Eres un asistente experto en redacción de informes técnicos de Seguridad y Salud en el Trabajo (SST/HSE).

TAREA: Editar el fragmento de texto indicado según la instrucción del usuario, usando como contexto el informe completo y los datos de origen.
${fieldSpecificPrompt}
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
${webContext}
REGLAS CRÍTICAS:
1. Si se te provee el "CONTEXTO ENCONTRADO EN INTERNET (SearXNG)", utilízalo para fundamentar tu respuesta aportando datos precisos y actualizados.
2. Devuelve ÚNICAMENTE el texto editado, sin explicaciones, sin comillas envolventes, sin prefijos.
3. Mantén el mismo formato HTML si el texto lo tiene (p, li, h3, strong, etc.).
4. Mantén coherencia con el informe completo y con los datos de origen.
5. Escribe en el mismo idioma del texto original (normalmente español).
6. NO inventes datos; básate fuertemente en el CONTEXTO ENCONTRADO EN INTERNET o en los DATOS DE ORIGEN provistos.
`;

  try {
    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    logger.info(`[LiveAiEdit] Editing text for user ${userId}, model: ${modelName}, reportLen: ${reportContext.length}, hasSourceData: ${!!reportSourceData}, usingSearXNG: ${webContext.length > 0}`);

    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    let editedText = result.response.text().trim();

    logger.info(`[LiveAiEdit] Done — original: ${selectedText.length} chars → edited: ${editedText.length} chars`);
    return res.json({ editedText });

  } catch (err) {
    logger.error('[LiveAiEdit] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
