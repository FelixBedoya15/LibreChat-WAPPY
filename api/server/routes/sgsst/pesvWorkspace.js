'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const PESVWorkspaceSession = require('~/models/PESVWorkspaceSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildSignatureSection } = require('./reportHeader');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS, cleanRawRows } = require('./sgsstGemini');

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
      grupo_trabajo: toSentenceCase(row.grupo_trabajo),
      cargo: toSentenceCase(row.cargo)
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
GRUPO TRABAJO: ${row.grupo_trabajo || ''}
CARGO: ${row.cargo || ''}
TIPO DESPLAZAMIENTO: ${row.tipo_desplazamiento || ''}
ROL EN LA VÍA: ${row.rol_via || ''}
FACTOR DE RIESGO VIAL: ${row.factor_riesgo || ''}
PELIGRO/DESCRIPCIÓN: ${row.peligro_descripcion || ''}
CONTROLES EXISTENTES / INTERPRETACIÓN: ${row.controles_existentes_descripcion || 'Ninguno'}
TIPO DE CONTROL EXISTENTE: ${row.controles_existentes_tipo || 'Ninguno'}

═══ TU ÚNICA TAREA ═══
Basándote EXCLUSIVAMENTE en los datos fijos de arriba:
1. Determina los niveles de Probabilidad (NP), Exposición (NE) y Consecuencia (NC) utilizando las siguientes escalas cualitativas de la Guía ANSV 2022 (Paso 6):
   - Nivel de Probabilidad (NP):
     * "MUY PROBABLE" (El evento vial es altamente probable que ocurra - valor 5)
     * "MEDIANAMENTE PROBABLE" (El evento vial es moderadamente probable - valor 4)
     * "PROBABLE" (El evento vial es probable que ocurra - valor 3)
     * "POCO PROBABLE" (El evento vial es poco factible - valor 2)
     * "NO ES PROBABLE" (El evento vial es extremadamente improbable - valor 1)
   - Nivel de Exposición (NE):
     * "CONSTANTE" (Exposición diaria o continua - valor 5)
     * "FRECUENTE" (Exposición regular varias veces a la semana - valor 4)
     * "OCASIONAL" (Exposición esporádica o algunas veces - valor 3)
     * "ESPORADICO" (Exposición muy baja o eventual - valor 2)
     * "MINIMA" (Exposición mínima o casi inexistente - valor 1)
   - Nivel de Consecuencia (NC):
     * "CRITICO" (Fatalidades o incapacidades totales permanentes - valor 5)
     * "PELIGROSO" (Lesiones muy graves con incapacidades permanentes parciales - valor 4)
     * "MODERADO" (Lesiones con incapacidades temporales significativas - valor 3)
     * "MARGINAL" (Lesiones menores con incapacidades breves - valor 2)
     * "INSIGNIFICANTE" (Lesiones muy leves sin incapacidad o daños menores - valor 1)

