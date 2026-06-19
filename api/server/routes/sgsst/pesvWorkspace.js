'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const PESVWorkspaceSession = require('~/models/PESVWorkspaceSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildSignatureSection } = require('./reportHeader');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS } = require('./sgsstGemini');

function toSentenceCase(str) {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

// GET matrix
router.get('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    let session = await PESVWorkspaceSession.findOne({ conversationId, user: userId, companyId: companyId });

    if (!session) {
      session = await PESVWorkspaceSession.findOne({ conversationId });
      if (session) {
        let modified = false;
        if (!session.user) {
          session.user = userId;
          modified = true;
        }
        if (!session.companyId && companyId) {
          session.companyId = companyId;
          modified = true;
        }
        if (modified) await session.save();
      }
    }

    if (!session && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const { Conversation } = require('~/db/models');
      const convo = await Conversation.findOne({ conversationId }, 'createdAt').lean();
      const isNewConvo = convo && convo.createdAt && (Date.now() - new Date(convo.createdAt).getTime() < 120000);

      if (isNewConvo) {
        const tempId = `temp-${userId}`;
        const tempSession = await PESVWorkspaceSession.findOne({ conversationId: tempId, user: userId });
        if (tempSession) {
          tempSession.conversationId = conversationId;
          tempSession.companyId = companyId;
          await tempSession.save();
          session = tempSession;
        }
      }
    }

    if (!session) {
      return res.json({ matrixRows: [], chartConclusions: {} });
    }

    res.json({ matrixRows: session.matrixRows, chartConclusions: session.chartConclusions || {} });
  } catch (error) {
    logger.error('[PESVWorkspace] Error fetching matrix:', error);
    res.status(500).json({ error: 'Failed to fetch PESV matrix' });
  }
});

// UPDATE matrix
router.put('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { matrixRows } = req.body;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    const normalizedRows = (matrixRows || []).map(row => ({
      ...row,
      proceso: toSentenceCase(row.proceso),
      zona: toSentenceCase(row.zona)
    }));

    let session = await PESVWorkspaceSession.findOneAndUpdate(
      { conversationId, companyId: companyId },
      {
        $set: { matrixRows: normalizedRows, companyId },
        $setOnInsert: { user: userId },
      },
      { upsert: true, new: true },
    );

    if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const tempId = `temp-${userId}`;
      await PESVWorkspaceSession.deleteOne({ conversationId: tempId, user: userId });
      logger.info(`[PESVWorkspace PUT] Deleted temporary session for user ${userId} since real session was created.`);
    }

    res.json({ success: true, matrixRows: session.matrixRows });
  } catch (error) {
    logger.error('[PESVWorkspace] Error updating matrix:', error);
    res.status(500).json({ error: 'Failed to update PESV matrix' });
  }
});

