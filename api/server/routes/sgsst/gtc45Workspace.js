'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const mongoose = require('mongoose');
const CompanyInfo = require('~/models/CompanyInfo');
const SgsstWorker = require('~/models/SgsstWorker');
const KanbanTask = require('~/models/KanbanTask');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS, cleanRawRows } = require('./sgsstGemini');
const { ensurePerfilExists } = require('./perfilesCargo');

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

// ─── OFICIAL: Obtener la matriz oficial del SG-SST ────────────────────────────
router.get('/official', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    const officialConvoId = `official-${companyId || userId}`;

    // 1. Buscar sesión marcada explícitamente como oficial
    let session = await GTC45WorkspaceSession.findOne({
      user: userId,
      ...(companyId ? { companyId } : {}),
      isOfficial: true,
    });

    // 2. Fallback a la sesión maestra 'official-*'
    if (!session) {
      session = await GTC45WorkspaceSession.findOne({ conversationId: officialConvoId });
    }

    // 3. Fallback a la última sesión del usuario o empresa que tenga filas de matriz
    if (!session) {
      session = await GTC45WorkspaceSession.findOne({
        user: userId,
        ...(companyId ? { companyId } : {}),
        'matrixRows.0': { $exists: true },
      }).sort({ updatedAt: -1 });
    }
    if (!session) {
      session = await GTC45WorkspaceSession.findOne({
        user: userId,
        'matrixRows.0': { $exists: true },
      }).sort({ updatedAt: -1 });
    }

    if (!session) {
      return res.json({
        hasOfficial: false,
        conversationId: officialConvoId,
        matrixRows: [],
        chartConclusions: {},
        officialTitle: 'Matriz IPEVAR SG-SST',
        sourceConversationId: null,
      });
    }

    res.json({
      hasOfficial: true,
      conversationId: session.conversationId,
      matrixRows: session.matrixRows || [],
      chartConclusions: session.chartConclusions || {},
      officialTitle: session.officialTitle ? session.officialTitle.replace(/\bOficial\s*/gi, '').trim() : 'Matriz IPEVAR SG-SST',
      sourceConversationId: session.sourceConversationId || null,
      promotedAt: session.promotedAt || session.updatedAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    logger.error('[GTC45Workspace GET /official] Error:', error);
    res.status(500).json({ error: 'Failed to fetch official matrix' });
  }
});

// ─── OFICIAL: Establecer / Promover una matriz a Oficial del Sistema ───────────
router.post('/set-official', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    const { sourceConversationId, officialTitle, matrixRows, chartConclusions } = req.body;

    const officialConvoId = `official-${companyId || userId}`;

    // 1. Desmarcar cualquier otra matriz oficial de esta empresa
    await GTC45WorkspaceSession.updateMany(
      { user: userId, ...(companyId ? { companyId } : {}), isOfficial: true },
      { $set: { isOfficial: false } }
    );

    let rowsToSave = matrixRows;
    let conclusionsToSave = chartConclusions;
    let sourceTitle = officialTitle;

    // Si viene desde un chat específico, obtener datos de esa sesión
    if (sourceConversationId && (!rowsToSave || rowsToSave.length === 0)) {
      const sourceSession = await GTC45WorkspaceSession.findOne({ conversationId: sourceConversationId });
      if (sourceSession) {
        rowsToSave = sourceSession.matrixRows;
        conclusionsToSave = sourceSession.chartConclusions;
        sourceSession.isOfficial = true;
        sourceSession.promotedAt = new Date();
        if (officialTitle) sourceSession.officialTitle = officialTitle;
        await sourceSession.save();
      }

      if (!sourceTitle) {
        const ConversationModel = mongoose.models.Conversation || require('~/db/models').Conversation;
        if (ConversationModel) {
          const cDoc = await ConversationModel.findOne({ conversationId: sourceConversationId }).lean();
          if (cDoc?.title) sourceTitle = cDoc.title;
        }
      }
    }

    const normalizedRows = (rowsToSave || []).map(row => ({
      ...row,
      cargo: toSentenceCase(row.cargo || ''),
      proceso: toSentenceCase(row.proceso),
      zona: toSentenceCase(row.zona)
    }));

    // 2. Guardar o actualizar la sesión oficial maestra
    const officialSession = await GTC45WorkspaceSession.findOneAndUpdate(
      { conversationId: officialConvoId },
      {
        $set: {
          user: userId,
          companyId,
          matrixRows: normalizedRows,
          chartConclusions: conclusionsToSave || {},
          isOfficial: true,
          officialTitle: (sourceTitle ? sourceTitle.replace(/\bOficial\s*/gi, '').trim() : '') || 'Matriz IPEVAR SG-SST',
          sourceConversationId: sourceConversationId || null,
          promotedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    logger.info(`[GTC45Workspace /set-official] Official matrix established. Rows: ${normalizedRows.length}, user: ${userId}`);

    res.json({
      success: true,
      officialSession: {
        conversationId: officialSession.conversationId,
        matrixRows: officialSession.matrixRows,
        chartConclusions: officialSession.chartConclusions,
        officialTitle: officialSession.officialTitle,
        sourceConversationId: officialSession.sourceConversationId,
        promotedAt: officialSession.promotedAt,
      },
    });
  } catch (error) {
    logger.error('[GTC45Workspace POST /set-official] Error:', error);
    res.status(500).json({ error: 'Failed to set official matrix' });
  }
});

// ─── OFICIAL: Modificar la matriz oficial directamente desde el aplicativo ──────
router.put('/official', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    const { matrixRows, chartConclusions, officialTitle } = req.body;

    const officialConvoId = `official-${companyId || userId}`;

    const normalizedRows = (matrixRows || []).map(row => ({
      ...row,
      cargo: toSentenceCase(row.cargo || ''),
      proceso: toSentenceCase(row.proceso),
      zona: toSentenceCase(row.zona)
    }));

    const updateFields = {
      user: userId,
      companyId,
      matrixRows: normalizedRows,
      isOfficial: true,
    };
    if (chartConclusions !== undefined) updateFields.chartConclusions = chartConclusions;
    if (officialTitle) updateFields.officialTitle = officialTitle;

    const session = await GTC45WorkspaceSession.findOneAndUpdate(
      { conversationId: officialConvoId },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      matrixRows: session.matrixRows,
      chartConclusions: session.chartConclusions,
      officialTitle: session.officialTitle,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    logger.error('[GTC45Workspace PUT /official] Error:', error);
    res.status(500).json({ error: 'Failed to update official matrix' });
  }
});