2. Propón la Acción de Tratamiento ("tratamiento_accion"), que debe ser una de: "ACEPTARLO", "EVITARLO", "ELIMINAR LA FUENTE QUE OCACIONA", "MODIFICAR LOS FACTORES DE EXPOSICION".
3. Propón los planes de acción para el medio ("plan_accion_medio"), para el vehículo ("plan_accion_vehiculo"), para el individuo ("plan_accion_individuo") y para la infraestructura/vía ("plan_accion_infraestructura"). Si no aplica alguno de ellos, pon "Ninguno".
4. Asigna un responsable de los controles ("responsable", ej: Coordinador PESV, Gestor de Flotas, Conductor) y las observaciones pertinentes.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown y sin envolver en \`\`\`json) con estos campos exactos:
{
  "np_cualitativo": "<MUY PROBABLE|MEDIANAMENTE PROBABLE|PROBABLE|POCO PROBABLE|NO ES PROBABLE>",
  "ne_cualitativo": "<CONSTANTE|FRECUENTE|OCASIONAL|ESPORADICO|MINIMA>",
  "nc_cualitativo": "<CRITICO|PELIGROSO|MODERADO|MARGINAL|INSIGNIFICANTE>",
  "tratamiento_accion": "<ACEPTARLO|EVITARLO|ELIMINAR LA FUENTE QUE OCACIONA|MODIFICAR LOS FACTORES DE EXPOSICION>",
  "plan_accion_medio": "<plan propuesto para el medio o 'Ninguno'>",
  "plan_accion_vehiculo": "<plan propuesto para el vehículo o 'Ninguno'>",
  "plan_accion_individuo": "<plan propuesto para el individuo o 'Ninguno'>",
  "plan_accion_infraestructura": "<plan propuesto para la infraestructura o 'Ninguno'>",
  "responsable": "<Coordinador PESV o Conductor o Gestor de Flota>",
  "fecha_programacion": "<fecha o periodicidad, ej: Permanente o Mensual>",
  "observaciones": "<observaciones opcionales o vacías>"
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

    const mapNP = (lbl) => {
      const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (norm.includes('MUY PROBABLE')) return 5;
      if (norm.includes('MEDIANAMENTE') || norm.includes('MEDIA')) return 4;
      if (norm.includes('POCO PROBABLE')) return 2;
      if (norm.includes('NO ES PROBABLE') || norm.includes('NO PROBABLE')) return 1;
      if (norm.includes('PROBABLE')) return 3;
      return 3;
    };
    const mapNE = (lbl) => {
      const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (norm.includes('CONSTANTE')) return 5;
      if (norm.includes('FRECUENTE')) return 4;
      if (norm.includes('OCASIONAL')) return 3;
      if (norm.includes('ESPORADICO') || norm.includes('ESPORÁDICO')) return 2;
      if (norm.includes('MINIMA') || norm.includes('MÍNIMA')) return 1;
      return 3;
    };
    const mapNC = (lbl) => {
      const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (norm.includes('CRITICO') || norm.includes('CRÍTICO')) return 5;
      if (norm.includes('PELIGROSO')) return 4;
      if (norm.includes('MODERADO')) return 3;
      if (norm.includes('MARGINAL')) return 2;
      if (norm.includes('INSIGNIFICANTE')) return 1;
      return 3;
    };

    const np_cuantitativo = mapNP(updatedFields.np_cualitativo);
    const ne_cuantitativo = mapNE(updatedFields.ne_cualitativo);
    const nc_cuantitativo = mapNC(updatedFields.nc_cualitativo);
    const calificacion = np_cuantitativo + ne_cuantitativo + nc_cuantitativo;
    
    let nivel_riesgo = 'NIVEL DE RIESGO BAJO';
    let aceptabilidad = 'ACEPTABLE';
    if (calificacion >= 12) {
      nivel_riesgo = 'NIVEL DE RIESGO ALTO o CRITICO';
      aceptabilidad = 'NO ACEPTABLE';
    } else if (calificacion >= 8) {
      nivel_riesgo = 'NIVEL DE RIESGO MEDIO o MODERADO';
      aceptabilidad = 'ACEPTABLE CON CONTROL ESPECIFICO';
    }

    updatedFields.np_cuantitativo = np_cuantitativo;
    updatedFields.ne_cuantitativo = ne_cuantitativo;
    updatedFields.nc_cuantitativo = nc_cuantitativo;
    updatedFields.calificacion = calificacion;
    updatedFields.nivel_riesgo = nivel_riesgo;
    updatedFields.aceptabilidad = aceptabilidad;
    
    updatedFields.plan_accion_medio = updatedFields.plan_accion_medio || 'Ninguno';
    updatedFields.plan_accion_vehiculo = updatedFields.plan_accion_vehiculo || 'Ninguno';
    updatedFields.plan_accion_individuo = updatedFields.plan_accion_individuo || 'Ninguno';
    updatedFields.plan_accion_infraestructura = updatedFields.plan_accion_infraestructura || 'Ninguno';

    return res.json({ updatedFields });
  } catch (error) {
    logger.error('[PESV/ai-update-row] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Helper: Generar HTML de gráficas PESV
function getHexPESVColor(calificacion) {
  if (calificacion >= 12) return '#dc2626'; // Rojo - Alto o Crítico
  if (calificacion >= 8) return '#ea580c'; // Naranja/Amarillo - Medio
  return '#16a34a'; // Verde - Bajo
}

function buildPesvChartsHtml(matrixRows) {
  if (!matrixRows || matrixRows.length === 0) return '';
  
  const mapActor = {};
  matrixRows.forEach(r => {
    const k = (r.rol_via || 'Sin clasificar').trim();
    if (!mapActor[k]) mapActor[k] = { count: 0, totalScore: 0 };
    mapActor[k].count++;
    mapActor[k].totalScore += Number(r.calificacion) || 0;
  });
  const chartActor = Object.entries(mapActor).map(([actor, d]) => ({ actor, count: d.count, avg: Math.round((d.totalScore / d.count) * 10) / 10 })).sort((a,b) => b.avg - a.avg);
  const maxActor = 15;

  const mapFactor = {};
  matrixRows.forEach(r => {
    const k = (r.factor_riesgo || 'Sin clasificar').trim();
    if (!mapFactor[k]) mapFactor[k] = { count: 0, totalScore: 0 };
    mapFactor[k].count++;
    mapFactor[k].totalScore += Number(r.calificacion) || 0;
  });
  const chartFactor = Object.entries(mapFactor).map(([factor, d]) => ({ factor, count: d.count, avg: Math.round((d.totalScore / d.count) * 10) / 10 })).sort((a,b) => b.avg - a.avg);
  const maxFactor = 15;

  const empty = (v) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', ''].includes(String(v).toLowerCase().trim());
  
  let persona = 0, medio = 0, vehiculo = 0, infra = 0;
  matrixRows.forEach(r => {
    const t = String(r.controles_existentes_tipo || '').toUpperCase();
    if (t.includes('INDIVIDUO') || t.includes('PERSONA')) persona++;
    if (t.includes('MEDIO')) medio++;
    if (t.includes('VEHICULO') || t.includes('VEHÍCULO')) vehiculo++;
    if (t.includes('INFRAESTRUCTURA') || t.includes('VIA') || t.includes('VÍA')) infra++;
  });
  const total = matrixRows.length || 1;
  const chartControls = [
    { label: 'Control en el Individuo (Persona)', value: persona, pct: Math.round((persona/total)*100) },
    { label: 'Control en el Medio', value: medio, pct: Math.round((medio/total)*100) },
    { label: 'Control en el Vehículo', value: vehiculo, pct: Math.round((vehiculo/total)*100) },
    { label: 'Control en la Vía / Infraestructura', value: infra, pct: Math.round((infra/total)*100) },
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
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Calificación Promedio por Actor Vial (Rango 3-15)</h4>
          ${chartActor.map(d => renderBar(d.actor, d.avg, maxActor, getHexPESVColor(d.avg))).join('')}
        </div>
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Calificación Promedio por Factor PESV</h4>
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
      `[${i+1}] Grupo Trabajo: ${r.grupo_trabajo} | Cargo: ${r.cargo} | Actor: ${r.rol_via} | Desplazamiento: ${r.tipo_desplazamiento} | Factor: ${r.factor_riesgo} | Peligro: ${r.peligro_descripcion} | Calificación (3-15): ${r.calificacion} (${r.nivel_riesgo}) | Aceptabilidad: ${r.aceptabilidad}`
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

    const cleanedRows = cleanRawRows(rawRows);

    const CHUNK_SIZE = 20;
    const chunks = [];
    for (let i = 0; i < cleanedRows.length; i += CHUNK_SIZE) {
      chunks.push(cleanedRows.slice(i, i + CHUNK_SIZE));
    }

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    logger.info(`[PESV/ai-parse-matrix] Processing ${cleanedRows.length} rows for user ${userId} in ${chunks.length} chunks`);

    const mapNP = (lbl) => {
      const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (norm.includes('MUY PROBABLE')) return 5;
      if (norm.includes('MEDIANAMENTE') || norm.includes('MEDIA')) return 4;
      if (norm.includes('POCO PROBABLE')) return 2;
      if (norm.includes('NO ES PROBABLE') || norm.includes('NO PROBABLE')) return 1;
      if (norm.includes('PROBABLE')) return 3;
      return 3;
    };
    const mapNE = (lbl) => {
      const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (norm.includes('CONSTANTE')) return 5;
      if (norm.includes('FRECUENTE')) return 4;
      if (norm.includes('OCASIONAL')) return 3;
      if (norm.includes('ESPORADICO') || norm.includes('ESPORÁDICO')) return 2;
      if (norm.includes('MINIMA') || norm.includes('MÍNIMA')) return 1;
      return 3;
    };
    const mapNC = (lbl) => {
      const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (norm.includes('CRITICO') || norm.includes('CRÍTICO')) return 5;
      if (norm.includes('PELIGROSO')) return 4;
      if (norm.includes('MODERADO')) return 3;
      if (norm.includes('MARGINAL')) return 2;
      if (norm.includes('INSIGNIFICANTE')) return 1;
      return 3;
    };

    const combinedRows = [];

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunk = chunks[chunkIdx];
      if (chunkIdx > 0) {
        // Pausa de 1500ms para evitar saturación de tasa (rate limits) en el API de Gemini
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      logger.info(`[PESV/ai-parse-matrix] Processing chunk ${chunkIdx + 1}/${chunks.length} for user ${userId}`);

      const prompt = `Eres un experto certificado en el Plan Estratégico de Seguridad Vial (PESV) en Colombia y la normatividad de la Resolución 40595 de 2022.
