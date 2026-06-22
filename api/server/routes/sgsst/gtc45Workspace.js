'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const CompanyInfo = require('~/models/CompanyInfo');
const SgsstWorker = require('~/models/SgsstWorker');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
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

// GET matrix for a conversation
router.get('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    logger.debug(`[GTC45Workspace GET] conversationId=${conversationId} | userId=${userId}`);

    const companyId = await getActiveCompanyId(userId);

    let session = await GTC45WorkspaceSession.findOne({ conversationId, user: userId, companyId: companyId });
    logger.debug(`[GTC45Workspace GET] primary lookup result: ${session ? `found (rows=${session.matrixRows?.length})` : 'NOT FOUND'}`);

    if (!session) {
      session = await GTC45WorkspaceSession.findOne({ conversationId });
      logger.debug(`[GTC45Workspace GET] fallback lookup result: ${session ? `found (user=${session.user}, rows=${session.matrixRows?.length})` : 'NOT FOUND'}`);
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
        if (modified) {
          await session.save();
          logger.info(`[GTC45Workspace GET] Adopted and populated user/companyId for legacy session ${conversationId}`);
        }
      }
    }

    // Fallback: si es una conversación real y no encontramos sesión, buscamos la temporal
    if (!session && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const { Conversation } = require('~/db/models');
      const convo = await Conversation.findOne({ conversationId }, 'createdAt').lean();
      const isNewConvo = convo && convo.createdAt && (Date.now() - new Date(convo.createdAt).getTime() < 120000);

      if (isNewConvo) {
        const tempId = `temp-${userId}`;
        const tempSession = await GTC45WorkspaceSession.findOne({ conversationId: tempId, user: userId });
        if (tempSession) {
          tempSession.conversationId = conversationId;
          tempSession.companyId = companyId;
          await tempSession.save();
          session = tempSession;
          logger.info(`[GTC45Workspace GET] Migrated temporal session for user ${userId} to conversation ${conversationId}`);
        }
      }
    }

    if (!session) {
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
    const companyId = await getActiveCompanyId(userId);

    const normalizedRows = (matrixRows || []).map(row => ({
      ...row,
      proceso: toSentenceCase(row.proceso),
      zona: toSentenceCase(row.zona)
    }));

    let session = await GTC45WorkspaceSession.findOneAndUpdate(
      { conversationId, companyId: companyId },
      {
        $set: { matrixRows: normalizedRows, companyId },
        $setOnInsert: { user: userId },
      },
      { upsert: true, new: true },
    );

    if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const tempId = `temp-${userId}`;
      await GTC45WorkspaceSession.deleteOne({ conversationId: tempId, user: userId });
      logger.info(`[GTC45Workspace PUT] Deleted temporary session for user ${userId} since real session was created.`);
    }

    res.json({ success: true, matrixRows: session.matrixRows });
  } catch (error) {
    logger.error('[GTC45Workspace] Error updating matrix:', error);
    res.status(500).json({ error: 'Failed to update matrix' });
  }
});


// DELETE clear all temporary sessions for a user
router.delete('/clear-temp-sessions', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    const tempId = `temp-${userId}`;

    logger.info(`[GTC45Workspace DELETE] Clearing temporary sessions for user ${userId}`);

    // Delete GTC45 Workspace Session
    await GTC45WorkspaceSession.deleteOne({ conversationId: tempId, user: userId, companyId });

    // Delete PESV Workspace Session
    try {
      const PESVWorkspaceSession = require('~/models/PESVWorkspaceSession');
      await PESVWorkspaceSession.deleteOne({ conversationId: tempId, user: userId, companyId });
    } catch (e) {
      logger.error('[GTC45Workspace DELETE clear-temp-sessions] PESV error:', e);
    }

    // Delete Chemical Compatibility Session
    try {
      const ChemicalCompatibilitySession = require('~/models/ChemicalCompatibilitySession');
      await ChemicalCompatibilitySession.deleteOne({ conversationId: tempId, user: userId, companyId });
    } catch (e) {
      logger.error('[GTC45Workspace DELETE clear-temp-sessions] Chemical error:', e);
    }

    // Delete Live Editor Session
    try {
      const LiveEditorSession = require('~/models/LiveEditorSession');
      await LiveEditorSession.deleteOne({ conversationId: tempId, user: userId, companyId });
    } catch (e) {
      logger.error('[GTC45Workspace DELETE clear-temp-sessions] LiveEditor error:', e);
    }

    // Delete Canvas Session
    try {
      const CanvasSession = require('~/models/CanvasSession');
      await CanvasSession.deleteMany({ conversationId: tempId });
    } catch (e) {
      logger.error('[GTC45Workspace DELETE clear-temp-sessions] Canvas error:', e);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[GTC45Workspace DELETE clear-temp-sessions] General error:', error);
    res.status(500).json({ error: 'Failed to clear temporary sessions' });
  }
});





