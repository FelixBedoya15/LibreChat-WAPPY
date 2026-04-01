'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS } = require('./sgsstGemini');

// GET matrix for a conversation
router.get('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    logger.info(`[GTC45Workspace GET] conversationId=${conversationId} | userId=${userId}`);

    let session = await GTC45WorkspaceSession.findOne({ conversationId, user: userId });
    logger.info(`[GTC45Workspace GET] primary lookup result: ${session ? `found (rows=${session.matrixRows?.length})` : 'NOT FOUND'}`);

    if (!session) {
      session = await GTC45WorkspaceSession.findOne({ conversationId });
      logger.info(`[GTC45Workspace GET] fallback lookup result: ${session ? `found (user=${session.user}, rows=${session.matrixRows?.length})` : 'NOT FOUND'}`);
      if (session && !session.user) {
        session.user = userId;
        await session.save();
        logger.info(`[GTC45Workspace GET] Adopted legacy session ${conversationId} for user ${userId}`);
      }
    }

    if (!session) {
      const allSessions = await GTC45WorkspaceSession.find({}, { conversationId: 1, user: 1, _id: 0 }).limit(20);
      logger.info(`[GTC45Workspace GET] No session found. All sessions in DB: ${JSON.stringify(allSessions)}`);
      return res.json({ matrixRows: [], chartConclusions: {} });
    }

    res.json({ matrixRows: session.matrixRows, chartConclusions: session.chartConclusions || {} });
  } catch (error) {
    logger.error('[GTC45Workspace] Error fetching matrix:', error);
    res.status(500).json({ error: 'Failed to fetch matrix' });
  }
});


// UPDATE matrix for a conversation
router.put('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { matrixRows } = req.body;
    const userId = req.user.id;

    let session = await GTC45WorkspaceSession.findOneAndUpdate(
      { conversationId },
      {
        $set: { matrixRows: matrixRows || [] },
        $setOnInsert: { user: userId },
      },
      { upsert: true, new: true },
    );

    res.json({ success: true, matrixRows: session.matrixRows });
  } catch (error) {
    logger.error('[GTC45Workspace] Error updating matrix:', error);
    res.status(500).json({ error: 'Failed to update matrix' });
  }
});


