'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
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
REGLA CRÍTICA ABSOLUTA: PROHIBIDO dejar campos vacíos o usar "Ninguno" en "factores_reduccion". Aún si el riesgo es Aceptable, DEBES proponer controles de Mejora Continua (capacitaciones, pausas) y redactar en "factores_reduccion" la justificación costo-beneficio según el Anexo E.

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

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
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

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: userId }).lean();
    } catch (e) {
      logger.warn('[GTC45] Could not load CompanyInfo', e);
    }

    const currentDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const headerHTML = buildStandardHeader({
      title: 'INFORME EJECUTIVO DE RIESGOS IPEVAR - GTC-45',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'GTC-45:2012 / Decreto 1072 de 2015',
      responsibleName: req.user?.name,
    });

    const matrixSummary = matrixRows.map((r, i) =>
      `[${i+1}] Proceso: ${r.proceso} | Actividad: ${r.actividad} | Clasificación: ${r.peligro_clasificacion} | Peligro: ${r.peligro_descripcion} | NR: ${r.nr} (${r.interpretacion_nr}) | Exp: ${r.efectos_posibles}`
    ).join('\n');

    const prompt = `Eres un auditor experto en Seguridad y Salud en el Trabajo bajo la metodología GTC-45:2012 en Colombia.
Analiza esta Matriz IPEVAR completa y emite un Informe Ejecutivo integral.

**INSTRUCCIONES DE FORMATO HTML:**
- Responde EXCLUSIVAMENTE en HTML limpio, listo para inyectarse en el DOM. NO uses \`\`\`html.
- TODAS las tablas deben llevar: \`<table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">\`
- Headers de tablas (<th>): \`<th style="background-color:#0f766e;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">\`
- Celdas (<td>): \`<td style="padding:10px 14px;border-bottom:1px solid #f0fdfa;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">\`
- Headers de sección (H3): \`<h3 style="color:#0f766e; margin-top:30px; border-bottom:1px solid #ccc; padding-bottom:5px;">\`

**ESTRUCTURA DEL INFORME EXIGIDA (en HTML):**
1. **Introducción:** Breve contexto gerencial (1 párrafo).
2. **Hallazgos Críticos:** Menciona los riesgos con Mayor NR (Rojos / No Aceptables) y sus consecuencias (efectos posibles). Crea una tabla resumen con: Proceso, Actividad, Peligro y NR.
3. **Brechas en Controles:** Evalúa la jerarquía de controles actual de la matriz suministrada.
4. **Plan de Acción Gerencial:** Propuesta de controles de ingeniería y administrativos recomendados (Tabla de 3 columnas: Proceso, Recomendaciones, Tipo de Control recomendado).
5. NO incluyas título principal ni encabezado corporativo (el sistema los inyectará antes).
6. NO incluyas bloque de firmas en tu respuesta de HTML (el sistema las inyectará debajo).

**MATRIZ COMPLETA (${matrixRows.length} riesgos evaluados):**
${matrixSummary}

**INSTRUCCIÓN ESPECÍFICA (opcional):**
${instruction || 'Generar informe ejecutivo de alto nivel priorizando los procesos más peligrosos de acuerdo a los resultados.'}
`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const analysisRaw = result.response.text();
    const htmlBody = analysisRaw.replace(/```html\n ?/g, '').replace(/```\n?/g, '').trim();

    let fullReport = headerHTML + '<div style="margin-top:20px;">' + htmlBody + '</div>';
    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    logger.info(`[GTC45/ai-analyze-matrix] HTML Analysis generated for user ${userId}, ${matrixRows.length} rows`);
    return res.json({ analysis: fullReport });

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