Te proporciono una lista de filas importadas desde un archivo con columnas arbitrarias.
Analiza los datos y transfórmalos a nuestro formato estándar de matriz PESV:

Estructura requerida para cada objeto de la lista JSON:
{
  "grupo_trabajo": "<grupo de trabajo o área en tipo oración>",
  "cargo": "<cargo del trabajador expuesto en tipo oración>",
  "tipo_desplazamiento": "<Misional|In itinere>",
  "rol_via": "<Peatón|Pasajero|Conductor de motocicleta|Conductor de vehículo liviano|Conductor de vehículo pesado|Ciclista|Otro>",
  "factor_riesgo": "<Factor Humano|Factor Vehicular|Factor Infraestructura|Entorno/Otros>",
  "peligro_descripcion": "<descripción clara del peligro vial>",
  "np_cualitativo": "<MUY PROBABLE|MEDIANAMENTE PROBABLE|PROBABLE|POCO PROBABLE|NO ES PROBABLE>",
  "ne_cualitativo": "<CONSTANTE|FRECUENTE|OCASIONAL|ESPORADICO|MINIMA>",
  "nc_cualitativo": "<CRITICO|PELIGROSO|MODERADO|MARGINAL|INSIGNIFICANTE>",
  "controles_existentes_descripcion": "<interpretación o descripción de los controles existentes o 'Ninguno'>",
  "controles_existentes_tipo": "<INDIVIDUO|MEDIO|MEDIO-INDIVIDUO|VEHICULO|INFRAESTRUCTURA|Ninguno>",
  "tratamiento_accion": "<ACEPTARLO|EVITARLO|ELIMINAR LA FUENTE QUE OCACIONA|MODIFICAR LOS FACTORES DE EXPOSICION|Ninguno>",
  "plan_accion_medio": "<plan propuesto para el medio o 'Ninguno'>",
  "plan_accion_vehiculo": "<plan propuesto para el vehículo o 'Ninguno'>",
  "plan_accion_individuo": "<plan propuesto para el individuo o 'Ninguno'>",
  "plan_accion_infraestructura": "<plan propuesto para la infraestructura/vía o 'Ninguno'>",
  "responsable": "<Coordinador PESV o Conductor o Gestor de Flota>",
  "fecha_programacion": "<fecha o periodicidad, ej: Permanente o Mensual>",
  "estado": "<PLANEADA|CERRADA>",
  "observaciones": "<observaciones adicionales o vacías>"
}