// ─── IA: Actualizar una fila con IA (contexto = solo esa fila) ─────────────────
router.post('/ai-update-row', requireJwtAuth, async (req, res) => {
  try {
    const { row } = req.body;
    const userId = req.user?.id;

    if (!row) return res.status(400).json({ error: 'Se requiere el objeto row.' });

    const prompt = `Eres un experto certificado en Seguridad y Salud en el Trabajo y en la metodología GTC-45:2012 colombiana.

Tienes la siguiente fila de una Matriz IPEVAR que necesita ser completada o actualizada:

PELIGRO: ${row.peligro_descripcion || 'No especificado'}
CLASIFICACIÓN: ${row.peligro_clasificacion || 'No especificada'}
PROCESO: ${row.proceso || ''} | ZONA: ${row.zona || ''} | ACTIVIDAD: ${row.actividad || ''}
TAREAS: ${row.tareas || ''}
EFECTOS POSIBLES: ${row.efectos_posibles || 'No definidos'}
CONTROLES EXISTENTES — Fuente: ${row.controles_fuente || 'Ninguno'} | Medio: ${row.controles_medio || 'Ninguno'} | Individuo: ${row.controles_individuo || 'Ninguno'}
ND actual: ${row.nd || 'No definido'} | NE actual: ${row.ne || 'No definido'} | NC actual: ${row.nc || 'No definido'}

INSTRUCCION: Completa y optimiza esta fila según GTC-45:2012. Para peligros higiénicos (Físico, Químico, Biológico, Psicosocial, Biomecánico) usa el Anexo C para determinar el ND cualitativo.
REGLA CRÍTICA: NUNCA dejes las medidas propuestas en "Ninguno" si el Riesgo actual requiere intervención. Propón intervenciones viables (Ingeniería, Administrativas o EPP) y SIEMPRE redacta su justificación de costo-beneficio obligatoria en "factores_reduccion".

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin comillas envolventes) con estos campos exactos:
{
  "nd": <número 1-10>,
  "ne": <número 1-4>,
  "nc": <número 10|25|60|100|150>,
  "np": <nd * ne>,
  "nr": <np * nc>,
  "interpretacion_nr": <"I"|"II"|"III"|"IV">,
  "aceptabilidad": <"No Aceptable"|"No Aceptable o Aceptable con control específico"|"Aceptable"|"Mejorable">,
  "efectos_posibles": "<efectos técnicos específicos>",
  "controles_fuente": "<control en la fuente o Ninguno>",
  "controles_medio": "<control en el medio o Ninguno>",
  "controles_individuo": "<EPP o Ninguno>",
  "medida_eliminacion": "<medida o Ninguno>",
  "medida_sustitucion": "<medida o Ninguno>",
  "medida_ingenieria": "<control de ingeniería propuesto o Ninguno>",
  "medida_administrativa": "<control administrativo propuesto o Ninguno>",
  "medida_eppu": "<EPP recomendado específico o Ninguno>",
  "factores_reduccion": "<Anexo E OBLIGATORIO: Justificación técnica y financiera (costo-beneficio) de los controles propuestos. NUNCA DEJAR VACÍO.>",
  "nd_cualitativo": <10|6|2|0 si aplica Anexo C, null si no>
}`;

    const modelName = SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    let text = result.response.text().trim();

    // Strip eventual markdown code fences
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let updatedFields;
    try {
      updatedFields = JSON.parse(text);
    } catch (parseErr) {
      logger.error('[GTC45/ai-update-row] JSON parse error:', parseErr.message, 'Raw:', text.slice(0, 500));
      return res.status(500).json({ error: 'La IA devolvió un formato JSON inválido. Intenta de nuevo.' });
    }

    // Recalculate np and nr server-side for safety
    if (updatedFields.nd && updatedFields.ne) updatedFields.np = updatedFields.nd * updatedFields.ne;
    if (updatedFields.np && updatedFields.nc) updatedFields.nr = updatedFields.np * updatedFields.nc;

    logger.info(`[GTC45/ai-update-row] Row updated for user ${userId}, NR=${updatedFields.nr}`);
    return res.json({ updatedFields });

  } catch (error) {
    logger.error('[GTC45/ai-update-row] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});


// ─── IA: Analizar toda la matriz (contexto completo) ──────────────────────────
router.post('/ai-analyze-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { matrixRows, instruction } = req.body;
    const userId = req.user?.id;

    if (!matrixRows || !matrixRows.length) return res.status(400).json({ error: 'La matriz está vacía.' });

    const matrixSummary = matrixRows.map((r, i) =>
      `[${i+1}] ${r.proceso} | ${r.actividad} | ${r.peligro_clasificacion} | Peligro: ${r.peligro_descripcion} | NR: ${r.nr}`
    ).join('\n');

    const prompt = `Eres un experto en GTC-45:2012. Analiza esta Matriz IPEVAR completa y responde a la instrucción del auditor.

MATRIZ COMPLETA (${matrixRows.length} riesgos):
${matrixSummary}

DATOS DETALLADOS (JSON):
${JSON.stringify(matrixRows, null, 2).slice(0, 6000)}

INSTRUCCIÓN DEL AUDITOR:
${instruction || 'Proporciona un análisis ejecutivo de los principales hallazgos de riesgo, identifica los procesos más críticos y las brechas en los controles existentes.'}

Responde en español, de forma técnica y estructurada, máximo 500 palabras. Sin bloques de código.`;

    const modelName = SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const analysis = result.response.text().trim();

    logger.info(`[GTC45/ai-analyze-matrix] Analysis generated for user ${userId}, ${matrixRows.length} rows`);
    return res.json({ analysis });

  } catch (error) {
    logger.error('[GTC45/ai-analyze-matrix] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});


// ─── IA: Generar y guardar conclusión de gráfico del dashboard ────────────────
router.post('/ai-chart-conclusion', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId, chartType, matrixRows, chartStats } = req.body;
    const userId = req.user?.id;

    if (!conversationId || !chartType) return res.status(400).json({ error: 'conversationId y chartType son requeridos.' });

    const chartDescriptions = {
      clasificacion: 'distribución de riesgos por tipo de peligro y nivel de riesgo promedio (NR)',
      controles: 'cobertura de la jerarquía de controles (en la fuente, en el medio, en el individuo)',
      enfermedades: 'principales enfermedades potenciales identificadas según efectos vs. controles existentes',
      procesos: 'mapa de calor de nivel de riesgo promedio por proceso o área de trabajo',
    };

    const matrixSummary = (matrixRows || []).map((r, i) =>
      `${r.peligro_clasificacion} | ${r.proceso} | NR:${r.nr} | Efectos: ${r.efectos_posibles?.slice(0,80)} | EPP: ${r.medida_eppu?.slice(0,50)}`
    ).join('\n').slice(0, 3000);

    const prompt = `Eres un profesional experto en Seguridad y Salud en el Trabajo (SST/HSE) especializado en análisis de riesgos GTC-45.

Con base en los siguientes datos del gráfico de "${chartDescriptions[chartType] || chartType}" de una Matriz IPEVAR GTC-45:

ESTADÍSTICAS DEL GRÁFICO:
${JSON.stringify(chartStats || {}, null, 2)}

RESUMEN DE LA MATRIZ (${(matrixRows || []).length} riesgos):
${matrixSummary}

Redacta una conclusión técnica profesional de 3 a 5 oraciones que:
1. Resuma el hallazgo más crítico visible en este gráfico
2. Identifique la principal brecha o fortaleza en gestión de riesgos
3. Proponga 1 acción correctiva/preventiva prioritaria y cuantificable

Escribe en español técnico, sin encabezados, sin bullets, como párrafo fluido.`;

    const modelName = SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const conclusion = result.response.text().trim();

    // Persist the conclusion in MongoDB
    await GTC45WorkspaceSession.findOneAndUpdate(
      { conversationId },
      { $set: { [`chartConclusions.${chartType}`]: conclusion } },
      { upsert: true, new: true }
    );

    logger.info(`[GTC45/ai-chart-conclusion] Conclusion saved for chart '${chartType}', conv=${conversationId}`);
    return res.json({ conclusion });

  } catch (error) {
    logger.error('[GTC45/ai-chart-conclusion] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