// ─── IA: Actualizar una fila con IA (contexto = solo esa fila) ─────────────────
router.post('/ai-update-row', requireJwtAuth, async (req, res) => {
  try {
    const { row, workerId } = req.body;
    const userId = req.user?.id;

    if (!row) return res.status(400).json({ error: 'Se requiere el objeto row.' });

    let workerContext = '';
    if (workerId) {
        const worker = await SgsstWorker.findOne({ _id: workerId, user: req.user.id });
        if (worker) {
            workerContext = `
═══ CONTEXTO BIO-INDIVIDUAL (TRABAJADOR ESPECÍFICO) ═══
Nombre: ${worker.nombre}
Condiciones de Salud / Limitaciones Previas: ${worker.condicionesSalud || 'Ninguna registrada'}
-> DEBES considerar clínicamente estas condiciones de salud para proponer EPP específicos, controles médicos en el medio y en el individuo, y para ajustar la aceptabilidad del riesgo de cara a este bio-individuo.
`;
        }
    }

    const prompt = `Eres un experto certificado en Seguridad y Salud en el Trabajo y en la metodología GTC-45:2012 colombiana.
${workerContext}
Tienes esta fila de Matriz IPEVAR con datos YA fijados por el usuario que JAMÁS debes modificar:

═══ DATOS FIJOS (NO MODIFICAR) ═══
PROCESO: ${row.proceso || ''}
ZONA: ${row.zona || ''}
ACTIVIDAD: ${row.actividad || ''}
TAREAS: ${row.tareas || ''}
PELIGRO描述: ${row.peligro_descripcion || 'No especificado'}
CLASIFICACIÓN: ${row.peligro_clasificacion || 'No especificada'}
EFECTOS POSIBLES: ${row.efectos_posibles || 'No definidos'}
CONTROLES EXISTENTES (YA REGISTRADOS POR EL USUARIO — NO INVENTAR NI MODIFICAR):
  - Fuente: ${row.controles_fuente || 'Ninguno'}
  - Medio: ${row.controles_medio || 'Ninguno'}
  - Individuo: ${row.controles_individuo || 'Ninguno'}
ND actual: ${row.nd || 'No definido'} | NE actual: ${row.ne || 'No definido'} | NC actual: ${row.nc || 'No definido'}
Nro. Expuestos: ${row.nro_expuestos || 1}
Peor Consecuencia: ${row.peor_consecuencia || 'No definida'}
Requisito Legal: ${row.requisito_legal || 'No especificado'}

═══ TU ÚNICA TAREA ═══
Basándote EXCLUSIVAMENTE en los datos fijos de arriba:
1. Determina ND, NE, NC correctos según GTC-45:2012. 
   IMPORTANTE DE ESTABILIDAD: Si ND actual (${row.nd}), NE actual (${row.ne}) y NC actual (${row.nc}) ya tienen valores numéricos válidos en la escala GTC-45 (ND en [0, 2, 6, 10], NE en [1, 2, 3, 4], NC en [10, 25, 60, 100]), DEBES conservarlos exactamente igual en tu respuesta en los campos "nd", "ne" y "nc". Solo recalcula si están vacíos, son cero o si el usuario modificó sustancialmente los controles existentes arriba.
2. Propón medidas de ELIMINACIÓN, SUSTITUCIÓN, INGENIERÍA, ADMINISTRATIVAS y EPP adecuadas a futuro.
3. Completa factores_reduccion con justificación técnica y costo-beneficio (Anexo E). NUNCA dejar vacío.
4. Si los campos nro_expuestos, peor_consecuencia y requisito_legal están vacíos o no definidos, propón o estima valores adecuados basados en el peligro. De lo contrario, consérvalos.

REGLA ABSOLUTA: Los campos "controles_fuente", "controles_medio" y "controles_individuo" en tu respuesta JSON DEBEN ser exactamente iguales a los valores de los controles existentes mostrados arriba. NO los cambies.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con estos campos exactos:
{
  "nd": <número 1-10>,
  "ne": <número 1-4>,
  "nc": <número 10|25|60|100>,
  "nro_expuestos": ${row.nro_expuestos || 1},
  "peor_consecuencia": "<peor consecuencia o proponer si está vacía>",
  "requisito_legal": "<'Sí'|'No'|'', proponer si está vacía>",
  "medida_eliminacion": "<medida propuesta o Ninguno>",
  "medida_sustitucion": "<medida propuesta o Ninguno>",
  "medida_ingenieria": "<control de ingeniería propuesto o Ninguno>",
  "medida_administrativa": "<control administrativo propuesto o Ninguno>",
  "medida_eppu": "<EPP recomendado específico o Ninguno>",
  "factores_reduccion": "<Anexo E OBLIGATORIO: Justificación técnica y financiera. NUNCA VACÍO.>",
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

    // Recalculate NP, Interpretación NP, NR, Interpretación NR and Aceptabilidad server-side to ensure 100% GTC-45 accuracy and stability
    const nd = Number(updatedFields.nd) || 0;
    const ne = Number(updatedFields.ne) || 0;
    const np = nd * ne;
    updatedFields.np = np;

    let interpretacion_np = 'Bajo (B)';
    if (np >= 24) interpretacion_np = 'Muy Alto (MA)';
    else if (np >= 10) interpretacion_np = 'Alto (A)';
    else if (np >= 6) interpretacion_np = 'Medio (M)';
    updatedFields.interpretacion_np = interpretacion_np;

    const nc = Number(updatedFields.nc) || 0;
    const nr = np * nc;
    updatedFields.nr = nr;

    let interpretacion_nr = 'IV';
    if (nr >= 600) interpretacion_nr = 'I';
    else if (nr >= 150) interpretacion_nr = 'II';
    else if (nr >= 40) interpretacion_nr = 'III';
    else interpretacion_nr = 'IV';
    updatedFields.interpretacion_nr = interpretacion_nr;

    let aceptabilidad = 'Aceptable';
    if (interpretacion_nr === 'I') aceptabilidad = 'No Aceptable';
    else if (interpretacion_nr === 'II') aceptabilidad = 'No Aceptable o Aceptable con Control Específico';
    else if (interpretacion_nr === 'III') aceptabilidad = 'Mejorable';
    else aceptabilidad = 'Aceptable';
    updatedFields.aceptabilidad = aceptabilidad;

    // Enforce default existing controls just in case
    updatedFields.controles_fuente = row.controles_fuente || 'Ninguno';
    updatedFields.controles_medio = row.controles_medio || 'Ninguno';
    updatedFields.controles_individuo = row.controles_individuo || 'Ninguno';

    logger.info(`[GTC45/ai-update-row] Row updated for user ${userId}, NR=${updatedFields.nr}`);
    return res.json({ updatedFields });

  } catch (error) {
    logger.error('[GTC45/ai-update-row] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});


// ─── HELPER: Generar HTML de gráficas IPEVAR ────────────────────────────────
function getHexNRColor(nr) {
  if (nr >= 600) return '#dc2626'; // rojo oscuro
  if (nr >= 150) return '#ef4444'; // rojo
  if (nr >= 50) return '#f97316'; // naranjo
  if (nr >= 20) return '#eab308'; // amarillo
  return '#22c55e'; // verde
}

function buildIpevarChartsHtml(matrixRows) {
  if (!matrixRows || matrixRows.length === 0) return '';
  
  const mapA = {};
  matrixRows.forEach(r => {
    const k = (r.peligro_clasificacion || 'Sin clasificar').trim();
    if (!mapA[k]) mapA[k] = { count: 0, totalNR: 0 };
    mapA[k].count++;
    mapA[k].totalNR += Number(r.nr) || 0;
  });
  const chartA = Object.entries(mapA).map(([clas, d]) => ({ clas, count: d.count, avg: Math.round(d.totalNR / d.count) })).sort((a,b) => b.avg - a.avg).slice(0, 8);
  const maxA = Math.max(...chartA.map(d => d.avg), 1);

  const mapD = {};
  matrixRows.forEach(r => {
    const k = (r.proceso || 'Sin proceso').trim();
    if (!mapD[k]) mapD[k] = { count: 0, totalNR: 0 };
    mapD[k].count++;
    mapD[k].totalNR += Number(r.nr) || 0;
  });
  const chartD = Object.entries(mapD).map(([proc, d]) => ({ proc, count: d.count, avg: Math.round(d.totalNR / d.count) })).sort((a,b) => b.avg - a.avg).slice(0, 8);
  const maxD = Math.max(...chartD.map(d => d.avg), 1);

  const empty = (v) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', ''].includes(String(v).toLowerCase().trim());
  let fuente = 0, medio = 0, individuo = 0;
  matrixRows.forEach(r => {
    if (!empty(r.controles_fuente)) fuente++;
    if (!empty(r.controles_medio)) medio++;
    if (!empty(r.controles_individuo)) individuo++;
  });
  const total = matrixRows.length || 1;
  const chartB = [
    { label: 'En la Fuente', value: fuente, pct: Math.round((fuente/total)*100) },
    { label: 'En el Medio', value: medio, pct: Math.round((medio/total)*100) },
    { label: 'En el Individuo', value: individuo, pct: Math.round((individuo/total)*100) },
  ];

  const DISEASE_KEYWORDS = [
    { name: 'Lumbalgia/Dorsopatía', keywords: ['lumbalgia', 'lumbar', 'dorsopatía', 'espalda'] },
    { name: 'S. Túnel Carpiano', keywords: ['túnel carpiano', 'stc', 'muñeca', 'nervio mediano'] },
    { name: 'Estrés/Burnout', keywords: ['estrés', 'burnout', 'agotamiento', 'ansiedad', 'sobrecarga'] },
    { name: 'Hipoacusia', keywords: ['hipoacusia', 'pérdida auditiva', 'sordera'] },
    { name: 'Dermatitis', keywords: ['dermatitis', 'irritación piel', 'alergia dérmica'] },
    { name: 'Epicondilitis', keywords: ['epicondilitis', 'codo', 'tendinitis'] },
    { name: 'Fatiga Visual', keywords: ['fatiga visual', 'ojo seco', 'trastorno visual'] },
    { name: 'Enf. Respiratorias', keywords: ['neumoconiosis', 'asma', 'epoc', 'polvo', 'bronquitis'] },
    { name: 'Enf. Infecciosas', keywords: ['infección', 'virus', 'bacteria', 'contagio'] },
    { name: 'VBM/Raynaud', keywords: ['vibración', 'vbm', 'raynaud', 'mano-brazo'] }
  ];

  let chartC = DISEASE_KEYWORDS.map(d => {
    const matches = matrixRows.filter(r => {
      const haystack = `${r.efectos_posibles || ''} ${r.peligro_descripcion || ''}`.toLowerCase();
      return d.keywords.some(kw => haystack.includes(kw));
    });
    if (matches.length === 0) return null;
    const noControl = matches.filter(r =>
      empty(r.medida_eliminacion) && empty(r.medida_sustitucion) &&
      empty(r.medida_ingenieria) && empty(r.medida_administrativa) && empty(r.medida_eppu)
    ).length;
    let nivel = 'Bajo'; let col = '#22c55e';
    if (noControl === matches.length) { nivel = 'Alto'; col = '#dc2626'; }
    else if (noControl > 0) { nivel = 'Medio'; col = '#f97316'; }
    return { name: d.name, count: matches.length, nivel, col };
  }).filter(Boolean);

  function renderBar(label, value, max, color) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return `
      <div style="display:flex; align-items:center; margin-bottom:8px;">
        <div style="width:140px; font-size:11px; color:#475569; font-weight:600; text-align:right; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${label}">${label}</div>
        <div style="flex:1; background-color:#f1f5f9; border-radius:10px; height:16px; position:relative; overflow:hidden;">
          <div style="background-color:${color}; width:${Math.max(5, pct)}%; height:100%; border-radius:10px; display:flex; align-items:center; justify-content:flex-end; padding-right:8px; color:white; font-size:10px; font-weight:bold;">
            ${value}
          </div>
        </div>
      </div>
    `;
  }

  let html = `
    <div style="margin: 25px 0; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #f8fafc; page-break-inside: avoid;">
      <h3 style="color:#0f766e; font-size:16px; margin-top:0; border-bottom:2px solid #0f766e; padding-bottom:8px; margin-bottom:20px; text-transform:uppercase;">
          ANALÍTICA IPEVAR — RESUMEN EJECUTIVO (Gráficas)
      </h3>
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Riesgos por Clasificación (NR Promedio)</h4>
          ${chartA.map(d => renderBar(d.clas.length > 20 ? d.clas.substring(0,18)+'...' : d.clas, d.avg, maxA, getHexNRColor(d.avg))).join('')}
        </div>
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Jerarquía de Controles</h4>
          ${chartB.map(d => renderBar(d.label, d.pct, 100, '#0ea5e9') + `<div style="font-size:9px; color:#64748b; text-align:right; margin-bottom:5px; margin-top:-3px;">Cobertura: ${d.pct}% riesgos</div>`).join('')}
        </div>
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Enfermedades Potenciales Detectadas</h4>
          ${chartC.length === 0 ? '<p style="font-size:11px; color:#94a3b8; font-style:italic;">No se identificaron enfermedades según los efectos documentados.</p>' : 
            chartC.map(d => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #f1f5f9; padding:6px 10px; border-radius:6px; margin-bottom:6px;">
              <span style="font-size:11px; font-weight:600; color:#475569;">${d.name} (${d.count})</span>
              <span style="font-size:10px; font-weight:700; color:${d.col};">${d.nivel === 'Alto' ? 'Sin control' : d.nivel === 'Medio' ? 'Control Parcial' : 'Controlada'}</span>
            </div>
            `).join('')
          }
        </div>
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Promedio de Nivel de Riesgo (NR) x Proceso</h4>
          ${chartD.map(d => renderBar(d.proc.length > 20 ? d.proc.substring(0,18)+'...' : d.proc, d.avg, maxD, getHexNRColor(d.avg))).join('')}
        </div>
      </div>
    </div>
  `;
  return html;
}

// ─── IA: Analizar toda la matriz (contexto completo) ──────────────────────────
router.post('/ai-analyze-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { matrixRows, instruction, workerId } = req.body;
    const userId = req.user?.id;

    if (!matrixRows || !matrixRows.length) return res.status(400).json({ error: 'La matriz está vacía.' });

    let workerContext = '';
    let reportTitle = 'INFORME EJECUTIVO DE RIESGOS IPEVAR - GTC-45';
    if (workerId) {
        const worker = await SgsstWorker.findOne({ _id: workerId, user: req.user.id });
        if (worker) {
            reportTitle = `INFORME IPEVAR BIO-INDIVIDUAL - ${worker.nombre.toUpperCase()}`;
            workerContext = `
**[ATENCIÓN: ESTE ES UN INFORME BIO-INDIVIDUAL (CENTRICIDAD EN EL TRABAJADOR)]**
Estás evaluando específicamente al trabajador: ${worker.nombre}.
Condiciones de salud y vulnerabilidades clínicas previas: ${worker.condicionesSalud || 'Ninguna registrada'}.
Toda tu redacción DEBE enfocarse en cómo los riesgos evaluados impactan DIRECTAMENTE a este individuo en particular, considerando su estado clínico base. Adapta las recomendaciones (EPP, exámenes médicos ocupacionales, readaptación de tareas) explícitamente a sus condiciones.
`;
        }
    }

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: userId }).lean();
    } catch (e) {
      logger.warn('[GTC45] Could not load CompanyInfo', e);
    }

    const currentDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const headerHTML = buildStandardHeader({
      title: reportTitle,
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: workerId ? 'Matriz 360° Bio-Individual / GTC-45' : 'GTC-45:2012 / Decreto 1072 de 2015',
      responsibleName: req.user?.name,
    });

    const matrixSummary = matrixRows.map((r, i) =>
      `[${i+1}] Proceso: ${r.proceso} | Actividad: ${r.actividad} | Clasificación: ${r.peligro_clasificacion} | Peligro: ${r.peligro_descripcion} | NR: ${r.nr} (${r.interpretacion_nr}) | Exp: ${r.efectos_posibles}`
    ).join('\n');

    const prompt = `Eres un auditor experto en Seguridad y Salud en el Trabajo bajo la metodología GTC-45:2012 en Colombia.
Analiza esta Matriz IPEVAR completa y emite un Informe Técnico y Ejecutivo integral MUY EXTENSO, sumamente detallado y analítico.
${workerContext}

**INSTRUCCIONES DE FORMATO HTML:**
- Responde EXCLUSIVAMENTE en HTML limpio, listo para inyectarse en el DOM. NO uses \`\`\`html.
- TODAS las tablas deben llevar: <table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
- Headers de tablas (<th>): <th style="background-color:#0f766e;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">
- Celdas (<td>): <td style="padding:10px 14px;border-bottom:1px solid #f0fdfa;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">
- Headers de sección (H3): <h3 style="color:#0f766e; margin-top:30px; border-bottom:1px solid #ccc; padding-bottom:5px;">

**ESTRUCTURA DEL INFORME EXIGIDA (en HTML) - ESTE INFORME DEBE SER EXTREMADAMENTE EXTENSO:**
1. **Introducción y Contexto General:** Un análisis profundo y muy extenso de la situación actual según la matriz. Incluye interpretaciones sobre cultura de seguridad y asunciones metodológicas.
2. **Análisis Individual de Indicadores Visados (Gráficas):** Dedica una subtrama muy extensa y detallada a analizar teóricamente y de cara al negocio cada uno de estos 4 apartados representados en los dashboards:
    - a. Análisis exhaustivo de los Riesgos por Clasificación (Biomécanico, Psicosocial, Físico, etc.) y su impacto promedio (NR).
    - b. Evaluación profunda de la Jerarquía de Controles aplicada (desproporción entre medidas en la Fuente, el Medio y el Individuo).
    - c. Pronóstico sumamente detallado sobre Enfermedades Laborales Potenciales Detectadas y cómo mitigarlas desde ya clínicamente.
    - d. Desglose detallado del Promedio de NR por cada área y Proceso evaluado, buscando responsabilidades orgánicas en las áreas críticas.
3. **Hallazgos Críticos Detallados:** Menciona los riesgos con Mayor NR (Rojos / No Aceptables) y sus consecuencias a nivel de la salud, lo financiero, legal y productivo. Crea una tabla resumen detallada con: Proceso, Actividad, Peligro y NR.
4. **Brechas en Controles Evaluadas:** Un diagnóstico minucioso y extenso que argumente científicamente la debilidad de las medidas de intervención presentes.
5. **Plan de Acción Gerencial y Operativo:** Propuesta super extensa de controles de eliminación, sustitución, ingeniería y administrativos recomendados (Tabla de 3 columnas: Proceso, Recomendaciones de clase mundial, Tipo de Control recomendado) abarcando la mejora continua.
6. **Conclusión y Recomendaciones de Alta Gerencia:** Un texto robusto y extenso sobre la integración de la GTC-45 con sistemas ISO o estándares internacionales de clase mundial.
7. NO incluyas título principal ni encabezado corporativo (el sistema los inyectará antes).
8. NO incluyas bloque de firmas en tu respuesta de HTML (el sistema las inyectará debajo).

Asegurate de que cada uno de los puntos anteriores de la estructura genere párrafos MUY robustos y abundantes (múltiples párrafos grandes por viñeta del esquema de análisis). ¡Debe ser una respuesta en formato HTML extremo en longitud y supremamente elaborada a nivel técnico!

**MATRIZ COMPLETA (${matrixRows.length} riesgos evaluados):**
${matrixSummary}

**INSTRUCCIÓN ESPECÍFICA (opcional):**
${instruction || 'Generar informe ejecutivo de altísimo nivel técnico priorizando muy extensamente cada acápite del análisis de procesos y peligros.'}
`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const analysisRaw = result.response.text();
    const htmlBody = analysisRaw.replace(/```html\n ?/g, '').replace(/```\n?/g, '').trim();
    
    const chartsHTML = buildIpevarChartsHtml(matrixRows);

    let fullReport = headerHTML + chartsHTML + '<div style="margin-top:20px;">' + htmlBody + '</div>';
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

// ─── IA: Reconstruir y adaptar una matriz externa (diferente formato) a GTC-45 ───
router.post('/ai-parse-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { rawRows } = req.body;
    const userId = req.user?.id;

    if (!rawRows || !Array.isArray(rawRows)) {
      return res.status(400).json({ error: 'Se requiere una lista de filas en "rawRows".' });
    }

    if (rawRows.length === 0) {
      return res.json({ matrixRows: [] });
    }

    const CHUNK_SIZE = 15;
    const chunks = [];
    for (let i = 0; i < rawRows.length; i += CHUNK_SIZE) {
      chunks.push(rawRows.slice(i, i + CHUNK_SIZE));
    }

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    logger.info(`[GTC45/ai-parse-matrix] Processing ${rawRows.length} rows for user ${userId} in ${chunks.length} chunks`);

    const promises = chunks.map(async (chunk, chunkIdx) => {
      const prompt = `Eres un experto certificado en Seguridad y Salud en el Trabajo y en la metodología GTC-45:2012 colombiana.
Te hemos proporcionado una lista de filas importadas desde un archivo con una estructura y nombres de columnas arbitrarios.
Tu tarea es analizar detalladamente el contenido de cada fila y reconstruir/mapear sus datos para que se adapten a nuestro formato estándar de matriz GTC-45 (IPEVAR).

El formato de salida que requerimos para cada fila es un objeto JSON con la siguiente estructura exacta:
{
  "proceso": "<área, proceso, sección o cargo de la persona en formato tipo oración (primera letra en mayúscula y el resto en minúsculas). Por ejemplo: Administración, Operaciones, Ventas, Auxiliar de Bodega.>",
  "zona": "<zona, lugar, oficina o sede en formato tipo oración (primera letra en mayúscula y el resto en minúsculas). Por ejemplo: Planta 1, Oficina principal.>",
  "actividad": "<actividad o labor principal. Por ejemplo: Digitador, Conducción de vehículo, o el cargo si este describe la actividad.>",
  "tareas": "<tareas específicas del puesto.>",
  "rutinaria": "<'Sí' o 'No'. Estima si la actividad es rutinaria según tu criterio técnico si no se especifica.>",
  "peligro_descripcion": "<descripción clara del peligro o factor de riesgo detectado.>",
  "peligro_clasificacion": "<Clasificación estricta del peligro. Debe ser uno de los siguientes: 'Físico', 'Químico', 'Biológico', 'Biomecánico', 'Psicosocial', 'Condiciones de seguridad' o 'Fenómenos naturales'.>",
  "efectos_posibles": "<efectos posibles a la salud, consecuencias o lesiones esperadas.>",
  "controles_fuente": "<controles existentes en la fuente (máquina o proceso), o 'Ninguno'.>",
  "controles_medio": "<controles existentes en el medio (ambiente), o 'Ninguno'.>",
  "controles_individuo": "<controles existentes en el individuo (persona), o 'Ninguno'.>",
  "nd": <Nivel de Deficiencia: número entero (0, 2, 6 o 10) según la GTC-45. Si el origen tiene valores cualitativos o numéricos diferentes, mapealos al valor GTC-45 más cercano.>,
  "ne": <Nivel de Exposición: número entero (1, 2, 3 o 4) según la GTC-45.>,
  "np": <Nivel de Probabilidad: nd * ne.>,
  "nc": <Nivel de Consecuencia: número entero (10, 25, 60 o 100) según la GTC-45.>,
  "nr": <Nivel de Riesgo: np * nc.>,
  "interpretacion_nr": "<interpretación de NR: 'I' si nr >= 500, 'II' si nr entre 150 y 499, 'III' si nr entre 40 y 149, 'IV' si nr < 40. Por favor, realiza el cálculo y pon la letra correcta.>",
  "aceptabilidad": "<Aceptabilidad del riesgo según GTC-45: 'No Aceptable' si interpretación es I, 'No Aceptable o Aceptable con control específico' si II, 'Mejorable' si III, 'Aceptable' si IV.>",
  "medida_eliminacion": "<medida de eliminación propuesta, o 'Ninguno'.>",
  "medida_sustitucion": "<medida de sustitución propuesta, o 'Ninguno'.>",
  "medida_ingenieria": "<medida de control de ingeniería propuesta, o 'Ninguno'.>",
  "medida_administrativa": "<medida de control administrativo (señalización, capacitación, procedimientos) propuesta, o 'Ninguno'.>",
  "medida_eppu": "<EPP/Equipos recomendados, o 'Ninguno'.>",
  "factores_reduccion": "<Anexo E: Factores de reducción de riesgo. Propón una justificación técnica o financiera breve si no existe en el origen. NUNCA VACÍO. Escribe 'No aplica' si no aplica.>"
}

Reglas importantes:
1. Sé inteligente al inferir los campos basándote en el texto. Si las celdas originales contienen información combinada, sepárala en los campos correspondientes. Por ejemplo, si los controles no están divididos pero hay controles en el individuo, colócalos en controles_individuo.
2. Si los valores numéricos de ND, NE, NC o NR están ausentes o mal calculados, corrígelos y calcula la probabilidad y riesgo matemáticamente correctos según GTC-45.
3. El resultado debe ser EXCLUSIVAMENTE un array JSON válido que contenga la misma cantidad de elementos que el original. No incluyes explicaciones previas ni posteriores, ni bloques de código markdown (\`\`\`json).

FILAS ORIGINALES A PROCESAR:
${JSON.stringify(chunk, null, 2)}
`;

      const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
      let text = result.response.text().trim();
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        logger.error(`[GTC45/ai-parse-matrix] JSON parse error in chunk ${chunkIdx}:`, err.message, 'Raw:', text.slice(0, 500));
        throw new Error('La IA devolvió un formato JSON inválido para uno de los lotes. Por favor, intenta de nuevo.');
      }

      if (!Array.isArray(parsed)) {
        if (typeof parsed === 'object' && parsed !== null) {
          parsed = [parsed];
        } else {
          throw new Error('La IA no devolvió un listado de filas en el formato esperado.');
        }
      }

      return parsed.map(row => {
        const ndVal = Number(row.nd) || 0;
        const neVal = Number(row.ne) || 0;
        const npVal = ndVal * neVal;
        const ncVal = Number(row.nc) || 0;
        const nrVal = npVal * ncVal;

        let interpretacion_np = 'Bajo (B)';
        if (npVal >= 24) interpretacion_np = 'Muy Alto (MA)';
        else if (npVal >= 10) interpretacion_np = 'Alto (A)';
        else if (npVal >= 6) interpretacion_np = 'Medio (M)';

        let interpretacion_nr = 'IV';
        if (nrVal >= 600) interpretacion_nr = 'I';
        else if (nrVal >= 150) interpretacion_nr = 'II';
        else if (nrVal >= 40) interpretacion_nr = 'III';

        let aceptabilidad = 'Aceptable';
        if (interpretacion_nr === 'I') aceptabilidad = 'No Aceptable';
        else if (interpretacion_nr === 'II') aceptabilidad = 'No Aceptable o Aceptable con Control Específico';
        else if (interpretacion_nr === 'III') aceptabilidad = 'Mejorable';

        // Clean up legal requirement value: map "si"/"sí" to "Sí", "no" to "No", otherwise empty
        const rawReq = String(row.requisito_legal || '').trim().toLowerCase();
        let mappedReq = '';
        if (rawReq.includes('si') || rawReq.includes('sí')) mappedReq = 'Sí';
        else if (rawReq.includes('no')) mappedReq = 'No';

        return {
          proceso: toSentenceCase(row.proceso || ''),
          zona: toSentenceCase(row.zona || ''),
          actividad: row.actividad || '',
          tareas: row.tareas || '',
          rutinaria: row.rutinaria || 'Sí',
          peligro_descripcion: row.peligro_descripcion || '',
          peligro_clasificacion: row.peligro_clasificacion || '',
          efectos_posibles: row.efectos_posibles || '',
          controles_fuente: row.controles_fuente || 'Ninguno',
          controles_medio: row.controles_medio || 'Ninguno',
          controles_individuo: row.controles_individuo || 'Ninguno',
          nd: ndVal,
          ne: neVal,
          np: npVal,
          interpretacion_np,
          nc: ncVal,
          nr: nrVal,
          interpretacion_nr,
          aceptabilidad,
          nro_expuestos: Number(row.nro_expuestos) || 1,
          peor_consecuencia: row.peor_consecuencia || '',
          requisito_legal: mappedReq,
          medida_eliminacion: row.medida_eliminacion || 'Ninguno',
          medida_sustitucion: row.medida_sustitucion || 'Ninguno',
          medida_ingenieria: row.medida_ingenieria || 'Ninguno',
          medida_administrativa: row.medida_administrativa || 'Ninguno',
          medida_eppu: row.medida_eppu || 'Ninguno',
          factores_reduccion: row.factores_reduccion || 'No aplica',
          nd_cualitativo: null,
          id: Date.now().toString() + Math.random().toString(36).substring(7)
        };
      });
    });

    const results = await Promise.all(promises);
    const combinedRows = results.flat();

    logger.info(`[GTC45/ai-parse-matrix] Successfully mapped ${combinedRows.length} rows for user ${userId}`);
    return res.json({ matrixRows: combinedRows });

  } catch (error) {
    logger.error('[GTC45/ai-parse-matrix] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;