// ─── OFICIAL: Listar todas las matrices de los chats para el selector ──────────
router.get('/list-user-matrices', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    const tempId = `temp-${userId}`;
    const officialConvoId = `official-${companyId || userId}`;

    // Buscar sesiones del usuario con al menos 1 fila
    const sessions = await GTC45WorkspaceSession.find({
      user: userId,
      conversationId: { $ne: tempId },
      'matrixRows.0': { $exists: true },
    }).sort({ updatedAt: -1 }).lean();

    const ConversationModel = mongoose.models.Conversation || require('~/db/models').Conversation;
    const convoIds = sessions
      .map(s => s.conversationId)
      .filter(id => id && !id.startsWith('official-'));

    let titleMap = {};
    if (ConversationModel && convoIds.length > 0) {
      try {
        const convos = await ConversationModel.find({ conversationId: { $in: convoIds } }).select('conversationId title').lean();
        convos.forEach(c => {
          titleMap[c.conversationId] = c.title || 'Chat sin título';
        });
      } catch (err) {
        logger.warn('[GTC45Workspace /list-user-matrices] Error fetching titles:', err.message);
      }
    }

    const items = sessions.map(s => {
      const isMasterOfficial = s.conversationId === officialConvoId || s.isOfficial === true;
      let displayTitle = s.officialTitle ? s.officialTitle.replace(/\bOficial\s*/gi, '').trim() : (titleMap[s.conversationId] || 'Matriz de Peligros');
      if (s.conversationId === officialConvoId) {
        displayTitle = displayTitle || '⭐ Matriz Activa del Sistema';
      }

      const rows = s.matrixRows || [];
      const criticalCount = rows.filter(r => (Number(r.nr) || 0) >= 150).length;

      return {
        conversationId: s.conversationId,
        title: displayTitle,
        isOfficial: isMasterOfficial,
        rowCount: rows.length,
        criticalCount,
        sourceConversationId: s.sourceConversationId || null,
        promotedAt: s.promotedAt || null,
        updatedAt: s.updatedAt,
      };
    });

    res.json({ matrices: items });
  } catch (error) {
    logger.error('[GTC45Workspace GET /list-user-matrices] Error:', error);
    res.status(500).json({ error: 'Failed to list user matrices' });
  }
});

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
      const tempId = `temp-${userId}`;
      const tempSession = await GTC45WorkspaceSession.findOne({ conversationId: tempId, user: userId });
      if (tempSession && tempSession.matrixRows && tempSession.matrixRows.length > 0) {
        tempSession.conversationId = conversationId;
        tempSession.companyId = companyId;
        await tempSession.save();
        session = tempSession;
        logger.info(`[GTC45Workspace GET] Migrated temporal session (${tempSession.matrixRows.length} rows) for user ${userId} to conversation ${conversationId}`);
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
      cargo: toSentenceCase(row.cargo || ''),
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
    const tempId = `temp-${userId}`;

    logger.info(`[GTC45Workspace DELETE] Clearing temporary sessions for user ${userId}`);

    // Delete GTC45 Workspace Session
    await GTC45WorkspaceSession.deleteOne({ conversationId: tempId, user: userId });

    // Delete PESV Workspace Session
    try {
      const PESVWorkspaceSession = require('~/models/PESVWorkspaceSession');
      await PESVWorkspaceSession.deleteOne({ conversationId: tempId, user: userId });
    } catch (e) {
      logger.error('[GTC45Workspace DELETE clear-temp-sessions] PESV error:', e);
    }

    // Delete Chemical Compatibility Session
    try {
      const ChemicalCompatibilitySession = require('~/models/ChemicalCompatibilitySession');
      await ChemicalCompatibilitySession.deleteOne({ conversationId: tempId, user: userId });
    } catch (e) {
      logger.error('[GTC45Workspace DELETE clear-temp-sessions] Chemical error:', e);
    }

    // Delete Live Editor Session
    try {
      const LiveEditorSession = require('~/models/LiveEditorSession');
      await LiveEditorSession.deleteOne({ conversationId: tempId, user: userId });
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

    const companyId = await getActiveCompanyId(userId);

    // Obtener perfiles de cargo de la empresa para sugerir con prioridad
    let companyCargos = Array.isArray(req.body.availableCargos) ? req.body.availableCargos : [];
    if (companyCargos.length === 0) {
      const PerfilCargoModel = mongoose.models.PerfilCargoData;
      if (PerfilCargoModel) {
        try {
          const cargoDoc = await PerfilCargoModel.findOne({
            user: userId,
            ...(companyId ? { companyId } : {}),
          }).lean();
          if (cargoDoc && Array.isArray(cargoDoc.perfilesList)) {
            companyCargos = cargoDoc.perfilesList
              .map(p => p.nombreCargo)
              .filter(Boolean)
              .map(c => toSentenceCase(c));
          }
        } catch (err) {
          logger.warn('[GTC45Workspace /ai-update-row] Error loading PerfilCargoData:', err.message);
        }
      }
    }

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

    const cleanCargoActual = (row.cargo || '').trim();
    const cleanZonaActual = (row.zona || '').trim();

    const prompt = `Eres un experto certificado en Seguridad y Salud en el Trabajo y en la metodología GTC-45:2012 colombiana.
${workerContext}
Tienes esta fila de Matriz IPEVAR:

═══ DATOS DE LA ACTIVIDAD Y PELIGRO ═══
PROCESO: ${row.proceso || 'No especificado'}
CARGO ACTUAL: ${cleanCargoActual ? cleanCargoActual : '[VACÍO - REQUIERE ASIGNACIÓN POR IA]'}
ZONA / LUGAR ACTUAL: ${cleanZonaActual ? cleanZonaActual : '[VACÍO - REQUIERE ASIGNACIÓN POR IA]'}
ACTIVIDAD: ${row.actividad || 'No especificada'}
TAREAS: ${row.tareas || 'No especificadas'}
RUTINARIA: ${row.rutinaria || 'Sí'}
PELIGRO DESCRIPCIÓN: ${row.peligro_descripcion || 'No especificado'}
CLASIFICACIÓN: ${row.peligro_clasificacion || 'No especificada'}
EFECTOS POSIBLES: ${row.efectos_posibles || 'No definidos'}
CONTROLES EXISTENTES (REGISTRADOS POR EL USUARIO — CONSERVAR):
  - Fuente: ${row.controles_fuente || 'Ninguno'}
  - Medio: ${row.controles_medio || 'Ninguno'}
  - Individuo: ${row.controles_individuo || 'Ninguno'}
ND actual: ${row.nd || 'No definido'} | NE actual: ${row.ne || 'No definido'} | NC actual: ${row.nc || 'No definido'}
Nro. Expuestos: ${row.nro_expuestos || 1}
Peor Consecuencia: ${row.peor_consecuencia || 'No definida'}
Requisito Legal: ${row.requisito_legal || 'No especificado'}
${companyCargos.length > 0 ? `\n═══ LISTA DE CARGOS DE LA EMPRESA (PRIORIZAR SI APLICAN) ═══\n${companyCargos.join(', ')}\n` : ''}

═══ TUS TAREAS OBLIGATORIAS ═══
1. CARGO:
   - Si CARGO ACTUAL ya tiene un valor válido asignado por el usuario, DEBES conservarlo exactamente igual sin modificarlo.
   - Si CARGO ACTUAL está vacío o no especificado:
     * REGLA 1 (REUTILIZAR EXISTENTES): Revisa la LISTA DE CARGOS DE LA EMPRESA. Si alguno de esos cargos existentes coincide, abarca o es idóneo para la actividad, tareas y proceso (por ejemplo: si la actividad es de socios/gerencia y existe "Socio Director" o "Gerente General"; o si es administrativa y existe "Personal Administrativo"), DEBES asignar EXACTAMENTE ese nombre de cargo registrado.
     * REGLA 2 (CREAR NUEVO SOLO SI NO EXISTE): ÚNICAMENTE si ABSOLUTAMENTE NINGUNO de los cargos registrados de la empresa corresponde a la labor, deduce y crea un nuevo nombre de cargo profesional, técnico y conciso en español para esa actividad (por ejemplo: si la actividad es "SOCIO DIRECTOR, SOCIOS GERENTES" y no existía, el cargo es "Socio Director"; si es soldadura, "Soldador"). NUNCA fuerces un cargo administrativo si la labor es gerencial/directiva o de manufactura/operativa.
2. ZONA / LUGAR:
   - Si ZONA / LUGAR ACTUAL está vacía o no especificada, deduce la zona, área o locación física adecuada para este proceso y actividad (ej: "Oficinas Administrativas", "Área de Dirección", "Planta de Producción", "Almacén", "Obra", etc.).
   - Si ya tenía una zona fijada por el usuario, consérvala tal cual.
3. Determina ND, NE, NC correctos según GTC-45:2012. 
   IMPORTANTE DE ESTABILIDAD: Si ND actual (${row.nd}), NE actual (${row.ne}) y NC actual (${row.nc}) ya tienen valores numéricos válidos en la escala GTC-45 (ND en [0, 2, 6, 10], NE en [1, 2, 3, 4], NC en [10, 25, 60, 100]), DEBES conservarlos exactamente igual en tu respuesta en los campos "nd", "ne" y "nc". Solo recalcula si están vacíos, son cero o si el usuario modificó sustancialmente los controles existentes arriba.
4. Propón medidas de ELIMINACIÓN, SUSTITUCIÓN, INGENIERÍA, ADMINISTRATIVAS y EPP adecuadas a futuro.
5. Completa factores_reduccion con justificación técnica y costo-beneficio (Anexo E). NUNCA dejar vacío.
6. Si los campos nro_expuestos, peor_consecuencia y requisito_legal están vacíos o no definidos, propón o estima valores adecuados basados en el peligro. De lo contrario, consérvalos.

REGLA ABSOLUTA: Los campos "controles_fuente", "controles_medio" y "controles_individuo" en tu respuesta JSON DEBEN ser exactamente iguales a los valores de los controles existentes mostrados arriba. NO los cambies.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con estos campos exactos:
{
  "cargo": "<nombre del cargo deducido o conservado>",
  "zona": "<nombre de la zona deducida o conservada>",
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

    // Sanitize and format cargo and zona
    if (updatedFields.cargo) {
      updatedFields.cargo = toSentenceCase(String(updatedFields.cargo).replace(/^["']|["']$/g, '').replace(/\.$/, '').trim());
    }
    if (updatedFields.zona) {
      updatedFields.zona = toSentenceCase(String(updatedFields.zona).replace(/^["']|["']$/g, '').replace(/\.$/, '').trim());
    }

    // Enforce default existing controls just in case
    updatedFields.controles_fuente = row.controles_fuente || 'Ninguno';
    updatedFields.controles_medio = row.controles_medio || 'Ninguno';
    updatedFields.controles_individuo = row.controles_individuo || 'Ninguno';

    // Si la IA asignó o creó un cargo, asegurar que exista y se cree de verdad en Perfiles de Cargo (PerfilCargoData)
    let newPerfilCreated = false;
    if (updatedFields.cargo && typeof ensurePerfilExists === 'function') {
      try {
        const perfilRes = await ensurePerfilExists(userId, companyId, updatedFields.cargo, {
          ...row,
          ...updatedFields,
        });
        if (perfilRes.created) {
          newPerfilCreated = true;
          logger.info(`[GTC45/ai-update-row] Nuevo perfil de cargo "${updatedFields.cargo}" creado y sincronizado en PerfilCargoData.`);
        }
      } catch (perfilErr) {
        logger.warn('[GTC45/ai-update-row] Error asegurando perfil de cargo:', perfilErr.message);
      }
    }

    logger.info(`[GTC45/ai-update-row] Row updated for user ${userId}, NR=${updatedFields.nr}`);
    return res.json({ updatedFields, newPerfilCreated });

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
      loadedCompanyInfo = await CompanyInfo.findOne({ user: userId, isActive: true }).lean()
        || await CompanyInfo.findOne({ user: userId }).lean();
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

    const companyId = await getActiveCompanyId(userId);
    const cleanedRows = cleanRawRows(rawRows);

    // Obtener perfiles de cargo existentes de la empresa para emparejar la actividad con su descripción
    const PerfilCargoModel = mongoose.models.PerfilCargoData;
    let perfilesDetallados = [];
    if (PerfilCargoModel) {
      try {
        const cargoDoc = await PerfilCargoModel.findOne({
          user: userId,
          ...(companyId ? { companyId } : {}),
        }).lean();
        if (cargoDoc && Array.isArray(cargoDoc.perfilesList)) {
          perfilesDetallados = cargoDoc.perfilesList
            .filter((p) => p && p.nombreCargo)
            .map((p) => ({
              nombreCargo: toSentenceCase(p.nombreCargo),
              area: p.area || '',
              nivelCargo: p.nivelCargo || '',
              descripcion: (
                p.contextoAdicional ||
                (p.report ? p.report.replace(/<[^>]+>/g, ' ').substring(0, 400) : '') ||
                ''
              ).trim(),
            }));
        }
      } catch (err) {
        logger.warn('[GTC45/ai-parse-matrix] Error loading PerfilCargoData:', err.message);
      }
    }

    const perfilesFormatText = perfilesDetallados.length > 0
      ? perfilesDetallados
          .map(
            (p, i) =>
              `${i + 1}. CARGO: "${p.nombreCargo}"
   - Área: ${p.area || 'General'} | Nivel: ${p.nivelCargo || 'Operativo'}
   - DESCRIPCIÓN Y ACTIVIDADES DEL PERFIL: ${p.descripcion || 'Sin descripción adicional'}`
          )
          .join('\n\n')
      : 'No hay cargos registrados previamente en el aplicativo de Perfiles de la empresa.';

    const CHUNK_SIZE = 50;
    const chunks = [];
    for (let i = 0; i < cleanedRows.length; i += CHUNK_SIZE) {
      chunks.push(cleanedRows.slice(i, i + CHUNK_SIZE));
    }

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    logger.info(`[GTC45/ai-parse-matrix] Processing ${cleanedRows.length} rows for user ${userId} in ${chunks.length} chunks (chunk size ${CHUNK_SIZE})`);

    const combinedRows = [];

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunk = chunks[chunkIdx];
      if (chunkIdx > 0) {
        // Pausa de 500ms para evitar saturación de tasa (concurrencia) en el API de Gemini
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      logger.info(`[GTC45/ai-parse-matrix] Processing chunk ${chunkIdx + 1}/${chunks.length} for user ${userId}`);

      const prompt = `Eres un experto certificado en Seguridad y Salud en el Trabajo y en la metodología GTC-45:2012 colombiana.
Te hemos proporcionado una lista de filas extraídas de una matriz o archivo Excel.
Tu tarea es mapear y adaptar con máxima fidelidad la información existente de cada fila al formato estándar de Wappy (GTC-45 IPEVAR), ASIGNANDO ADEMÁS EL CARGO CORRESPONDIENTE COMPARANDO LA ACTIVIDAD CON LOS PERFILES DE LA EMPRESA.

CATÁLOGO DE PERFILES DE CARGO REGISTRADOS EN LA EMPRESA (CON SU DESCRIPCIÓN):
${perfilesFormatText}

REGLA DE ORO DE FIDELIDAD (NO INVENTAR):
- Respeta estrictamente los datos, peligros, descripciones, consecuencias, procesos y controles presentes en las filas de origen. NUNCA inventes peligros no descritos ni sustituyas la información original por ejemplos genéricos.
- Si en el origen un campo ya tiene información específica (ej. peligros, consecuencias, controles existentes de fuente/medio/individuo, medidas de intervención), CONSÉRVALA fielmente.
- Si en el origen un control o medida no existe o viene en blanco, escribe 'Ninguno' o 'No aplica'. No inventes controles artificiales a menos que se trate de inferir la clasificación técnica estricta GTC-45 (Físico, Químico, Biológico, Biomecánico, Psicosocial, Condiciones de seguridad, Fenómenos naturales).

REGLA CLAVE DE ASIGNACIÓN DE CARGO (LA ACTIVIDAD DEBE PARECERSE A LA DESCRIPCIÓN DEL PERFIL):
- Analiza con cuidado el campo "actividad" y "tareas" de cada fila.
- Compara la labor descrita en la "actividad" con el campo "DESCRIPCIÓN Y ACTIVIDADES DEL PERFIL" de cada perfil de cargo registrado en la empresa.
- Si la actividad coincide, se asemeja o describe tareas correspondientes a la descripción de un perfil registrado, asigna EXACTAMENTE ese nombre de cargo registrado.
- Ejemplo: Si la actividad dice "Socio director, socios gerentes (administrativo...)" o describe labores gerenciales/directivas, debe emparejarse con el perfil directivo registrado de la empresa (ej: "Director de Proyecto / Gerente de Obra" o "Socio Director").
- Si no hay coincidencia con ningún perfil registrado, infiere un nombre de cargo profesional técnico coherente con la labor.

El formato de salida que requerimos para cada fila es un objeto JSON con la siguiente estructura exacta:
{
  "cargo": "<Nombre exacto del cargo asignado según la descripción de los perfiles de la empresa o acorde a la actividad.>",
  "proceso": "<área, proceso o sección original en formato tipo oración (ej. Administración, Operativo, Gestión Humana).>",
  "zona": "<zona, lugar, oficina o sede original en formato tipo oración. Si no está especificada, usa la misma área o 'Instalaciones principales'.>",
  "actividad": "<cargo o actividad descrita en la fila original.>",
  "tareas": "<tareas descritas en la fila original.>",
  "rutinaria": "<'Sí' o 'No' según los datos de origen o criterio técnico.>",
  "peligro_descripcion": "<descripción exacta del peligro o factor de riesgo presente en la fila original.>",
  "peligro_clasificacion": "<Clasificación estricta del peligro según GTC-45. Debe ser uno de los siguientes: 'Físico', 'Químico', 'Biológico', 'Biomecánico', 'Psicosocial', 'Condiciones de seguridad' o 'Fenómenos naturales'.>",
  "efectos_posibles": "<efectos posibles a la salud, consecuencias o lesiones presentes en la fila original.>",
  "controles_fuente": "<controles existentes en la fuente del archivo original, o 'Ninguno'.>",
  "controles_medio": "<controles existentes en el medio del archivo original, o 'Ninguno'.>",
  "controles_individuo": "<controles existentes en el individuo/persona del archivo original, o 'Ninguno'.>",
  "nd": <Nivel de Deficiencia numérico (0, 2, 6 o 10) según el origen o GTC-45.>,
  "ne": <Nivel de Exposición numérico (1, 2, 3 o 4) según el origen o GTC-45.>,
  "np": <Nivel de Probabilidad numérico: nd * ne.>,
  "nc": <Nivel de Consecuencia numérico (10, 25, 60 o 100) según el origen o GTC-45.>,
  "nr": <Nivel de Riesgo numérico: np * nc.>,
  "interpretacion_nr": "<'I' si nr >= 500, 'II' si nr entre 150 y 499, 'III' si nr entre 40 y 149, 'IV' si nr < 40.>",
  "aceptabilidad": "<'No Aceptable' si I, 'No Aceptable o Aceptable con control específico' si II, 'Mejorable' si III, 'Aceptable' si IV.>",
  "medida_eliminacion": "<medida de eliminación del archivo original, o 'Ninguno'.>",
  "medida_sustitucion": "<medida de sustitución del archivo original, o 'Ninguno'.>",
  "medida_ingenieria": "<medida de control de ingeniería del archivo original, o 'Ninguno'.>",
  "medida_administrativa": "<medida de control administrativo/capacitación del archivo original, o 'Ninguno'.>",
  "medida_eppu": "<EPP/Equipos del archivo original, o 'Ninguno'.>",
  "factores_reduccion": "<Factores de reducción del archivo original, o 'No aplica'.>"
}

Reglas importantes:
1. Sé inteligente al mapear campos si las celdas originales contienen nombres de columnas variados (ej. 'RIESGO' -> clasificación, 'PELIGRO' -> descripción, 'CONSECUENCIAS' -> efectos posibles).
2. Si los valores numéricos de ND, NE, NC o NR están presentes, consérvalos o ajústalos a la escala GTC-45 (ND: 0/2/6/10, NE: 1/2/3/4, NC: 10/25/60/100) y calcula matemáticamente np = nd * ne y nr = np * nc.
3. El resultado debe ser EXCLUSIVAMENTE un array JSON válido que contenga la misma cantidad de elementos que el original. No incluyes explicaciones ni markdown (\`\`\`json).

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
        logger.warn(`[GTC45/ai-parse-matrix] Direct JSON parse failed for chunk ${chunkIdx + 1}, attempting repair:`, err.message);
        const startIdx = text.indexOf('[');
        if (startIdx !== -1) {
          let arrayStr = text.slice(startIdx);
          const lastObjEnd = arrayStr.lastIndexOf('}');
          if (lastObjEnd !== -1) {
            try {
              parsed = JSON.parse(arrayStr.slice(0, lastObjEnd + 1) + ']');
            } catch (e2) {
              logger.error(`[GTC45/ai-parse-matrix] JSON repair failed in chunk ${chunkIdx + 1}:`, e2.message);
            }
          }
        }
        if (!parsed) {
          throw new Error('La IA devolvió un formato JSON inválido para uno de los lotes. Por favor, intenta de nuevo.');
        }
      }

      if (!Array.isArray(parsed)) {
        if (typeof parsed === 'object' && parsed !== null) {
          parsed = [parsed];
        } else {
          throw new Error('La IA no devolvió un listado de filas en el formato esperado.');
        }
      }

      const mappedChunk = parsed.map(row => {
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
          cargo: toSentenceCase(row.cargo || ''),
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

      combinedRows.push(...mappedChunk);
    }

    logger.info(`[GTC45/ai-parse-matrix] Successfully mapped ${combinedRows.length} rows for user ${userId}`);
    return res.json({ matrixRows: combinedRows });

  } catch (error) {
    logger.error('[GTC45/ai-parse-matrix] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── OFICIAL / CHAT: Auto-asignar Cargos a las filas de la matriz con IA ────────
router.post('/auto-assign-cargos', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const { matrixRows, conversationId } = req.body;

    if (!matrixRows || !Array.isArray(matrixRows) || matrixRows.length === 0) {
      return res.status(400).json({ error: 'No se enviaron filas de la matriz para procesar.' });
    }

    // 1. Obtener los perfiles de cargo existentes de la empresa con descripción completa
    const PerfilCargoModel = mongoose.models.PerfilCargoData;
    let availableCargos = [];
    let perfilesDetallados = [];
    if (PerfilCargoModel) {
      try {
        const cargoDoc = await PerfilCargoModel.findOne({
          user: userId,
          ...(companyId ? { companyId } : {}),
        }).lean();
        if (cargoDoc && Array.isArray(cargoDoc.perfilesList)) {
          perfilesDetallados = cargoDoc.perfilesList
            .filter((p) => p && p.nombreCargo)
            .map((p) => ({
              nombreCargo: toSentenceCase(p.nombreCargo),
              area: p.area || '',
              nivelCargo: p.nivelCargo || '',
              descripcion: (
                p.contextoAdicional ||
                (p.report ? p.report.replace(/<[^>]+>/g, ' ').substring(0, 400) : '') ||
                ''
              ).trim(),
            }));
          availableCargos = perfilesDetallados.map((p) => p.nombreCargo);
        }
      } catch (err) {
        logger.warn('[GTC45Workspace /auto-assign-cargos] Error loading PerfilCargoData:', err.message);
      }
    }

    // 2. Extraer información de la empresa si existe
    let companyContext = '';
    const company = await CompanyInfo.findOne({ user: userId, ...(companyId ? { companyId } : {}) }).lean();
    if (company) {
      companyContext = `Empresa: ${company.companyName || ''}, Actividad: ${company.economicActivity || ''}, Sector: ${company.sector || ''}`;
    }

    // 3. Preparar formato textual enriquecido de los perfiles para la IA
    const perfilesFormatText = perfilesDetallados.length > 0
      ? perfilesDetallados
          .map(
            (p, i) =>
              `${i + 1}. CARGO: "${p.nombreCargo}"
   - Área: ${p.area || 'General'} | Nivel: ${p.nivelCargo || 'Operativo'}
   - DESCRIPCIÓN Y ACTIVIDADES DEL PERFIL: ${p.descripcion || 'Sin descripción detallada'}`
          )
          .join('\n\n')
      : 'No hay cargos registrados previamente en el aplicativo de Perfiles de la empresa.';

    // 4. Preparar resumen compacto de filas para optimizar tokens
    const rowsSummary = matrixRows.map((r, index) => ({
      index,
      proceso: r.proceso || '',
      zona: r.zona || '',
      actividad: r.actividad || '',
      tareas: r.tareas || '',
      peligro: r.peligro_descripcion || '',
      clasificacion: r.peligro_clasificacion || '',
      cargoActual: r.cargo || '',
    }));

    const prompt = `Eres un Director Senior de Seguridad y Salud en el Trabajo (SG-SST) y Recursos Humanos experto en perfiles de cargo, profesiogramas y matrices de peligros IPEVAR (GTC-45:2012).
Tu misión es ASIGNAR con la máxima precisión el CARGO o puesto de trabajo correspondiente a cada fila de la matriz de riesgos.

CONTEXTO EMPRESARIAL:
${companyContext || 'No especificado'}

CATÁLOGO DE PERFILES DE CARGO REGISTRADOS EN LA EMPRESA (CON SU DESCRIPCIÓN Y ACTIVIDADES):
${perfilesFormatText}

FILAS A CLASIFICAR (Array JSON):
${JSON.stringify(rowsSummary, null, 2)}

REGLA CLAVE DE ORO (LA ACTIVIDAD DE LA MATRIZ DEBE PARECERSE A LA DESCRIPCIÓN DEL PERFIL):
1. Revisa con sumo cuidado el texto de "actividad" y "tareas" de cada fila de la matriz.
2. Compara dicha labor contra la "DESCRIPCIÓN Y ACTIVIDADES DEL PERFIL" de cada perfil de cargo de la empresa listado arriba.
3. Si la actividad de la fila coincide, se asemeja, se relaciona o describe funciones que forman parte de la descripción de un perfil registrado:
   - ASIGNA EXACTAMENTE EL NOMBRE DE ESE CARGO ("nombreCargo" exacto del catálogo registrado).
   - Ejemplo: Si la actividad dice "Socio director, socios gerentes (administrativo...)" o describe labores gerenciales o directivas, compárala con la descripción de los perfiles directivos registrados (ej: "Director de Proyecto / Gerente de Obra" o "Socio Director") y asígnalo.
   - Ejemplo: Si la actividad describe excavaciones, zanjas o movimiento de tierras, emparéjala con el perfil de cargo cuya descripción abarca esa labor ("Operador de Excavadora", "Ayudante Práctico de Excavación", etc.).
   - Ejemplo: Si la actividad describe encofrados, formaleta o armado de vigas, compárala con "Oficial de Encofrados y Formaleta", etc.
4. Si una fila YA tiene un cargo asignado en "cargoActual" que coincide con uno de los cargos de la empresa y es coherente con la actividad, CONSÉRVALO. Si está vacío o dice "Cargo / Rol...", asígnalo obligatoriamente.
5. Solo si la actividad de la fila es completamente ajena y no guarda ninguna relación con ninguno de los perfiles registrados de la empresa, asigna un nombre de cargo profesional, técnico y formal en español acorde a la labor.

FORMATO DE SALIDA:
Responde ÚNICAMENTE con un JSON array válido de objetos con este formato exacto, sin texto adicional ni bloques markdown (\`\`\`json):
[
  { "index": 0, "cargo": "Nombre del Cargo Exacto" },
  { "index": 1, "cargo": "Nombre del Cargo Exacto" }
]`;

    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    let text = result.response.text().trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let assignedList = [];
    try {
      assignedList = JSON.parse(text);
    } catch (e) {
      logger.warn('[GTC45Workspace /auto-assign-cargos] Direct JSON parse failed, repairing...', e.message);
      const startIdx = text.indexOf('[');
      const endIdx = text.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        try {
          assignedList = JSON.parse(text.substring(startIdx, endIdx + 1));
        } catch (e2) {
          logger.error('[GTC45Workspace /auto-assign-cargos] Repair failed:', e2.message);
        }
      }
    }

    if (!Array.isArray(assignedList)) {
      throw new Error('La respuesta de la IA no tuvo el formato esperado.');
    }

    const assignedMap = new Map();
    assignedList.forEach(item => {
      if (item && item.index !== undefined && item.cargo) {
        assignedMap.set(Number(item.index), toSentenceCase(item.cargo));
      }
    });

    const updatedRows = matrixRows.map((row, idx) => {
      const assignedCargo = assignedMap.get(idx);
      return {
        ...row,
        cargo: assignedCargo || toSentenceCase(row.cargo || 'Operario General'),
        proceso: toSentenceCase(row.proceso || ''),
        zona: toSentenceCase(row.zona || '')
      };
    });

    // Si se pasa conversationId o es oficial, actualizar directamente la sesión en base de datos
    const targetConvoId = (!conversationId || conversationId === 'official' || conversationId.startsWith('official-'))
      ? `official-${companyId || userId}`
      : conversationId;

    await GTC45WorkspaceSession.findOneAndUpdate(
      { conversationId: targetConvoId },
      { $set: { matrixRows: updatedRows } }
    );
    logger.info(`[GTC45Workspace /auto-assign-cargos] Persisted ${updatedRows.length} rows to session ${targetConvoId}`);

    // Asegurar que todos los cargos asignados queden creados y persistidos en Perfiles de Cargo (PerfilCargoData)
    if (typeof ensurePerfilExists === 'function') {
      try {
        for (const r of updatedRows) {
          if (r.cargo && r.cargo.trim()) {
            await ensurePerfilExists(userId, companyId, r.cargo, r);
          }
        }
      } catch (e) {
        logger.warn('[GTC45Workspace /auto-assign-cargos] Error asegurando perfiles:', e.message);
      }
    }

    res.json({
      success: true,
      message: `Se asignaron cargos automáticamente a ${updatedRows.length} filas con IA.`,
      matrixRows: updatedRows,
      availableCargosCount: availableCargos.length,
    });
  } catch (error) {
    logger.error('[GTC45Workspace POST /auto-assign-cargos] Error:', error);
    res.status(500).json({ error: error.message || 'Error al auto-asignar cargos con IA' });
  }
});