Reglas:
1. Determina los niveles cualitativos de NP, NE y NC según el peligro vial y las guías.
2. El resultado debe ser EXCLUSIVAMENTE una lista JSON válida sin explicaciones ni markdown ni envolverse en \`\`\`json.

FILAS ORIGINALES:
${JSON.stringify(chunk, null, 2)}`;

      const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
      let text = result.response.text().trim();
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        logger.error(`[PESV/ai-parse-matrix] JSON parse error in chunk ${chunkIdx}:`, err.message, 'Raw:', text.slice(0, 500));
        throw new Error('La IA devolvió un formato JSON inválido para uno de los lotes. Por favor, intenta de nuevo.');
      }

      if (!Array.isArray(parsed)) {
        if (typeof parsed === 'object' && parsed !== null) parsed = [parsed];
        else throw new Error('La IA no devolvió un listado de filas en el formato esperado.');
      }

      const mappedChunk = parsed.map(row => {
        const np_cuantitativo = Number(row.np_cuantitativo) || mapNP(row.np_cualitativo);
        const ne_cuantitativo = Number(row.ne_cuantitativo) || mapNE(row.ne_cualitativo);
        const nc_cuantitativo = Number(row.nc_cuantitativo) || mapNC(row.nc_cualitativo);
        const calificacion = np_cuantitativo + ne_cuantitativo + nc_cuantitativo;

        let nivel_riesgo = 'NIVEL DE RIESGO BAJO';
        let aceptabilidad = 'ACEPTABLE';
        if (calificacion >= 12) {
          nivel_riesgo = 'NIVEL DE RIESGO ALTO o CRITICO';
          aceptabilidad = 'NO ACEPTABLE';
        } else if (calificacion >= 8) {
          nivel_riesgo = 'NIVEL DE RIESGO MEDIO o MODERADO';
          aceptabilidad = 'ACEPTABLE CON CONTROL ESPECIFICO';
        }

        return {
          ...row,
          plan_accion_medio: row.plan_accion_medio || 'Ninguno',
          plan_accion_vehiculo: row.plan_accion_vehiculo || 'Ninguno',
          plan_accion_individuo: row.plan_accion_individuo || 'Ninguno',
          plan_accion_infraestructura: row.plan_accion_infraestructura || 'Ninguno',
          controles_existentes_descripcion: row.controles_existentes_descripcion || 'Ninguno',
          tratamiento_accion: row.tratamiento_accion || 'Ninguno',
          np_cuantitativo,
          ne_cuantitativo,
          nc_cuantitativo,
          calificacion,
          nivel_riesgo,
          aceptabilidad,
          id: Date.now().toString() + Math.random().toString(36).substring(7)
        };
      });

      combinedRows.push(...mappedChunk);
    }

    logger.info(`[PESV/ai-parse-matrix] Successfully mapped ${combinedRows.length} rows for user ${userId}`);
    return res.json({ matrixRows: combinedRows });

  } catch (error) {
    logger.error('[PESV/ai-parse-matrix] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