// AI Update Row
router.post('/ai-update-row', requireJwtAuth, async (req, res) => {
  try {
    const { row } = req.body;
    const userId = req.user?.id;

    if (!row) return res.status(400).json({ error: 'Se requiere el objeto row.' });

    const prompt = `Eres un experto certificado en el Plan Estratégico de Seguridad Vial (PESV) en Colombia y la normatividad de la Resolución 40595 de 2022.
Tienes esta fila de Matriz de Riesgos Viales con datos fijados por el usuario que JAMÁS debes modificar:

═══ DATOS FIJOS (NO MODIFICAR) ═══
PROCESO: ${row.proceso || ''}
ZONA/TRAYECTO: ${row.zona || ''}
ACTOR VIAL: ${row.actor_vial || ''}
TIPO DESPLAZAMIENTO: ${row.tipo_desplazamiento || ''}
FACTOR DE RIESGO VIAL: ${row.factor_riesgo || ''}
PELIGRO/DESCRIPCIÓN: ${row.peligro_descripcion || ''}
EFECTOS POSIBLES/CONSECUENCIAS: ${row.consecuencias || ''}
CONTROLES EXISTENTES:
  - En la Persona: ${row.controles_existentes_persona || 'Ninguno'}
  - En el Vehículo: ${row.controles_existentes_vehiculo || 'Ninguno'}
  - En la Vía / Entorno: ${row.controles_existentes_via || 'Ninguno'}
Probabilidad actual: ${row.probabilidad || 'No definida'} | Severidad actual: ${row.severidad || 'No definida'}

═══ TU ÚNICA TAREA ═══
Basándote EXCLUSIVAMENTE en los datos fijos de arriba (no los modifiques ni inventes controles existentes nuevos):
1. Determina el Nivel de Probabilidad (1 a 4) y el Nivel de Severidad (10, 25, 60 o 100) según criterios técnicos del PESV.
2. Propón medidas de ELIMINACIÓN, SUSTITUCIÓN, INGENIERÍA, ADMINISTRATIVAS y EPP/Seguridad Pasiva adecuadas específicas para riesgo vial.
3. Completa factores_reduccion con justificación técnica y costo-beneficio de controles propuestos.
4. Asigna un responsable de los controles (ej. Responsable PESV, Gestor de Flota, Conductor).

REGLA ABSOLUTA: Mantén "controles_existentes_persona", "controles_existentes_vehiculo" y "controles_existentes_via" idénticos a los fijados arriba.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con estos campos exactos:
{
  "probabilidad": <número 1-4>,
  "severidad": <número 10|25|60|100>,
  "nivel_riesgo": <probabilidad * severidad>,
  "interpretacion_nr": "<Crítico|Alto|Medio|Bajo>",
  "aceptabilidad": "<No Aceptable|No Aceptable o Aceptable con Control Específico|Aceptable con Control Específico|Aceptable>",
  "controles_existentes_persona": "${(row.controles_existentes_persona || 'Ninguno').replace(/"/g, '\\"')}",
  "controles_existentes_vehiculo": "${(row.controles_existentes_vehiculo || 'Ninguno').replace(/"/g, '\\"')}",
  "controles_existentes_via": "${(row.controles_existentes_via || 'Ninguno').replace(/"/g, '\\"')}",
  "medida_eliminacion": "<medida propuesta o Ninguno>",
  "medida_sustitucion": "<medida propuesta o Ninguno>",
  "medida_ingenieria": "<control de ingeniería o seguridad pasiva propuesto o Ninguno>",
  "medida_administrativa": "<control administrativo, capacitación, rutograma propuesto o Ninguno>",
  "medida_eppu": "<EPP/seguridad pasiva específico recomendado o Ninguno>",
  "factores_reduccion": "<Justificación costo-beneficio y mecanismo técnico de reducción del riesgo vial. NUNCA VACÍO.>",
  "responsable": "<Responsable de implementar el control, ej: Coordinador PESV o Conductor>"
}`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    let text = result.response.text().trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let updatedFields;
    try {
      updatedFields = JSON.parse(text);
    } catch (parseErr) {
      logger.error('[PESV/ai-update-row] JSON parse error:', parseErr.message, 'Raw:', text.slice(0, 500));
      return res.status(500).json({ error: 'La IA devolvió un formato JSON inválido. Intenta de nuevo.' });
    }

    if (updatedFields.probabilidad && updatedFields.severidad) {
      updatedFields.nivel_riesgo = updatedFields.probabilidad * updatedFields.severidad;
    }

    return res.json({ updatedFields });
  } catch (error) {
    logger.error('[PESV/ai-update-row] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Helper: Generar HTML de gráficas PESV
function getHexPESVColor(nr) {
  if (nr >= 200) return '#dc2626'; // Rojo - Crítico
  if (nr >= 100) return '#ea580c'; // Naranja - Alto
  if (nr >= 40) return '#eab308'; // Amarillo - Medio
  return '#16a34a'; // Verde - Bajo
}

function buildPesvChartsHtml(matrixRows) {
  if (!matrixRows || matrixRows.length === 0) return '';
  
  const mapActor = {};
  matrixRows.forEach(r => {
    const k = (r.actor_vial || 'Sin clasificar').trim();
    if (!mapActor[k]) mapActor[k] = { count: 0, totalNR: 0 };
    mapActor[k].count++;
    mapActor[k].totalNR += Number(r.nivel_riesgo) || 0;
  });
  const chartActor = Object.entries(mapActor).map(([actor, d]) => ({ actor, count: d.count, avg: Math.round(d.totalNR / d.count) })).sort((a,b) => b.avg - a.avg);
  const maxActor = Math.max(...chartActor.map(d => d.avg), 1);

  const mapFactor = {};
  matrixRows.forEach(r => {
    const k = (r.factor_riesgo || 'Sin clasificar').trim();
    if (!mapFactor[k]) mapFactor[k] = { count: 0, totalNR: 0 };
    mapFactor[k].count++;
    mapFactor[k].totalNR += Number(r.nivel_riesgo) || 0;
  });
  const chartFactor = Object.entries(mapFactor).map(([factor, d]) => ({ factor, count: d.count, avg: Math.round(d.totalNR / d.count) })).sort((a,b) => b.avg - a.avg);
  const maxFactor = Math.max(...chartFactor.map(d => d.avg), 1);

  const empty = (v) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', ''].includes(String(v).toLowerCase().trim());
  let persona = 0, vehiculo = 0, via = 0;
  matrixRows.forEach(r => {
    if (!empty(r.controles_existentes_persona)) persona++;
    if (!empty(r.controles_existentes_vehiculo)) vehiculo++;
    if (!empty(r.controles_existentes_via)) via++;
  });
  const total = matrixRows.length || 1;
  const chartControls = [
    { label: 'En el Factor Humano (Persona)', value: persona, pct: Math.round((persona/total)*100) },
    { label: 'En el Vehículo', value: vehiculo, pct: Math.round((vehiculo/total)*100) },
    { label: 'En la Vía / Entorno', value: via, pct: Math.round((via/total)*100) },
  ];

  function renderBar(label, value, max, color) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return `
      <div style="display:flex; align-items:center; margin-bottom:8px;">
        <div style="width:180px; font-size:11px; color:#475569; font-weight:600; text-align:right; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${label}">${label}</div>
        <div style="flex:1; background-color:#f1f5f9; border-radius:10px; height:16px; position:relative; overflow:hidden;">
          <div style="background-color:${color}; width:${Math.max(5, pct)}%; height:100%; border-radius:10px; display:flex; align-items:center; justify-content:flex-end; padding-right:8px; color:white; font-size:10px; font-weight:bold;">
            ${value}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div style="margin: 25px 0; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #f8fafc; page-break-inside: avoid;">
      <h3 style="color:#0369a1; font-size:16px; margin-top:0; border-bottom:2px solid #0369a1; padding-bottom:8px; margin-bottom:20px; text-transform:uppercase;">
          ANALÍTICA PESV — DIAGNÓSTICO VIAL (Gráficas)
      </h3>
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Riesgo Promedio por Actor Vial (NR Promedio)</h4>
          ${chartActor.map(d => renderBar(d.actor, d.avg, maxActor, getHexPESVColor(d.avg))).join('')}
        </div>
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Riesgo Promedio por Factor PESV</h4>
          ${chartFactor.map(d => renderBar(d.factor, d.avg, maxFactor, getHexPESVColor(d.avg))).join('')}
        </div>
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Efectividad de Controles Existentes</h4>
          ${chartControls.map(d => renderBar(d.label, d.pct, 100, '#0ea5e9') + `<div style="font-size:9px; color:#64748b; text-align:right; margin-bottom:5px; margin-top:-3px;">Cobertura: ${d.pct}% riesgos</div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// AI Analyze Matrix (PESV Report)
router.post('/ai-analyze-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { matrixRows, instruction } = req.body;
    const userId = req.user?.id;

    if (!matrixRows || !matrixRows.length) return res.status(400).json({ error: 'La matriz PESV está vacía.' });

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: userId }).lean();
    } catch (e) {
      logger.warn('[PESVWorkspace] Could not load CompanyInfo', e);
    }

    const { buildStandardHeader } = require('./reportHeader');
    const currentDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const headerHTML = buildStandardHeader({
      title: 'INFORME DE EVALUACIÓN DE RIESGOS VIALES Y PESV',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Resolución 40595 de 2022 (PESV) / Ley 1503 de 2011',
      responsibleName: req.user?.name,
    });

    const matrixSummary = matrixRows.map((r, i) =>
      `[${i+1}] Actor: ${r.actor_vial} | Desplazamiento: ${r.tipo_desplazamiento} | Factor: ${r.factor_riesgo} | Peligro: ${r.peligro_descripcion} | NR: ${r.nivel_riesgo} (${r.interpretacion_nr}) | Consecuencia: ${r.consecuencias}`
    ).join('\n');

    const prompt = `Eres un auditor certificado y consultor experto en Planes Estratégicos de Seguridad Vial (PESV) según la Resolución 40595 de 2022 en Colombia.
Analiza esta Matriz PESV de riesgos viales y emite un Informe Técnico y Ejecutivo integral MUY EXTENSO, sumamente detallado y analítico.

**INSTRUCCIONES DE FORMATO HTML:**
- Responde EXCLUSIVAMENTE en HTML limpio, listo para inyectarse en el DOM. NO uses \`\`\`html.
- TODAS las tablas deben llevar: <table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #e0f2fe;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
- Headers de tablas (<th>): <th style="background-color:#0369a1;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">
- Celdas (<td>): <td style="padding:10px 14px;border-bottom:1px solid #f0f9ff;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">
- Headers de sección (H3): <h3 style="color:#0369a1; margin-top:30px; border-bottom:1px solid #ccc; padding-bottom:5px;">

**ESTRUCTURA DEL INFORME EXIGIDA (en HTML):**
1. **Introducción y Objetivos Viales**: Contextualización sobre la importancia del PESV en la empresa, alcance e impacto legal.
2. **Análisis de Indicadores y Gráficas de Seguridad Vial**:
    - a. Análisis de riesgos por actor vial (Peatones, Ciclistas, Conductores de Moto, Coche, Carga Pesada).
    - b. Evaluación de factores de riesgo vial (Factor Humano, Factor Vehículo, Factor Vía y Entorno).
    - c. Balance de la jerarquía de controles actual en las operaciones de tránsito.
3. **Peligros Viales Críticos**: Identificación de los eventos viales más graves (ej: exceso de velocidad, microsueños, mantenimiento deficiente) y sus consecuencias civiles, penales y operativas. Incluye tabla con columnas: Actor Vial, Peligro Crítico, Nivel de Riesgo y Responsable.
4. **Plan de Acción y Seguridad Activa/Pasiva**: Propuesta de intervención de controles (Eliminación, Sustitución, Ingeniería, Administrativos, EPP) abarcando capacitaciones, rutogramas e inspecciones preoperacionales.
5. **Conclusión y Recomendaciones de Mejora Continua**: Integración del PESV con el SG-SST de la empresa.

MATRIZ COMPLETA A ANALIZAR:
${matrixSummary}

INSTRUCCIÓN ADICIONAL: ${instruction || 'Generar análisis exhaustivo según Resolución 40595 de 2022.'}`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const htmlBody = result.response.text().replace(/```html\n ?/g, '').replace(/```\n?/g, '').trim();
    
    const chartsHTML = buildPesvChartsHtml(matrixRows);

    let fullReport = headerHTML + chartsHTML + '<div style="margin-top:20px;">' + htmlBody + '</div>';
    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    return res.json({ analysis: fullReport });
  } catch (error) {
    logger.error('[PESV/ai-analyze-matrix] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// AI Chart Conclusion
router.post('/ai-chart-conclusion', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId, chartType, matrixRows, chartStats } = req.body;
    const userId = req.user?.id;

    if (!conversationId || !chartType) return res.status(400).json({ error: 'conversationId y chartType son requeridos.' });

    const prompt = `Eres un profesional experto en Seguridad Vial laboral (PESV) en Colombia.
Analiza los datos del gráfico "${chartType}" de una matriz PESV:

ESTADÍSTICAS DEL GRÁFICO:
${JSON.stringify(chartStats || {}, null, 2)}

Redacta una conclusión técnica profesional de 3 a 5 oraciones que resuma el hallazgo crítico en este gráfico, identifique brechas viales y proponga 1 acción correctiva concreta. Escribe como un párrafo fluido, sin bullets ni encabezados.`;

    const modelName = SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const conclusion = result.response.text().trim();

    await PESVWorkspaceSession.findOneAndUpdate(
      { conversationId },
      { $set: { [`chartConclusions.${chartType}`]: conclusion } },
      { upsert: true, new: true }
    );

    return res.json({ conclusion });
  } catch (error) {
    logger.error('[PESV/ai-chart-conclusion] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// AI Parse Matrix
router.post('/ai-parse-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { rawRows } = req.body;
    const userId = req.user?.id;

    if (!rawRows || !Array.isArray(rawRows)) {
      return res.status(400).json({ error: 'Se requiere una lista de filas en "rawRows".' });
    }

    if (rawRows.length === 0) return res.json({ matrixRows: [] });

    const prompt = `Eres un experto certificado en el Plan Estratégico de Seguridad Vial (PESV) en Colombia.
Te proporciono una lista de filas importadas desde un archivo con columnas arbitrarias.
Analiza los datos y transfórmalos a nuestro formato estándar de matriz PESV:

Estructura requerida para cada objeto de la lista JSON:
{
  "proceso": "<proceso o área en tipo oración>",
  "zona": "<zona, sede o trayecto en tipo oración>",
  "actor_vial": "<Peatón|Pasajero|Conductor de motocicleta|Conductor de vehículo liviano|Conductor de vehículo pesado|Ciclista>",
  "tipo_desplazamiento": "<Misional|In itinere>",
  "factor_riesgo": "<Factor Humano|Factor Vehicular|Factor Infraestructura|Entorno/Otros>",
  "peligro_descripcion": "<descripción clara del peligro vial>",
  "consecuencias": "<lesiones o consecuencias posibles>",
  "controles_existentes_persona": "<controles en la persona o 'Ninguno'>",
  "controles_existentes_vehiculo": "<controles en el vehículo o 'Ninguno'>",
  "controles_existentes_via": "<controles en la vía/entorno o 'Ninguno'>",
  "probabilidad": <número entero 1-4>,
  "severidad": <número entero 10|25|60|100>,
  "medida_eliminacion": "<medida propuesta o 'Ninguno'>",
  "medida_sustitucion": "<medida propuesta o 'Ninguno'>",
  "medida_ingenieria": "<medida propuesta o 'Ninguno'>",
  "medida_administrativa": "<medida propuesta o 'Ninguno'>",
  "medida_eppu": "<medida propuesta o 'Ninguno'>",
  "factores_reduccion": "<mecanismo de reducción del riesgo vial>",
  "responsable": "<Responsable de implementar el control>"
}

Reglas:
1. Calcula la probabilidad (1-4) y severidad (10, 25, 60, 100) según criterios del PESV.
2. El resultado debe ser EXCLUSIVAMENTE una lista JSON válida sin explicaciones ni markdown.

FILAS ORIGINALES:
${JSON.stringify(rawRows, null, 2)}`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    let text = result.response.text().trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) parsed = [parsed];

    const mappedRows = parsed.map(row => ({
      ...row,
      proceso: toSentenceCase(row.proceso || ''),
      zona: toSentenceCase(row.zona || ''),
      nivel_riesgo: (Number(row.probabilidad) || 0) * (Number(row.severidad) || 0),
      interpretacion_nr: (Number(row.probabilidad) || 0) * (Number(row.severidad) || 0) >= 200 ? 'Crítico' : (Number(row.probabilidad) || 0) * (Number(row.severidad) || 0) >= 100 ? 'Alto' : 'Medio',
      aceptabilidad: (Number(row.probabilidad) || 0) * (Number(row.severidad) || 0) >= 200 ? 'No Aceptable' : 'Aceptable con Control Específico',
      id: Date.now().toString() + Math.random().toString(36).substring(7)
    }));

    return res.json({ matrixRows: mappedRows });
  } catch (error) {
    logger.error('[PESV/ai-parse-matrix] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