// ─── OFICIAL / CHAT: Sincronizar Controles Propuestos y Generar Factores de Reducción (Anexo E) con Centro de Control ──
router.post('/sync-controles-anexo-e', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    const { matrixRows, conversationId } = req.body;

    if (!matrixRows || !Array.isArray(matrixRows) || matrixRows.length === 0) {
      return res.status(400).json({ error: 'No se enviaron filas de la matriz para procesar.' });
    }

    const cleanControlText = (val) => {
      if (!val || typeof val !== 'string') return '';
      const trimmed = val.trim();
      const lower = trimmed.toLowerCase();
      if (['ninguno', 'ninguna', 'no aplica', 'n/a', 'na', 'ninguno.', 'no'].includes(lower)) return '';
      return trimmed;
    };

    const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    const today = new Date();
    let syncedCount = 0;

    // Actualizar filas y sintetizar Anexo E en caso de estar vacío o en "No aplica"
    const updatedRows = matrixRows.map((row, idx) => {
      const controls = [];
      const elim = cleanControlText(row.medida_eliminacion);
      if (elim) controls.push({ category: 'Eliminación', text: elim, hierarchy: 1, actionType: 'correctiva' });

      const sust = cleanControlText(row.medida_sustitucion);
      if (sust) controls.push({ category: 'Sustitución', text: sust, hierarchy: 2, actionType: 'correctiva' });

      const ing = cleanControlText(row.medida_ingenieria);
      if (ing) controls.push({ category: 'Ingeniería', text: ing, hierarchy: 3, actionType: 'correctiva' });

      const adm = cleanControlText(row.medida_administrativa);
      if (adm) controls.push({ category: 'Administrativo', text: adm, hierarchy: 4, actionType: 'preventiva' });

      const epp = cleanControlText(row.medida_eppu);
      if (epp) controls.push({ category: 'EPP', text: epp, hierarchy: 5, actionType: 'preventiva' });

      const isCritical = (row.nd >= 6 && row.nc >= 25) || (row.nr >= 500) ||
        (typeof row.aceptabilidad === 'string' && (row.aceptabilidad.includes('I') || row.aceptabilidad.toLowerCase().includes('no aceptable')));
      const isHigh = (row.nr >= 150) || (typeof row.interpretacion_nr === 'string' && row.interpretacion_nr === 'II');

      let newFactores = row.factores_reduccion || '';
      const needsAnexoE = !newFactores || newFactores.trim() === '' || newFactores.toLowerCase().includes('no aplica');

      if (controls.length > 0 || isCritical || isHigh) {
        let bestControl = controls.find((c) => c.category === 'Ingeniería')
          || controls.find((c) => c.category === 'Sustitución')
          || controls.find((c) => c.category === 'Eliminación')
          || controls.find((c) => c.category === 'Administrativo')
          || controls.find((c) => c.category === 'EPP');

        if (!bestControl) {
          bestControl = {
            category: 'Intervención Crítica',
            text: 'Diseñar e implementar controles de mitigación inmediata en la fuente o medio',
            actionType: 'correctiva',
          };
        }

        if (needsAnexoE) {
          const controlTipo = bestControl.category;
          const controlTexto = bestControl.text.replace(/^[*•-]\s*/, '').trim();
          const peligro = row.peligro_clasificacion || 'este factor de riesgo';
          const cargo = row.cargo || 'personal del área';
          const peorCons = row.peor_consecuencia || 'incapacidades laborales y deterioro de la salud';
          const proceso = row.proceso || 'la operación';

          newFactores = `Control óptimo en relación costo-beneficio (Anexo E GTC-45): Se prioriza la medida de ${controlTipo} ("${controlTexto}") al mitigar el peligro (${peligro}) en el origen o medio de forma colectiva y duradera para el cargo de ${cargo} en ${proceso}. Frente al costo potencial de ${peorCons} y contingencias legales, esta intervención representa la mayor rentabilidad técnica y financiera comparada con medidas puramente administrativas o de protección individual.`;
        }
      }

      return {
        ...row,
        factores_reduccion: newFactores || row.factores_reduccion || 'No aplica',
      };
    });

    // Sincronizar en base de datos de Kanban (KanbanTask)
    if (KanbanTask) {
      const activeIpevarRefs = new Set();

      for (let i = 0; i < updatedRows.length; i++) {
        const row = updatedRows[i];
        const rowId = row.id || `row-${i}`;

        const controls = [];
        const elim = cleanControlText(row.medida_eliminacion);
        if (elim) controls.push({ category: 'Eliminación', text: elim, hierarchy: 1, actionType: 'correctiva' });
        const sust = cleanControlText(row.medida_sustitucion);
        if (sust) controls.push({ category: 'Sustitución', text: sust, hierarchy: 2, actionType: 'correctiva' });
        const ing = cleanControlText(row.medida_ingenieria);
        if (ing) controls.push({ category: 'Ingeniería', text: ing, hierarchy: 3, actionType: 'correctiva' });
        const adm = cleanControlText(row.medida_administrativa);
        if (adm) controls.push({ category: 'Administrativo', text: adm, hierarchy: 4, actionType: 'preventiva' });
        const epp = cleanControlText(row.medida_eppu);
        if (epp) controls.push({ category: 'EPP', text: epp, hierarchy: 5, actionType: 'preventiva' });

        const isCritical = (row.nd >= 6 && row.nc >= 25) || (row.nr >= 500) ||
          (typeof row.aceptabilidad === 'string' && (row.aceptabilidad.includes('I') || row.aceptabilidad.toLowerCase().includes('no aceptable')));
        const isHigh = (row.nr >= 150) || (typeof row.interpretacion_nr === 'string' && row.interpretacion_nr === 'II');

        if (controls.length > 0 || isCritical || isHigh) {
          let bestControl = controls.find((c) => c.category === 'Ingeniería')
            || controls.find((c) => c.category === 'Sustitución')
            || controls.find((c) => c.category === 'Eliminación')
            || controls.find((c) => c.category === 'Administrativo')
            || controls.find((c) => c.category === 'EPP');

          if (!bestControl) {
            bestControl = {
              category: 'Intervención Crítica',
              text: 'Diseñar e implementar controles de mitigación inmediata en la fuente o medio',
              actionType: 'correctiva',
            };
          }

          const otherControls = controls.filter((c) => c !== bestControl);
          const anexoE = row.factores_reduccion;
          const dueDate = isCritical ? addDays(today, 15) : isHigh ? addDays(today, 30) : addDays(today, 60);
          const priority = (isCritical || isHigh) ? 'alta' : 'media';
          const actionType = bestControl.actionType || 'correctiva';

          const cleanText = bestControl.text.replace(/^[*•-]\s*/, '').trim();
          const title = `[Control Propuesto · ${bestControl.category}] ${cleanText.length > 70 ? cleanText.substring(0, 67) + '…' : cleanText}`;

          const description = `Control propuesto con mejor relación costo-beneficio según Factores de Reducción (Anexo E GTC-45).
• Proceso: ${row.proceso || 'Operativo'} | Zona/Lugar: ${row.zona || 'Área general'}
• Peligro: ${row.peligro_clasificacion || 'Peligro'} - ${row.peligro_descripcion || 'No especificado'}
• Nivel de Riesgo: ${row.interpretacion_nr ? `Nivel ${row.interpretacion_nr}` : 'Evaluado'} (NR: ${row.nr || 'N/A'}) - ${row.aceptabilidad || ''}
• Cargo Expuesto: ${row.cargo || 'Personal'} (Expuestos: ${row.nro_expuestos || 1})
• Control Óptimo (Costo/Beneficio): [${bestControl.category}] ${bestControl.text}
${otherControls.length > 0 ? `• Controles Complementarios: ${otherControls.map((c) => `[${c.category}] ${c.text}`).join(' | ')}\n` : ''}• Factores de Reducción (Anexo E): ${anexoE}`;

          const referenceId = `ipevar-control-${rowId}`;
          const referenceName = `Matriz IPEVAR (${row.peligro_clasificacion || 'GTC-45'})`;

          activeIpevarRefs.add(referenceId);
          activeIpevarRefs.add(`ipevar-${rowId}`);

          let task = await KanbanTask.findOne({
            user: userId,
            companyId,
            referenceId: { $in: [referenceId, `ipevar-${rowId}`] },
          });

          if (!task) {
            await KanbanTask.create({
              user: userId,
              companyId,
              title,
              description,
              dueDate,
              status: 'todo',
              type: 'ipevar_finding',
              priority,
              actionType,
              assignedTo: row.cargo || 'Coordinador SST',
              sourceModule: 'matriz_ipevar',
              referenceId,
              referenceName,
            });
            syncedCount++;
          } else if (task.status !== 'done' && task.status !== 'dismissed') {
            task.referenceId = referenceId;
            task.title = title;
            task.description = description;
            task.priority = priority;
            task.actionType = actionType;
            await task.save();
            syncedCount++;
          }
        }
      }

      // Limpiar tareas pendientes que ya no pertenezcan a las filas activas
      if (activeIpevarRefs.size > 0) {
        await KanbanTask.deleteMany({
          user: userId,
          companyId,
          sourceModule: 'matriz_ipevar',
          status: { $in: ['todo', 'due_soon'] },
          referenceId: { $nin: Array.from(activeIpevarRefs) },
        });
      }
    }

    // Persistir filas actualizadas en la sesión activa / oficial
    if (conversationId) {
      const isOfficial = conversationId.startsWith('official-');
      await GTC45WorkspaceSession.findOneAndUpdate(
        { conversationId, ...(isOfficial ? {} : { user: userId }) },
        { $set: { matrixRows: updatedRows } }
      );
    } else {
      await GTC45WorkspaceSession.findOneAndUpdate(
        {
          $or: [
            { user: userId, isOfficial: true },
            ...(companyId ? [{ companyId, isOfficial: true }] : []),
            { conversationId: `official-${companyId || userId}` },
          ],
        },
        { $set: { matrixRows: updatedRows } }
      );
    }

    res.json({
      success: true,
      message: `Se analizaron y sincronizaron ${syncedCount} controles propuestos (Anexo E Costo/Beneficio) con el Centro de Control.`,
      matrixRows: updatedRows,
      syncedCount,
    });
  } catch (error) {
    logger.error('[GTC45Workspace POST /sync-controles-anexo-e] Error:', error);
    res.status(500).json({ error: error.message || 'Error al sincronizar controles y Anexo E' });
  }
});

module.exports = router;


