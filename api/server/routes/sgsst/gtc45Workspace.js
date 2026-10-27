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

    // 1. Buscar sesión marcada explícitamente como oficial con filas
    let session = await GTC45WorkspaceSession.findOne({
      user: userId,
      ...(companyId ? { companyId } : { $or: [{ companyId: null }, { companyId: { $exists: false } }] }),
      isOfficial: true,
      'matrixRows.0': { $exists: true },
    });

    // 2. Fallback a la sesión maestra 'official-*' con filas
    if (!session) {
      session = await GTC45WorkspaceSession.findOne({
        conversationId: officialConvoId,
        ...(companyId ? { companyId } : {}),
        'matrixRows.0': { $exists: true },
      });
    }

    // 3. Fallback a la última sesión de la empresa activa que tenga filas de matriz
    if (!session) {
      session = await GTC45WorkspaceSession.findOne({
        user: userId,
        ...(companyId ? { companyId } : { $or: [{ companyId: null }, { companyId: { $exists: false } }] }),
        'matrixRows.0': { $exists: true },
      }).sort({ updatedAt: -1 });
    }

    if (!session) {
      return res.json({
        hasOfficial: false,
        conversationId: officialConvoId,
        matrixRows: [],
        chartConclusions: {},
        officialTitle: 'Matriz IPEVR SG-SST',
        sourceConversationId: null,
      });
    }

    let matrixRows = session.matrixRows || [];
    let updatedInDb = false;
    matrixRows = matrixRows.map((r) => {
      if (r.factores_reduccion && r.factores_reduccion.startsWith('Aporte participativo de') && !r.origen_reporte) {
        updatedInDb = true;
        return {
          ...r,
          origen_reporte: r.factores_reduccion,
          factores_reduccion: 'Técnicamente viable y altamente costo-efectiva según Anexo E de la GTC-45. La implementación de medidas en fuente/medio reduce el nivel de deficiencia y la probabilidad del riesgo.',
        };
      }
      return r;
    });
    if (updatedInDb) {
      session.matrixRows = matrixRows;
      session.save().catch((err) => logger.warn('[GTC45Workspace GET /official] Error saving sanitized rows:', err));
    }

    res.json({
      hasOfficial: true,
      conversationId: session.conversationId,
      matrixRows,
      chartConclusions: session.chartConclusions || {},
      officialTitle: session.officialTitle ? session.officialTitle.replace(/\bOficial\s*/gi, '').trim() : 'Matriz IPEVR SG-SST',
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
        // IMPORTANTE: NO marcar isOfficial=true en la sesión de chat fuente.
        // Solo la sesión oficial (conversationId === officialConvoId) debe tener isOfficial=true.
        // Usamos promotedAt para registrar cuándo fue promovida.
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
          officialTitle: (sourceTitle ? sourceTitle.replace(/\bOficial\s*/gi, '').trim() : '') || 'Matriz IPEVR SG-SST',
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

    // Sincronización en paralelo: Si esta matriz oficial proviene de un chat activo, sincronizar también el chat
    if (session && session.sourceConversationId) {
      await GTC45WorkspaceSession.findOneAndUpdate(
        { conversationId: session.sourceConversationId },
        {
          $set: {
            matrixRows: normalizedRows,
            ...(chartConclusions !== undefined ? { chartConclusions } : {}),
            updatedAt: new Date(),
          },
        }
      );
      logger.info(`[GTC45Workspace PUT /official] Sincronizada en paralelo con el chat fuente "${session.sourceConversationId}"`);
    }

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

    // Buscar sesiones de la empresa activa (o del usuario si no tiene empresa asignada) con al menos 1 fila
    const companyFilter = companyId
      ? { companyId }
      : { $or: [{ companyId: null }, { companyId: { $exists: false } }] };

    const sessions = await GTC45WorkspaceSession.find({
      user: userId,
      ...companyFilter,
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
      // SOLO la sesión cuyo conversationId es exactamente officialConvoId es la "ACTIVA".
      // No usar s.isOfficial de la DB en sesiones de chat — ese flag puede quedar sucio.
      const isMasterOfficial = s.conversationId === officialConvoId;
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
      const anySession = await GTC45WorkspaceSession.findOne({ conversationId });
      logger.debug(`[GTC45Workspace GET] fallback lookup result: ${anySession ? `found (user=${anySession.user}, companyId=${anySession.companyId}, rows=${anySession.matrixRows?.length})` : 'NOT FOUND'}`);
      if (anySession) {
        // Si la sesión ya tiene un companyId distinto a la empresa activa actual, pertenece a OTRA empresa.
        // No adoptarla ni devolver sus filas para evitar mezclar datos entre empresas.
        if (anySession.companyId && companyId && String(anySession.companyId) !== String(companyId)) {
          logger.info(`[GTC45Workspace GET] Session ${conversationId} belongs to company ${anySession.companyId}, not active company ${companyId}. Returning empty to prevent cross-company mix.`);
          return res.json({ matrixRows: [], chartConclusions: {}, companyMismatch: true });
        }
        let modified = false;
        if (!anySession.user) {
          anySession.user = userId;
          modified = true;
        }
        if (!anySession.companyId && companyId) {
          anySession.companyId = companyId;
          modified = true;
        }
        if (modified) {
          await anySession.save();
          logger.info(`[GTC45Workspace GET] Adopted and populated user/companyId for legacy session ${conversationId}`);
        }
        session = anySession;
      }
    }

    // Fallback: si es una conversación real y no encontramos sesión, buscamos la temporal de la misma empresa
    if (!session && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const tempId = `temp-${userId}`;
      const tempSession = await GTC45WorkspaceSession.findOne({
        conversationId: tempId,
        user: userId,
        ...(companyId ? { companyId } : { $or: [{ companyId: null }, { companyId: { $exists: false } }] }),
      });
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

    let matrixRows = session.matrixRows || [];
    let updatedInDb = false;
    matrixRows = matrixRows.map((r) => {
      if (r.factores_reduccion && r.factores_reduccion.startsWith('Aporte participativo de') && !r.origen_reporte) {
        updatedInDb = true;
        return {
          ...r,
          origen_reporte: r.factores_reduccion,
          factores_reduccion: 'Técnicamente viable y altamente costo-efectiva según Anexo E de la GTC-45. La implementación de medidas en fuente/medio reduce el nivel de deficiencia y la probabilidad del riesgo.',
        };
      }
      return r;
    });
    if (updatedInDb) {
      session.matrixRows = matrixRows;
      session.save().catch((err) => logger.warn('[GTC45Workspace GET /matrix] Error saving sanitized rows:', err));
    }

    res.json({ matrixRows, chartConclusions: session.chartConclusions || {} });
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

    const existingSession = await GTC45WorkspaceSession.findOne({ conversationId }).select('companyId').lean();
    const effectiveCompanyId = existingSession?.companyId || companyId;

    let session = await GTC45WorkspaceSession.findOneAndUpdate(
      { conversationId },
      {
        $set: { matrixRows: normalizedRows, companyId: effectiveCompanyId },
        $setOnInsert: { user: userId },
      },
      { upsert: true, new: true },
    );

    if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const tempId = `temp-${userId}`;
      await GTC45WorkspaceSession.deleteOne({ conversationId: tempId, user: userId });
      logger.info(`[GTC45Workspace PUT] Deleted temporary session for user ${userId} since real session was created.`);
    }

    // Sincronización en paralelo con Somos SST (Matriz Oficial de esa misma empresa)
    const officialConvoId = `official-${effectiveCompanyId || userId}`;
    const isOfficialSource = session.isOfficial || (await GTC45WorkspaceSession.exists({ conversationId: officialConvoId, sourceConversationId: conversationId }));
    if (isOfficialSource && conversationId !== officialConvoId) {
      await GTC45WorkspaceSession.findOneAndUpdate(
        { conversationId: officialConvoId },
        {
          $set: {
            matrixRows: normalizedRows,
            updatedAt: new Date(),
          },
        }
      );
      logger.info(`[GTC45Workspace PUT /:conversationId] Sincronizada en paralelo con la Matriz Oficial de Somos SST ("${officialConvoId}")`);
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
    const { row, workerId, conversationId } = req.body;
    const userId = req.user?.id;

    if (!row) return res.status(400).json({ error: 'Se requiere el objeto row.' });

    const activeCompanyId = await getActiveCompanyId(userId);
    let companyId = activeCompanyId;
    if (conversationId && conversationId !== 'new' && !conversationId.startsWith('official')) {
      const existingSession = await GTC45WorkspaceSession.findOne({ conversationId }).select('companyId').lean();
      if (existingSession?.companyId) {
        companyId = existingSession.companyId;
      }
    }

    // Obtener perfiles de cargo de la empresa para sugerir con prioridad
    let companyCargos = Array.isArray(req.body.availableCargos) ? req.body.availableCargos : [];
    if (companyCargos.length === 0 || (activeCompanyId && companyId && String(activeCompanyId) !== String(companyId))) {
      companyCargos = [];
      const PerfilCargoModel = mongoose.models.PerfilCargoData;
      if (PerfilCargoModel) {
        try {
          const cargoDoc = await PerfilCargoModel.findOne(
            companyId
              ? { user: userId, companyId }
              : { user: userId, $or: [{ companyId: null }, { companyId: { $exists: false } }] }
          ).lean();
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

    let compDoc = null;
    try {
      compDoc = companyId
        ? await CompanyInfo.findOne({ _id: companyId, user: userId }).lean()
        : await CompanyInfo.findOne({ user: userId, isActive: true }).lean() || await CompanyInfo.findOne({ user: userId }).lean();
    } catch (_) {}

    const companyContextStr = compDoc
      ? `═══ DATOS DE LA EMPRESA ═══
EMPRESA: ${compDoc.companyName || 'Empresa Activa'} (NIT: ${compDoc.nit || 'N/A'})
SECTOR: ${compDoc.sector || 'General'} · ACTIVIDAD ECONÓMICA: ${compDoc.economicActivity || 'General'} (CIIU: ${compDoc.ciiu || 'N/A'})
NIVEL DE RIESGO ARL: Clase ${compDoc.riskLevel || 'III'} · TRABAJADORES: ${compDoc.workerCount || 10}
ACTIVIDADES GENERALES: ${compDoc.generalActivities || 'Operaciones generales'}\n`
      : '';

    const prompt = `Eres un experto certificado en Seguridad y Salud en el Trabajo y en la metodología GTC-45:2012 colombiana.
${companyContextStr}${workerContext}
Tienes esta fila de Matriz IPEVR:

═══ DATOS DE LA ACTIVIDAD, PELIGRO Y CONTROLES ACTUALES ═══
PROCESO: ${row.proceso || 'No especificado'}
CARGO ACTUAL: ${cleanCargoActual ? cleanCargoActual : '[VACÍO - REQUIERE ASIGNACIÓN POR IA]'}
ZONA / LUGAR ACTUAL: ${cleanZonaActual ? cleanZonaActual : '[VACÍO - REQUIERE ASIGNACIÓN POR IA]'}
ACTIVIDAD: ${row.actividad || 'No especificada'}
TAREAS: ${row.tareas || 'No especificadas'}
RUTINARIA: ${row.rutinaria || 'Sí'}
PELIGRO DESCRIPCIÓN: ${row.peligro_descripcion || '[VACÍO - PROPONER SEGÚN ACTIVIDAD Y EMPRESA]'}
CLASIFICACIÓN: ${row.peligro_clasificacion || '[VACÍO - PROPONER SEGÚN PELIGRO]'}
EFECTOS POSIBLES: ${row.efectos_posibles || '[VACÍO - PROPONER SEGÚN PELIGRO]'}
CONTROLES EXISTENTES (REGISTRADOS EN LA FILA — CONSERVAR SI YA EXISTEN):
  - Fuente: ${row.controles_fuente || 'Ninguno'}
  - Medio: ${row.controles_medio || 'Ninguno'}
  - Individuo: ${row.controles_individuo || 'Ninguno'}
ND actual: ${row.nd ?? 'No definido'} | NE actual: ${row.ne ?? 'No definido'} | NC actual: ${row.nc ?? 'No definido'}
Nro. Expuestos: ${row.nro_expuestos || '[VACÍO]'}
Peor Consecuencia: ${row.peor_consecuencia || 'No definida'}
Requisito Legal: ${row.requisito_legal || 'No especificado'}
CONTROLES PROPUESTOS ACTUALES EN LA FILA:
  - Eliminación: ${row.medida_eliminacion || 'Ninguno'}
  - Sustitución: ${row.medida_sustitucion || 'Ninguno'}
  - Controles de Ingeniería: ${row.medida_ingenieria || 'Ninguno'}
  - Controles Administrativos: ${row.medida_administrativa || 'Ninguno'}
  - EPP: ${row.medida_eppu || 'Ninguno'}
${companyCargos.length > 0 ? `\n═══ LISTA DE CARGOS DE LA EMPRESA (PRIORIZAR SI APLICAN) ═══\n${companyCargos.join(', ')}\n` : ''}

═══ TUS TAREAS OBLIGATORIAS ═══
1. PROTECCIÓN DE DATOS IMPORTADOS O YA DILIGENCIADOS vs FILA DESDE CERO (PROHIBIDO INVENTAR CONTROLES EXISTENTES):
   - CONTROLES EXISTENTES (controles_fuente, controles_medio, controles_individuo): CONSERVA SIEMPRE el valor actual de la fila ("${row.controles_fuente || 'Ninguno'}", "${row.controles_medio || 'Ninguno'}", "${row.controles_individuo || 'Ninguno'}"). ESTÁ TERMINANTEMENTE PROHIBIDO inventar o suponer controles existentes que no estén ya escritos en la fila o declarados explícitamente en los datos de la empresa; si no existen, deben quedar en "Ninguno".
   - Si PELIGRO DESCRIPCIÓN, CLASIFICACIÓN o NRO. EXPUESTOS ya tienen información en la fila (no están vacíos), DEBES conservarlos exactamente igual sin modificarlos; únicamente si están vacíos complétalos técnicamente teniendo en cuenta los DATOS DE LA EMPRESA y la actividad.
   - EFECTOS POSIBLES (efectos_posibles): SIEMPRE debes editarlos, ampliarlos y mejorarlos clínica y ocupacionalmente acorde al peligro identificado (incluso si ya tenían un texto básico).
2. CARGO Y ZONA / LUGAR:
   - Si CARGO ACTUAL o ZONA / LUGAR ACTUAL ya tienen un valor válido asignado por el usuario, consérvalos exactamente igual.
   - Si están vacíos, dedúcelos priorizando los cargos registrados de la empresa si aplican.
3. EVALUACIÓN Y CALIFICACIÓN DEL RIESGO (ND, NE, NC — TABLAS OFICIALES GTC-45:2012) — CRÍTICO:
   - Evalúa y califica estrictamente con las tablas oficiales de la GTC 45:2012 teniendo MUY EN CUENTA los CONTROLES EXISTENTES actuales, los EFECTOS POSIBLES, el NRO. DE EXPUESTOS y la INFORMACIÓN DE LA EMPRESA, y EXCLUYENDO los Controles Propuestos y el Factor de Reducción:
     * TABLA 2 — Nivel de Deficiencia (ND en [0, 2, 6, 10]):
       - ND = 10 (Muy Alto): Peligro con consecuencias muy significativas/mortales y los controles existentes en fuente y medio son "Ninguno" o su eficacia es nula.
       - ND = 6 (Alto): Peligro con consecuencias significativas y la eficacia del conjunto de controles existentes es baja (ej. sin control en la fuente, solo controles básicos en medio o individuo).
       - ND = 2 (Medio): Peligro con consecuencias de menor importancia, o YA existen controles preventivos en fuente, medio y/o individuo con eficacia moderada.
       - ND = 0 (Bajo): No se detecta consecuencia o la eficacia del conjunto de controles existentes es alta (riesgo controlado).
     * TABLA 3 — Nivel de Exposición (NE en [1, 2, 3, 4]):
       - NE = 4 (Continua: sin interrupción o varias veces con tiempo prolongado en la jornada).
       - NE = 3 (Frecuente: varias veces durante la jornada laboral por tiempos cortos).
       - NE = 2 (Ocasional: alguna vez durante la jornada laboral y por un periodo corto).
       - NE = 1 (Esporádica: de manera eventual o emergencias).
     * TABLA 6 — Nivel de Consecuencia (NC en [10, 25, 60, 100]):
       - NC = 100 (Mortal o Catastrófico: muerte(s), ej. asfixia en espacio confinado, electrocución, caída en alturas, colapso estructural).
       - NC = 60 (Muy Grave: lesiones o enfermedades graves irreparables / incapacidad permanente parcial o invalidez, ej. amputación, hipoacusia neurosensorial, síndrome de Raynaud).
       - NC = 25 (Grave: lesiones o enfermedades con incapacidad laboral temporal, ej. fracturas menores, lumbalgias, quemaduras de 1er/2do grado, dermatitis).
       - NC = 10 (Leve: lesiones que no requieren incapacidad, molestias o fatiga leve).
4. MEDIDAS DE INTERVENCIÓN PROPUESTAS (Eliminación, Sustitución, Ingeniería, Administrativas, EPP) — PROHIBIDO REPETIR O SOLAPAR CONTROLES EXISTENTES:
   - Revisa detenidamente qué dice en CONTROLES EXISTENTES (Fuente: "${row.controles_fuente || 'Ninguno'}", Medio: "${row.controles_medio || 'Ninguno'}", Individuo: "${row.controles_individuo || 'Ninguno'}").
   - Si estás generando Controles Existentes desde cero (porque estaban vacíos), registra ÚNICAMENTE controles preventivos reales que existan hoy o escribe "Ninguno" (NUNCA escribas condiciones inseguras como "herramientas sin amortiguación" o "envases no rotulados" dentro de Controles Existentes).
   - ESTÁ TERMINANTEMENTE PROHIBIDO proponer o recomendar en los Controles Propuestos algo que YA SE USA o YA EXISTE en los Controles Existentes (por ejemplo: si en Controles Existentes ya usan "tapaoídos" o "guantes", NO propongas "usar tapaoídos" ni vuelvas a poner "guantes" a secas en EPP; propón controles para otras barreras/partes del cuerpo no cubiertas, o si el EPP existente es técnicamente inadecuado para ese peligro específico —ej. usan guante de vaqueta de cuero que es mecánico y no atenúa vibraciones—, indica explícitamente: "Sustituir [EPP actual inadecuado] por [EPP certificado específico para el peligro]").
5. FACTORES DE REDUCCIÓN (ANEXO E GTC-45) — CRÍTICO:
   - Ten en cuenta TODA la información de la fila (proceso, cargo, peligro, controles existentes, ND/NE/NC/NR, expuestos, peor consecuencia) y ESPECIALMENTE evalúa y compara los CONTROLES PROPUESTOS (Eliminación, Sustitución, Ingeniería, Administrativos y EPP) de esta fila para dictaminar en base a Costo/Beneficio CUÁL DE ESOS CONTROLES PROPUESTOS LE CONVIENE MÁS A LA EMPRESA.
   - Estructura obligatoria: "Reducción del [X]% (NRi: [NR inicial] → NRf: [NR residual esperado], Nivel [III o IV]). Análisis Costo/Beneficio (GTC 45 Anexo E): [Cita explícitamente los controles propuestos de la fila y dictamina cuál de ellos —priorizando Ingeniería, Sustitución o Eliminación frente a Administrativos y EPP— le conviene más a la empresa en relación costo/beneficio (Factor J > 20), explicando cómo mitiga el peligro en la fuente/medio y por qué es más rentable frente al costo de incapacidades, ausentismo o indemnizaciones por la peor consecuencia]."
6. Si peor_consecuencia y requisito_legal están vacíos o no definidos, propón valores adecuados basados en el peligro; de lo contrario, consérvalos.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con estos campos exactos:
{
  "cargo": "<nombre del cargo deducido o conservado>",
  "zona": "<nombre de la zona deducida o conservada>",
  "peligro_descripcion": "<conservar si ya existe, o proponer si estaba vacío>",
  "peligro_clasificacion": "<conservar si ya existe, o proponer si estaba vacío>",
  "efectos_posibles": "<efectos posibles mejorados y enriquecidos clínicamente según el peligro>",
  "controles_fuente": "<conservar si ya existe, o proponer si estaba vacío>",
  "controles_medio": "<conservar si ya existe, o proponer si estaba vacío>",
  "controles_individuo": "<conservar si ya existe, o proponer si estaba vacío>",
  "nd": <número 0|2|6|10>,
  "ne": <número 1|2|3|4>,
  "nc": <número 10|25|60|100>,
  "nro_expuestos": ${Number(row.nro_expuestos) > 0 ? Number(row.nro_expuestos) : 1},
  "peor_consecuencia": "<peor consecuencia conservada o propuesta si estaba vacía>",
  "requisito_legal": "<'Sí'|'No', conservado o propuesto si estaba vacío>",
  "medida_eliminacion": "<medida propuesta o conservada>",
  "medida_sustitucion": "<medida propuesta o conservada>",
  "medida_ingenieria": "<control de ingeniería propuesto o conservado>",
  "medida_administrativa": "<control administrativo propuesto o conservado>",
  "medida_eppu": "<EPP recomendado específico o conservado>",
  "factores_reduccion": "<Reducción del X% (NRi: ... → NRf: ..., Nivel III/IV). Análisis Costo/Beneficio (GTC 45 Anexo E): Evaluación directa de los controles propuestos de la fila indicando cuál le conviene más a la empresa (J > 20) y por qué>",
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
    const snapVal = (v, allowed, fb) => {
      const n = Number(v);
      if (isNaN(n)) return fb;
      if (allowed.includes(n)) return n;
      return allowed.reduce((prev, curr) => (Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev), fb);
    };
    const nd = snapVal(updatedFields.nd, [0, 2, 6, 10], 2);
    const ne = snapVal(updatedFields.ne, [1, 2, 3, 4], 2);
    updatedFields.nd = nd;
    updatedFields.ne = ne;
    const np = nd * ne;
    updatedFields.np = np;

    let interpretacion_np = 'Bajo (B)';
    if (np >= 24) interpretacion_np = 'Muy Alto (MA)';
    else if (np >= 10) interpretacion_np = 'Alto (A)';
    else if (np >= 6) interpretacion_np = 'Medio (M)';
    updatedFields.interpretacion_np = interpretacion_np;

    const nc = snapVal(updatedFields.nc, [10, 25, 60, 100], 25);
    updatedFields.nc = nc;
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

    // Proteger campos ya diligenciados/importados (solo permitir que la IA los llene si estaban vacíos al crear desde 0)
    // Nota: efectos_posibles siempre se puede editar por la IA para mejorarlo.
    const isNotEmpty = (v) => v !== undefined && v !== null && String(v).trim() !== '' && !['ninguno', 'ninguna', 'no especificado', 'no detallado'].includes(String(v).trim().toLowerCase());
    if (isNotEmpty(row.peligro_descripcion)) updatedFields.peligro_descripcion = row.peligro_descripcion;
    if (isNotEmpty(row.peligro_clasificacion)) updatedFields.peligro_clasificacion = row.peligro_clasificacion;
    updatedFields.efectos_posibles = updatedFields.efectos_posibles || row.efectos_posibles || '';
    updatedFields.controles_fuente = isNotEmpty(row.controles_fuente) ? row.controles_fuente : 'Ninguno';
    updatedFields.controles_medio = isNotEmpty(row.controles_medio) ? row.controles_medio : 'Ninguno';
    updatedFields.controles_individuo = isNotEmpty(row.controles_individuo) ? row.controles_individuo : 'Ninguno';
    if (Number(row.nro_expuestos) > 0) updatedFields.nro_expuestos = Number(row.nro_expuestos);

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
  
  const total = matrixRows.length;
  let countI = 0, countII = 0, countIII = 0, countIV = 0;
  
  // Matriz Térmica 4x4
  const heatmap = {
    '100_MA': 0, '100_A': 0, '100_M': 0, '100_B': 0,
    '60_MA': 0, '60_A': 0, '60_M': 0, '60_B': 0,
    '25_MA': 0, '25_A': 0, '25_M': 0, '25_B': 0,
    '10_MA': 0, '10_A': 0, '10_M': 0, '10_B': 0,
  };

  const empty = (v) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', 'n/a', ''].includes(String(v).toLowerCase().trim());
  let countElim = 0, countSust = 0, countIng = 0, countAdm = 0, countEpp = 0;
  let fuente = 0, medio = 0, individuo = 0;

  matrixRows.forEach(r => {
    const nr = Number(r.nr) || 0;
    if (nr >= 600) countI++;
    else if (nr >= 150) countII++;
    else if (nr >= 40) countIII++;
    else countIV++;

    // Jerarquía
    if (!empty(r.medida_eliminacion)) { countElim++; fuente++; }
    if (!empty(r.medida_sustitucion)) { countSust++; fuente++; }
    if (!empty(r.medida_ingenieria) || !empty(r.controles_medio)) { countIng++; medio++; }
    if (!empty(r.medida_administrativa)) countAdm++;
    if (!empty(r.medida_eppu) || !empty(r.controles_individuo)) { countEpp++; individuo++; }

    // Mapeo Térmico
    const ncVal = Number(r.nc) || 25;
    const npVal = Number(r.np) || 6;
    let rowKey = '25';
    if (ncVal >= 100) rowKey = '100';
    else if (ncVal >= 60) rowKey = '60';
    else if (ncVal >= 25) rowKey = '25';
    else rowKey = '10';

    let colKey = 'M';
    if (npVal >= 24) colKey = 'MA';
    else if (npVal >= 10) colKey = 'A';
    else if (npVal >= 6) colKey = 'M';
    else colKey = 'B';

    heatmap[`${rowKey}_${colKey}`] = (heatmap[`${rowKey}_${colKey}`] || 0) + 1;
  });

  const pctI = Math.round((countI / total) * 100);
  const pctII = Math.round((countII / total) * 100);
  const pctIII = Math.round((countIII / total) * 100);
  const pctIV = Math.round((countIV / total) * 100);

  const pctFuente = Math.round((fuente / total) * 100);
  const pctMedio = Math.round((medio / total) * 100);
  const pctIndividuo = Math.round((individuo / total) * 100);

  // Clasificaciones y Procesos
  const mapA = {};
  matrixRows.forEach(r => {
    const k = (r.peligro_clasificacion || 'General').trim();
    if (!mapA[k]) mapA[k] = { count: 0, totalNR: 0 };
    mapA[k].count++;
    mapA[k].totalNR += Number(r.nr) || 0;
  });
  const chartA = Object.entries(mapA).map(([clas, d]) => ({ clas, count: d.count, avg: Math.round(d.totalNR / d.count) })).sort((a,b) => b.avg - a.avg).slice(0, 6);
  const maxA = Math.max(...chartA.map(d => d.avg), 1);

  function renderBar(label, value, max, color, suffix = '') {
    const pct = Math.max(8, Math.min(100, Math.round((value / max) * 100)));
    const emptyPct = Math.max(0, 100 - pct);
    return `
      <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; margin-bottom:6px; border:none;">
        <tr>
          <td width="38%" style="width:38%; font-size:10.5px; color:#475569; font-weight:700; text-align:right; padding:2px 10px 2px 0; border:none; vertical-align:middle;" title="${label}">${label}</td>
          <td width="62%" style="width:62%; padding:2px 0; border:none; vertical-align:middle;">
            <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border-radius:8px; overflow:hidden; border:none;">
              <tr>
                <td width="${pct}%" bgcolor="${color}" style="width:${pct}%; background-color:${color}; height:18px; text-align:right; padding:0 6px; color:#ffffff; font-size:9.5px; font-weight:bold; border:none; vertical-align:middle;">${value}${suffix}</td>
                ${emptyPct > 0 ? `<td width="${emptyPct}%" bgcolor="#f1f5f9" style="width:${emptyPct}%; background-color:#f1f5f9; height:18px; border:none; font-size:1px;">&nbsp;</td>` : ''}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <div style="margin: 24px 0; border: 1px solid #ccfbf1; border-radius: 14px; padding: 22px; background-color: #ffffff; page-break-inside: avoid; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      
      <!-- 1. RESUMEN EJECUTIVO 360° -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0f766e; padding-bottom:10px; margin-bottom:18px;">
        <h3 style="color:#0f766e; font-size:15px; margin:0; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">
          TABLERO EJECUTIVO 360° — DIAGNÓSTICO IPEVR GTC 45:2012
        </h3>
        <span style="background-color:#0f766e; color:#fff; font-size:10px; font-weight:800; padding:4px 12px; border-radius:12px; text-transform:uppercase;">
          Auditoría SG-SST
        </span>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:22px;">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; text-align:center;">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase;">Total Peligros</div>
          <div style="font-size:24px; font-weight:900; color:#0f766e; margin-top:2px;">${total}</div>
          <div style="font-size:9px; color:#94a3b8;">100% Identificados</div>
        </div>
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:12px; text-align:center;">
          <div style="font-size:10px; font-weight:700; color:#991b1b; text-transform:uppercase;">Nivel I (Crítico)</div>
          <div style="font-size:24px; font-weight:900; color:#dc2626; margin-top:2px;">${countI}</div>
          <div style="font-size:9px; color:#ef4444; font-weight:bold;">${pctI}% No Aceptable</div>
        </div>
        <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; padding:12px; text-align:center;">
          <div style="font-size:10px; font-weight:700; color:#9a3412; text-transform:uppercase;">Nivel II (Alto)</div>
          <div style="font-size:24px; font-weight:900; color:#ea580c; margin-top:2px;">${countII}</div>
          <div style="font-size:9px; color:#f97316; font-weight:bold;">${pctII}% Control Específico</div>
        </div>
        <div style="background:#fefce8; border:1px solid #fef08a; border-radius:10px; padding:12px; text-align:center;">
          <div style="font-size:10px; font-weight:700; color:#854d0e; text-transform:uppercase;">Nivel III (Medio)</div>
          <div style="font-size:24px; font-weight:900; color:#ca8a04; margin-top:2px;">${countIII}</div>
          <div style="font-size:9px; color:#eab308; font-weight:bold;">${pctIII}% Mejorable</div>
        </div>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:12px; text-align:center;">
          <div style="font-size:10px; font-weight:700; color:#166534; text-transform:uppercase;">Nivel IV (Bajo)</div>
          <div style="font-size:24px; font-weight:900; color:#16a34a; margin-top:2px;">${countIV}</div>
          <div style="font-size:9px; color:#22c55e; font-weight:bold;">${pctIV}% Aceptable</div>
        </div>
      </div>

      <!-- 2. MATRIZ TÉRMICA 4X4 Y SEVERIDAD -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:18px; margin-bottom:22px;">
        
        <!-- Matriz Térmica -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px;">
          <h4 style="margin:0 0 10px 0; color:#0f766e; font-size:12px; text-transform:uppercase; font-weight:800;">
            🔥 Matriz Térmica GTC 45 (Probabilidad NP × Consecuencia NC)
          </h4>
          <table style="width:100%; border-collapse:collapse; text-align:center; font-size:9px;">
            <thead>
              <tr style="background:#e2e8f0; color:#334155;">
                <th style="padding:4px; border:1px solid #cbd5e1;">NC</th>
                <th style="padding:4px; border:1px solid #cbd5e1;">MA (40-24)</th>
                <th style="padding:4px; border:1px solid #cbd5e1;">A (20-10)</th>
                <th style="padding:4px; border:1px solid #cbd5e1;">M (8-6)</th>
                <th style="padding:4px; border:1px solid #cbd5e1;">B (4-2)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:4px; border:1px solid #cbd5e1; font-weight:bold; background:#fff;">100</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fca5a5; font-weight:bold; color:#7f1d1d;">I [${heatmap['100_MA']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fca5a5; font-weight:bold; color:#7f1d1d;">I [${heatmap['100_A']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fca5a5; font-weight:bold; color:#7f1d1d;">I [${heatmap['100_M']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fed7aa; font-weight:bold; color:#7c2d12;">II [${heatmap['100_B']}]</td>
              </tr>
              <tr>
                <td style="padding:4px; border:1px solid #cbd5e1; font-weight:bold; background:#fff;">60</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fca5a5; font-weight:bold; color:#7f1d1d;">I [${heatmap['60_MA']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fca5a5; font-weight:bold; color:#7f1d1d;">I [${heatmap['60_A']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fed7aa; font-weight:bold; color:#7c2d12;">II [${heatmap['60_M']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fed7aa; font-weight:bold; color:#7c2d12;">II [${heatmap['60_B']}]</td>
              </tr>
              <tr>
                <td style="padding:4px; border:1px solid #cbd5e1; font-weight:bold; background:#fff;">25</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fca5a5; font-weight:bold; color:#7f1d1d;">I [${heatmap['25_MA']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fed7aa; font-weight:bold; color:#7c2d12;">II [${heatmap['25_A']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fed7aa; font-weight:bold; color:#7c2d12;">II [${heatmap['25_M']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fef08a; font-weight:bold; color:#713f12;">III [${heatmap['25_B']}]</td>
              </tr>
              <tr>
                <td style="padding:4px; border:1px solid #cbd5e1; font-weight:bold; background:#fff;">10</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fed7aa; font-weight:bold; color:#7c2d12;">II [${heatmap['10_MA']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fef08a; font-weight:bold; color:#713f12;">III [${heatmap['10_A']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#fef08a; font-weight:bold; color:#713f12;">III [${heatmap['10_M']}]</td>
                <td style="padding:4px; border:1px solid #cbd5e1; background:#bbf7d0; font-weight:bold; color:#14532d;">IV [${heatmap['10_B']}]</td>
              </tr>
            </tbody>
          </table>
          <div style="font-size:8.5px; color:#64748b; margin-top:4px; text-align:center;">
            [n] = Cantidad de riesgos en cuadrante térmico.
          </div>
        </div>

        <!-- Perfil por Clasificación -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px;">
          <h4 style="margin:0 0 10px 0; color:#0f766e; font-size:12px; text-transform:uppercase; font-weight:800;">
            📊 Nivel de Riesgo Promedio (NR) por Tipo de Peligro
          </h4>
          ${chartA.map(d => renderBar(d.clas, d.avg, maxA, getHexNRColor(d.avg))).join('')}
        </div>

      </div>

      <!-- 3. METODOLOGÍA GTC 45 ANEXO E (FACTOR DE REDUCCIÓN Y JUSTIFICACIÓN COSTO/BENEFICIO) -->
      <div style="background-color:#f0fdfa; background:#f0fdfa; border:1px solid #99f6e4; border-radius:10px; padding:16px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4 style="margin:0; color:#0f766e; font-size:12.5px; text-transform:uppercase; font-weight:800;">
            🔬 Factores de Reducción y Justificación Costo/Beneficio (GTC 45 Anexo E)
          </h4>
          <span style="font-size:10px; font-weight:bold; color:#0f766e; background-color:#ccfbf1; background:#ccfbf1; padding:2px 8px; border-radius:6px;">
            Fórmula Posipedia / GTC 45
          </span>
        </div>
        <p style="font-size:11px; color:#334155; line-height:1.4; margin:0 0 8px 0;">
          Para ampliar y analizar los criterios de selección de las medidas de intervención, se aplica la formulación matemática del <strong>Factor de Reducción (F)</strong> y el <strong>Factor de Justificación Costo/Beneficio (J)</strong> según GTC 45 Anexo E:
        </p>
        <div style="background-color:#ffffff; background:#ffffff; border:1px dashed #0d9488; border-radius:8px; padding:8px 12px; font-family:monospace; font-size:11px; color:#0f766e; text-align:center; font-weight:bold; margin-bottom:10px;">
          F = ((NRi - NRf) / NRi) × 100 &nbsp;&nbsp;|&nbsp;&nbsp; J = (NRi × F) / (d × 10)
        </div>
        <div style="font-size:10px; color:#475569; display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:8px;">
          <div><strong>• Cobertura en la Fuente:</strong> ${pctFuente}% (${fuente}/${total})</div>
          <div><strong>• Cobertura en el Medio:</strong> ${pctMedio}% (${medio}/${total})</div>
          <div><strong>• Cobertura en el Individuo:</strong> ${pctIndividuo}% (${individuo}/${total})</div>
        </div>
      </div>

    </div>
  `;
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function buildBioIndividualChartsHtml(matrixRows, worker) {
  if (!matrixRows || matrixRows.length === 0) return '';

  const DOMINIOS_DEFAULT = [
    'Osteomuscular', 'Cardiovascular', 'Neurológico', 'Psicoemocional',
    'Metabólico', 'Respiratorio', 'Sensorial', 'Inmunológico'
  ];

  const domMap = {};
  DOMINIOS_DEFAULT.forEach(d => {
    domMap[d] = { count: 0, sumEfectivo: 0, sumNS: 0, sumNE: 0, criticos: 0 };
  });

  matrixRows.forEach(r => {
    const k = (r.dominio_bio || r.peligro_clasificacion || 'Osteomuscular').trim();
    if (!domMap[k]) {
      domMap[k] = { count: 0, sumEfectivo: 0, sumNS: 0, sumNE: 0, criticos: 0 };
    }
    const ns = Number(r.nivel_susceptibilidad) || 1;
    const ne = Number(r.nivel_exposicion) || 1;
    const efectivo = Number(r.indice_bio_riesgo_efectivo) || Number(r.nr) || (ns * ne);
    const clas = r.clasificacion_bio || (efectivo >= 20 ? 'Crítico' : efectivo >= 12 ? 'Alto' : efectivo >= 6 ? 'Moderado' : 'Bajo');

    domMap[k].count++;
    domMap[k].sumEfectivo += efectivo;
    domMap[k].sumNS += ns;
    domMap[k].sumNE += ne;
    if (clas === 'Crítico' || clas === 'Alto') domMap[k].criticos++;
  });

  const dominiosEvaluados = Object.entries(domMap)
    .filter(([_, d]) => d.count > 0)
    .map(([dominio, d]) => ({
      dominio,
      count: d.count,
      avgEfectivo: Math.round((d.sumEfectivo / d.count) * 10) / 10,
      avgNS: Math.round((d.sumNS / d.count) * 10) / 10,
      avgNE: Math.round((d.sumNE / d.count) * 10) / 10,
      criticos: d.criticos,
    }))
    .sort((a, b) => b.avgEfectivo - a.avgEfectivo);

  const percepcionPts = worker?.percepcionRiesgoScore || 0;
  const factorRed = Math.min(0.40, percepcionPts / 500);
  const factorPct = Math.round(factorRed * 100);

  const empty = (v) => !v || ['ninguno', 'ninguna', 'none', 'no aplica', ''].includes(String(v).toLowerCase().trim());
  let elim = 0, sust = 0, ing = 0, adm = 0, epp = 0;
  matrixRows.forEach(r => {
    if (!empty(r.medida_eliminacion)) elim++;
    if (!empty(r.medida_sustitucion)) sust++;
    if (!empty(r.medida_ingenieria)) ing++;
    if (!empty(r.medida_administrativa)) adm++;
    if (!empty(r.medida_eppu || r.controles_individuo)) epp++;
  });
  const totalRiesgos = matrixRows.length || 1;
  const jerarquia = [
    { label: '1. Eliminación', val: elim, pct: Math.round((elim / totalRiesgos) * 100), col: '#ef4444' },
    { label: '2. Sustitución', val: sust, pct: Math.round((sust / totalRiesgos) * 100), col: '#f97316' },
    { label: '3. Ingeniería', val: ing, pct: Math.round((ing / totalRiesgos) * 100), col: '#f59e0b' },
    { label: '4. Administrativo / Pausas', val: adm, pct: Math.round((adm / totalRiesgos) * 100), col: '#0ea5e9' },
    { label: '5. EPPU / Protección Bio', val: epp, pct: Math.round((epp / totalRiesgos) * 100), col: '#8b5cf6' },
  ];

  function renderBioBar(label, value, max, color, suffix = '') {
    const pct = Math.max(8, Math.min(100, Math.round((value / max) * 100)));
    const emptyPct = Math.max(0, 100 - pct);
    return `
      <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; margin-bottom:6px; border:none;">
        <tr>
          <td width="38%" style="width:38%; font-size:10.5px; color:#475569; font-weight:700; text-align:right; padding:2px 10px 2px 0; border:none; vertical-align:middle;" title="${label}">${label}</td>
          <td width="62%" style="width:62%; padding:2px 0; border:none; vertical-align:middle;">
            <table width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; border-radius:8px; overflow:hidden; border:none;">
              <tr>
                <td width="${pct}%" bgcolor="${color}" style="width:${pct}%; background-color:${color}; height:18px; text-align:right; padding:0 6px; color:#ffffff; font-size:9.5px; font-weight:bold; border:none; vertical-align:middle;">${value}${suffix}</td>
                ${emptyPct > 0 ? `<td width="${emptyPct}%" bgcolor="#f1f5f9" style="width:${emptyPct}%; background-color:#f1f5f9; height:18px; border:none; font-size:1px;">&nbsp;</td>` : ''}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  function getHexBioColor(val) {
    if (val >= 20) return '#dc2626';
    if (val >= 12) return '#ea580c';
    if (val >= 6) return '#eab308';
    return '#10b981';
  }

  const criticosTotales = dominiosEvaluados.reduce((acc, d) => acc + d.criticos, 0);
  const fitScoreVal = worker?.fitScore !== undefined && worker?.fitScore !== null ? worker.fitScore : 'N/A';
  const fitColor = typeof fitScoreVal === 'number' ? (fitScoreVal >= 80 ? '#10b981' : fitScoreVal >= 60 ? '#f59e0b' : '#ef4444') : '#0f766e';

  return `
    <div style="margin: 25px 0; border: 1px solid #ccfbf1; border-radius: 14px; padding: 22px; background-color: #f0fdfa; page-break-inside: avoid; font-family: sans-serif;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0f766e; padding-bottom:10px; margin-bottom:20px;">
        <h3 style="color:#0f766e; font-size:15px; margin:0; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
          ANALÍTICA BIO-INDIVIDUAL — PERFIL BIOMÉDICO Y FISIOLÓGICO (8 Dominios WAPPY)
        </h3>
        <span style="background-color:#0f766e; color:#fff; font-size:10px; font-weight:700; padding:4px 12px; border-radius:12px; text-transform:uppercase;">
          Centricidad en el Trabajador
        </span>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap:12px; margin-bottom:20px;">
        <div style="background:#fff; border:1px solid #ccfbf1; border-radius:10px; padding:12px; text-align:center; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase;">FIT Score (Compatibilidad)</div>
          <div style="font-size:22px; font-weight:900; color:${fitColor}; margin-top:2px;">
            ${typeof fitScoreVal === 'number' ? fitScoreVal + '%' : fitScoreVal}
          </div>
          <div style="font-size:9px; color:#94a3b8; margin-top:2px;">Reserva Biocéntrica</div>
        </div>

        <div style="background:#fff; border:1px solid #ccfbf1; border-radius:10px; padding:12px; text-align:center; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase;">Percepción del Riesgo</div>
          <div style="font-size:22px; font-weight:900; color:#0f766e; margin-top:2px;">
            ${percepcionPts} <span style="font-size:12px; font-weight:600;">pts</span>
          </div>
          <div style="font-size:9px; color:#0d9488; font-weight:700; margin-top:2px;">
            Amortiguación Activa: -${factorPct}%
          </div>
        </div>

        <div style="background:#fff; border:1px solid #ccfbf1; border-radius:10px; padding:12px; text-align:center; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase;">Peligros Evaluados</div>
          <div style="font-size:22px; font-weight:900; color:#334155; margin-top:2px;">
            ${matrixRows.length}
          </div>
          <div style="font-size:9px; color:#94a3b8; margin-top:2px;">En ${dominiosEvaluados.length} Dominios Bio</div>
        </div>

        <div style="background:#fff; border:1px solid #ccfbf1; border-radius:10px; padding:12px; text-align:center; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <div style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase;">Atención Prioritaria</div>
          <div style="font-size:22px; font-weight:900; color:${criticosTotales > 0 ? '#dc2626' : '#10b981'}; margin-top:2px;">
            ${criticosTotales}
          </div>
          <div style="font-size:9px; color:${criticosTotales > 0 ? '#dc2626' : '#10b981'}; font-weight:700; margin-top:2px;">Riesgos Críticos/Altos</div>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:16px; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
            <h4 style="margin:0; color:#0f766e; font-size:12px; text-transform:uppercase; font-weight:700;">
              1. Índice de Bio-Riesgo Efectivo por Dominio Fisiológico (Escala 1 a 25)
            </h4>
            <span style="font-size:9px; color:#64748b;">(Modulado por Percepción: -${factorPct}%)</span>
          </div>
          ${dominiosEvaluados.map(d => renderBioBar(d.dominio, d.avgEfectivo, 25, getHexBioColor(d.avgEfectivo), ` / 25 (${d.avgEfectivo >= 20 ? 'Crítico' : d.avgEfectivo >= 12 ? 'Alto' : d.avgEfectivo >= 6 ? 'Moderado' : 'Bajo'})`)).join('')}
        </div>

        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:16px; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
            <h4 style="margin:0; color:#0f766e; font-size:12px; text-transform:uppercase; font-weight:700;">
              2. Susceptibilidad Biológica Individual (NS: 1-5) vs Demanda Ocupacional (NE: 1-5)
            </h4>
            <span style="font-size:9px; color:#64748b;">Interacción Clínica Puesto-Persona</span>
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:11px;">
            <thead>
              <tr style="border-bottom:1px solid #cbd5e1; text-align:left; color:#475569;">
                <th style="padding:6px 8px; font-weight:700;">Dominio Bio</th>
                <th style="padding:6px 8px; font-weight:700; text-align:center;">Susceptibilidad (NS)</th>
                <th style="padding:6px 8px; font-weight:700; text-align:center;">Exposición (NE)</th>
                <th style="padding:6px 8px; font-weight:700; text-align:center;">Riesgo Bruto (NS×NE)</th>
                <th style="padding:6px 8px; font-weight:700; text-align:center;">Foco Clínico</th>
              </tr>
            </thead>
            <tbody>
              ${dominiosEvaluados.map(d => {
                const bruto = Math.round(d.avgNS * d.avgNE * 10) / 10;
                const enfoque = d.avgNS > d.avgNE ? 'Fragilidad médica predominante' : d.avgNE > d.avgNS ? 'Sobrecarga de tarea predominante' : 'Carga balanceada';
                return `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:6px 8px; font-weight:600; color:#334155;">${d.dominio}</td>
                    <td style="padding:6px 8px; text-align:center; font-weight:700; color:#ea580c;">${d.avgNS} / 5</td>
                    <td style="padding:6px 8px; text-align:center; font-weight:700; color:#0284c7;">${d.avgNE} / 5</td>
                    <td style="padding:6px 8px; text-align:center; font-weight:800; color:#0f766e;">${bruto}</td>
                    <td style="padding:6px 8px; text-align:center; font-size:10px; color:#64748b;">${enfoque}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:16px; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">
            <h4 style="margin:0; color:#0f766e; font-size:12px; text-transform:uppercase; font-weight:700;">
              3. Jerarquía de Medidas de Preservación Fisiológica Propuestas (Decreto 1072)
            </h4>
            <span style="font-size:9px; color:#64748b;">Cobertura sobre ${totalRiesgos} peligros evaluados</span>
          </div>
          ${jerarquia.map(j => renderBioBar(j.label, j.pct, 100, j.col, '%')).join('')}
        </div>
      </div>
    </div>
  `;
}

function buildBioIndividualReportPrompt({ worker, matrixRows, instruction }) {
  const edad = worker.fechaNacimiento ? calculateAge(worker.fechaNacimiento) : (worker.edad || 'No especificada');
  const antiguedad = worker.fechaIngreso ? new Date(worker.fechaIngreso).toLocaleDateString('es-CO') : 'No especificada';
  const condiciones = worker.condicionesSalud || 'Sin antecedentes clínicos o restricciones registradas en la hoja de vida';
  const fitScore = worker.fitScore !== undefined && worker.fitScore !== null ? `${worker.fitScore}%` : 'No calculado';
  const fitAlerts = Array.isArray(worker.fitAlerts) && worker.fitAlerts.length ? worker.fitAlerts.join(', ') : 'Sin alertas críticas adicionales';
  const percepcionPts = worker.percepcionRiesgoScore || 0;
  const factorRed = Math.min(0.40, percepcionPts / 500);
  const factorPct = Math.round(factorRed * 100);

  const matrixSummary = matrixRows.map((r, i) => {
    const dom = r.dominio_bio || r.peligro_clasificacion || 'Osteomuscular';
    const dim = r.dimension_bio || r.peligro_descripcion || 'Exposición general';
    const cargoPel = r.peligro_cargo || r.actividad || 'Puesto habitual';
    const actExp = r.actividad_expuesta || '';
    const ef = r.efectos_posibles || 'Molestias o fatiga';
    const factorInd = r.factor_individual ? ` | Factor Individual Agravante: ${r.factor_individual}` : '';
    const ns = r.nivel_susceptibilidad || 1;
    const ne = r.nivel_exposicion || 1;
    const bruto = r.indice_bio_riesgo_bruto || (ns * ne);
    const efect = r.indice_bio_riesgo_efectivo || bruto;
    const clas = r.clasificacion_bio || (efect >= 20 ? 'Crítico' : efect >= 12 ? 'Alto' : efect >= 6 ? 'Moderado' : 'Bajo');
    const prio = r.intervencion_prioritaria ? ' [¡INTERVENCIÓN PRIORITARIA!]' : '';
    const ctrlExistentes = `Controles Actuales: [Fuente: ${r.controles_fuente || 'Ninguno'}] [Medio: ${r.controles_medio || 'Ninguno'}] [Individuo: ${r.controles_individuo || 'Ninguno'}]`;
    const ctrlPropuestos = `Medidas Propuestas: [Eliminación: ${r.medida_eliminacion || 'N/A'}] [Sustitución: ${r.medida_sustitucion || 'N/A'}] [Ingeniería: ${r.medida_ingenieria || 'N/A'}] [Admin: ${r.medida_administrativa || 'N/A'}] [EPPU: ${r.medida_eppu || 'N/A'}]`;
    const plan = r.plan_accion_bio ? ` | Plan Bio: ${r.plan_accion_bio}` : '';
    const restr = r.restricciones_laborales ? ` | Restricciones: ${r.restricciones_laborales}` : '';
    const seg = r.seguimiento_medico ? ` | Seguimiento Médico: ${r.seguimiento_medico}` : '';

    return `[Riesgo #${i+1}] Dominio Bio-Fisiológico: ${dom} | Dimensión: ${dim} | Peligro del Cargo: ${cargoPel} | Actividad: ${actExp}
Efectos en Salud: ${ef}${factorInd}
Cálculo Bio-Individual: NS=${ns} (Susceptibilidad) × NE=${ne} (Exposición) = Bruto ${bruto} | Reducción Percepción: -${factorPct}% -> Bio-Riesgo Efectivo=${efect} (${clas})${prio}
${ctrlExistentes}
${ctrlPropuestos}${plan}${restr}${seg}
`;
  }).join('\n---\n');

  return `Eres el Especialista Principal en Medicina del Trabajo, Ergonomía de Sistemas y Director de Epidemiología Ocupacional de WAPPY, coautor de la METODOLOGÍA BIO-INDIVIDUAL WAPPY (CENTRICIDAD EN EL TRABAJADOR).
Has sido encomendado para redactar el DICTAMEN TÉCNICO BIOCÉNTRICO Y PERFIL FISIOLÓGICO integral del colaborador:
- Colaborador: ${worker.nombre}
- Documento: ${worker.documento || 'No registrado'}
- Cargo: ${worker.cargo || 'Operativo'}
- Edad: ${edad} años | Género: ${worker.genero || 'No especificado'}
- Antigüedad: ${antiguedad}
- EPS: ${worker.eps || 'Afiliado'} | ARL: ${worker.arl || 'ARL Vigente'} | AFP: ${worker.afp || 'AFP Registrada'}
- Condición Clínica Previa / Antecedentes Médicos: ${condiciones}
- FIT Score (Índice Biocéntrico Integral): ${fitScore} (Alertas: ${fitAlerts})
- Modulador Dinámico de Percepción del Riesgo: ${percepcionPts} puntos (Aplica -${factorPct}% de reducción sobre el Bio-Riesgo Bruto)

════════════════════════════════════════════════════════════════════════════════════════
MARCO METODOLÓGICO Y VOCABULARIO OBLIGATORIO:
════════════════════════════════════════════════════════════════════════════════════════
ATENCIÓN CRÍTICA: NO ESTÁS REALIZANDO UNA MATRIZ GTC-45 CONVENCIONAL DE PLANTA (HITO 1).
- En la Matriz IPEVR convencional (Hito 1), se auditan centros de trabajo, procesos e instalaciones mediante la fórmula genérica GTC-45:2012 (ND × NE × NC = NR), tratando a la fuerza laboral como un colectivo homogéneo y asumiendo un "trabajador estándar".
- En la METODOLOGÍA BIO-INDIVIDUAL WAPPY (Hito 3 / Este Dictamen), la unidad de análisis es el BIO-INDIVIDUO HUMANO ÚNICO. Se fundamenta en los artículos de Medicina Preventiva y del Trabajo del Decreto 1072 de 2015, evaluando la interacción biológica, biomecánica y clínica entre las condiciones de salud del colaborador y sus tareas laborales.

CONCEPTOS Y FÓRMULAS PROPIAS QUE DEBES EMPLEAR:
1. NS (Nivel de Susceptibilidad Biológica: 1 a 5): Vulnerabilidad intrínseca del trabajador basada en su historial médico, diagnósticos clínicos, biotipo, edad y antecedentes traumáticos o crónicos.
2. NE (Nivel de Exposición Bio-Ocupacional: 1 a 5): Intensidad, frecuencia y exigencia psicofisiológica real impuesta por el puesto de trabajo.
3. Índice Bio-Riesgo Bruto = NS × NE (Escala 1 a 25): Potencial de deterioro biológico sin mediación conductual.
4. Modulador Activo de Percepción del Riesgo: Factor de reducción conductual = min(0.40, Puntos / 500). Se nutre de la participación del trabajador en reportes de actos y condiciones inseguras (WAPPY Bot / WhatsApp), el termómetro psicosocial y autorreporte de síntomas. En este caso, el trabajador posee ${percepcionPts} pts, lo que reduce su riesgo en un ${factorPct}%.
5. Índice Bio-Riesgo Efectivo = Bruto × (1 - Factor Reducción):
   * Crítico (>= 20) | Alto (12 a 19.9) | Moderado (6 a 11.9) | Bajo (< 6).
6. Los 8 Dominios Bio-Fisiológicos WAPPY:
   - 1. Osteomuscular (Biomecánica, columna, miembros superiores/inferiores, manipulación de cargas).
   - 2. Cardiovascular (Hemodinamia, sobrecarga térmica, sedentarismo, esfuerzo físico).
   - 3. Neurológico (Vibración segmentaria/cuerpo entero, ciclos circadianos, fatiga del SNC).
   - 4. Psicoemocional (Estrés, demanda cognitiva, clima psicosocial, termómetro de ánimo).
   - 5. Metabólico (Gasto calórico, hidratación, nutrición ocupacional, turnicidad).
   - 6. Respiratorio (Inhalación de aerosoles, vapores, material particulado, espirometría).
   - 7. Sensorial (Carga visual, ergonomía lumínica, exposición a ruido, fatiga neurosensorial).
   - 8. Inmunológico (Sensibilizantes dérmicos, riesgos biológicos, alérgenos).
7. FIT Score (%): Grado de compatibilidad clínico-ergonómica entre la reserva del individuo y el puesto.

════════════════════════════════════════════════════════════════════════════════════════
ESTRUCTURA DEL DICTAMEN TÉCNICO EXIGIDA (FORMATO HTML LIMPIO, MUY EXTENSO Y PERICIAL):
════════════════════════════════════════════════════════════════════════════════════════
Responde EXCLUSIVAMENTE en HTML limpio sin etiquetas \`\`\`html. Utiliza el diseño visual corporativo:
- Tablas: <table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
- Headers tabla (th): <th style="background-color:#0f766e;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">
- Celdas (td): <td style="padding:10px 14px;border-bottom:1px solid #f0fdfa;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">
- Headers H3: <h3 style="color:#0f766e; margin-top:30px; border-bottom:1px solid #0d9488; padding-bottom:5px;">

CONTENIDO DE LAS 7 SECCIONES OBLIGATORIAS (CADA UNA DEBE SER SUMAMENTE EXTENSA Y FUNDAMENTADA):
1. **Fundamentación Biocéntrica y Diferenciación Metodológica:**
   Argumenta por qué la GTC-45 tradicional es insuficiente para proteger a este individuo particular al ignorar su historia clínica y tratarlo como un agente genérico en un proceso industrial. Explica el marco de la Metodología Bio-Individual WAPPY y su fundamentación en el Decreto 1072/2015 (Medicina Preventiva y del Trabajo, Perfil Sociodemográfico y Morbilidad).
2. **Perfil Clínico-Fisiológico y Nivel de Compatibilidad (FIT Score):**
   Analiza a fondo las características biográficas de ${worker.nombre}, su edad (${edad} años), cargo (${worker.cargo}) y especialmente su condición clínica base (${condiciones}). Interpreta el significado clínico del FIT Score de ${fitScore} y las alertas asociadas (${fitAlerts}).
3. **Evaluación Fisiopatológica de los 8 Dominios Bio-Fisiológicos:**
   Desarrolla una subtrama exhaustiva analizando cada uno de los dominios identificados en la matriz. Explica la correlación entre las actividades expuestas y los órganos blanco, sustentando cómo el Nivel de Susceptibilidad (NS) y el Nivel de Exposición (NE) determinan el riesgo.
4. **Dinámica del Modulador Activo de Percepción del Riesgo:**
   Explica detalladamente cómo el puntaje de percepción de ${percepcionPts} pts reduce matemáticamente el riesgo bruto en un ${factorPct}% (Factor de Reducción = ${factorRed.toFixed(2)}). Destaca el valor del autorreporte preventivo y la participación en WAPPY Bot.
5. **Diagnóstico de Vulnerabilidad Crítica y Órganos Blanco:**
   Identifica los peligros con Bio-Riesgo Efectivo más severo (Crítico o Alto). Presenta una tabla resumen: Dominio Bio, Dimensión / Peligro, Susceptibilidad (NS), Exposición (NE), Bio-Riesgo Bruto, Bio-Riesgo Efectivo, Clasificación y Órgano Blanco Comprometido.
6. **Plan de Preservación Fisiológica, Readaptación y PVE Individual:**
   Prescribe un plan médico-ocupacional concreto y personalizado para ${worker.nombre}:
   - Rediseño ergonómico y adecuaciones biomecánicas del puesto.
   - Pautas de ejercicios compensatorios y pausas activas personalizadas para sus zonas corporales vulnerables.
   - Controles administrativos individuales (dosificación horaria, límites de carga, descansos).
   - Especificaciones técnicas de EPP ergonómico acorde a su antropometría y patología.
   - Programa de Vigilancia Epidemiológica (PVE) Individualizado: periodicidad de exámenes paraclínicos (osteomuscular, audiometría, visiometría, pruebas de estrés o metabólicas) y cronograma de seguimiento médico.
7. **Dictamen Biocéntrico y Conclusión de Aptitud Ocupacional:**
   Veredicto pericial sobre la sostenibilidad laboral del colaborador en el puesto y recomendaciones ejecutivas para la gerencia y el médico especialista.

NO incluyas encabezado principal tipo banner ni bloque de firmas al final (el sistema los inyectará automáticamente).

MATRIZ BIO-INDIVIDUAL DEL COLABORADOR (${matrixRows.length} riesgos evaluados):
${matrixSummary}

INSTRUCCIÓN ESPECÍFICA DE ANÁLISIS:
${instruction || 'Elaborar dictamen pericial biocéntrico de máxima profundidad médica y ocupacional, personalizando cada acápite según los antecedentes clínicos y los 8 dominios evaluados.'}
`;
}

// ─── IA: Analizar toda la matriz (contexto completo) ──────────────────────────
router.post('/ai-analyze-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { matrixRows, instruction, workerId, isBioIndividual, workerData } = req.body;
    const userId = req.user?.id;

    if (!matrixRows || !matrixRows.length) return res.status(400).json({ error: 'La matriz está vacía.' });

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: userId, isActive: true }).lean()
        || await CompanyInfo.findOne({ user: userId }).lean();
    } catch (e) {
      logger.warn('[GTC45] Could not load CompanyInfo', e);
    }

    const currentDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const isBio = !!(workerId || isBioIndividual);

    let reportTitle = 'INFORME EJECUTIVO DE RIESGOS IPEVR - GTC-45';
    let norm = 'GTC-45:2012 / Decreto 1072 de 2015';
    let prompt = '';
    let chartsHTML = '';
    let workerDoc = null;

    if (isBio) {
      if (workerId) {
        try {
          workerDoc = await SgsstWorker.findOne({ _id: workerId, user: userId }).lean();
        } catch (e) {
          logger.warn('[GTC45] Could not load workerDoc', e);
        }
      }
      const combinedWorker = {
        ...(workerDoc || {}),
        ...(workerData || {}),
      };
      const workerName = (combinedWorker.nombre || 'COLABORADOR').toUpperCase();
      reportTitle = `DICTAMEN TÉCNICO BIOCÉNTRICO — ${workerName}`;
      norm = 'Metodología Bio-Individual WAPPY (Centricidad en el Trabajador) · Decreto 1072/2015';

      chartsHTML = buildBioIndividualChartsHtml(matrixRows, combinedWorker);
      prompt = buildBioIndividualReportPrompt({
        worker: combinedWorker,
        matrixRows,
        instruction,
      });
    } else {
      // Flujo institucional IPEVR General GTC-45 (Hito 1)
      chartsHTML = buildIpevarChartsHtml(matrixRows);
      const matrixSummary = matrixRows.map((r, i) => {
        const proc = r.proceso || 'General';
        const cargo = r.cargo || 'General';
        const act = r.actividad || 'Puesto de trabajo';
        const clas = r.peligro_clasificacion || 'General';
        const desc = r.peligro_descripcion || '';
        const nr = r.nr || 0;
        const interp = r.interpretacion_nr || '';
        const ef = r.efectos_posibles || '';
        const anexoE = r.factores_reduccion || '';
        return `[${i+1}] Proceso: ${proc} | Cargo: ${cargo} | Actividad: ${act} | Clasificación: ${clas} | Peligro: ${desc} | Nivel de Riesgo: ${nr} (${interp}) | Efectos: ${ef} | Anexo E (Factor de Reducción): ${anexoE}`;
      }).join('\n');

      prompt = `Eres un auditor senior y consultor estratégico en Seguridad y Salud en el Trabajo bajo la metodología GTC-45:2012 y Decreto 1072 de 2015 en Colombia.
Analiza esta Matriz IPEVR completa y emite un Informe Técnico y Ejecutivo integral MUY EXTENSO, sumamente detallado, pericial y con sustentación analítica de Costo/Beneficio (Anexo E GTC 45).

**INSTRUCCIONES DE FORMATO HTML:**
- Responde EXCLUSIVAMENTE en HTML limpio, listo para inyectarse en el DOM. NO uses \`\`\`html.
- TODAS las tablas deben llevar: <table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
- Headers de tablas (<th>): <th style="background-color:#0f766e;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">
- Celdas (<td>): <td style="padding:10px 14px;border-bottom:1px solid #f0fdfa;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">
- Headers de sección (H3): <h3 style="color:#0f766e; margin-top:30px; border-bottom:1px solid #ccc; padding-bottom:5px;">
- REGLA ESTRICTA DE TABLAS DE CONTROLES: El sistema ya inyecta en la cabecera la sección "4. Matriz Maestra GTC 45:2012 de Evaluación de Riesgos y Controles" donde la columna de controles muestra ÚNICAMENTE el Anexo E ("🔬 Justificación Técnica del Factor de Reducción"). Si incluyes tablas de evaluación de riesgos y controles en tu análisis, en la columna de Controles SOLO debe aparecer la Justificación Técnica del Factor de Reducción (Anexo E GTC-45), sin separar columnas de Medidas de Ingeniería ni Medidas Administrativas / EPP.

**ESTRUCTURA DEL INFORME EXIGIDA (en HTML) - ESTE INFORME DEBE SER EXTREMADAMENTE EXTENSO:**
1. **Introducción y Contexto General:** Un análisis profundo y muy extenso de la situación actual según la matriz. Incluye interpretaciones sobre cultura de seguridad y asunciones metodológicas.
2. **Análisis Individual de Indicadores Visados (Gráficas):** Dedica una subtrama muy extensa y detallada a analizar teóricamente y de cara al negocio cada uno de estos 4 apartados representados en los dashboards:
    - a. Análisis exhaustivo de los Riesgos por Clasificación (Biomécanico, Psicosocial, Físico, etc.) y su impacto promedio (NR).
    - b. Evaluación profunda de la Jerarquía de Controles aplicada (desproporción entre medidas en la Fuente, el Medio y el Individuo).
    - c. Pronóstico sumamente detallado sobre Enfermedades Laborales Potenciales Detectadas y cómo mitigarlas desde ya clínicamente.
    - d. Desglose detallado del Promedio de NR por cada área y Proceso evaluado, buscando responsabilidades orgánicas en las áreas críticas.
3. **Hallazgos Críticos Detallados:** Menciona los riesgos con Mayor NR (Rojos / No Aceptables) y sus consecuencias a nivel de la salud, lo financiero, legal y productivo. Crea una tabla resumen detallada con: Proceso / Cargo, Peligro & Clasificación, NR y Controles (Anexo E: 🔬 Justificación Técnica del Factor de Reducción).
4. **Brechas en Controles Evaluadas:** Un diagnóstico minucioso y extenso que argumente científicamente la debilidad de las medidas de intervención presentes.
5. **Análisis de Factores de Reducción y Justificación Costo/Beneficio (GTC 45 Anexo E):**
   Aplica rigurosamente la fórmula F = ((NRi - NRf)/NRi) * 100 y J = (NRi * F) / (d * 10). Para cada peligro crítico (Nivel I y II), SUSTENTA Y DICTAMINA EXPLÍCITAMENTE CUÁL DE LOS CONTROLES PROPUESTOS LE CONVIENE MÁS A LA EMPRESA técnica y económicamente. Demuestra por qué la inversión en controles de ingeniería o en la fuente tiene un retorno superior (J > 20) frente al costo recurrente y vulnerabilidad del EPP y medidas administrativas.
6. **Plan de Acción Gerencial y Operativo (Anexo E):** Propuesta extensa enfocada en el Factor de Reducción (Tabla de 4 columnas: Proceso / Peligro, 🔬 Justificación Técnica del Factor de Reducción (Anexo E), Factor F%, Plazo de Ejecución) abarcando la mejora continua.
7. **Conclusión y Recomendaciones de Alta Gerencia:** Un texto robusto y extenso sobre la integración de la GTC-45 con sistemas ISO o estándares internacionales de clase mundial.
8. NO incluyas título principal ni encabezado corporativo (el sistema los inyectará antes).
9. NO incluyas bloque de firmas en tu respuesta de HTML (el sistema las inyectará debajo).

Asegurate de que cada uno de los puntos anteriores de la estructura genere párrafos MUY robustos y abundantes (múltiples párrafos grandes por viñeta del esquema de análisis). ¡Debe ser una respuesta en formato HTML extremo en longitud y supremamente elaborada a nivel técnico!

**MATRIZ COMPLETA (${matrixRows.length} riesgos evaluados):**
${matrixSummary}

**INSTRUCCIÓN ESPECÍFICA (opcional):**
${instruction || 'Generar informe ejecutivo de altísimo nivel técnico priorizando muy extensamente cada acápite del análisis de procesos y peligros.'}
`;
    }

    const headerHTML = buildStandardHeader({
      title: reportTitle,
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm,
      responsibleName: req.user?.name,
      cargo: workerDoc?.cargo || req.body?.workerData?.cargo,
    });

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const analysisRaw = result.response.text();
    const htmlBody = analysisRaw.replace(/```html\n ?/g, '').replace(/```\n?/g, '').trim();

    let fullReport = headerHTML + chartsHTML + '<div style="margin-top:20px;">' + htmlBody + '</div>';
    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    logger.info(`[GTC45/ai-analyze-matrix] HTML Analysis generated for user ${userId}, isBio=${isBio}, ${matrixRows.length} rows`);
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

Con base en los siguientes datos del gráfico de "${chartDescriptions[chartType] || chartType}" de una Matriz IPEVR GTC-45:

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
    const companyId = await getActiveCompanyId(userId);
    const existingSession = await GTC45WorkspaceSession.findOne({ conversationId }).select('companyId').lean();
    const effectiveCompanyId = existingSession?.companyId || companyId;
    await GTC45WorkspaceSession.findOneAndUpdate(
      { conversationId },
      {
        $set: { [`chartConclusions.${chartType}`]: conclusion, companyId: effectiveCompanyId },
        $setOnInsert: { user: userId },
      },
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
Tu tarea es mapear y adaptar con máxima fidelidad la información existente de cada fila al formato estándar de Wappy (GTC-45 IPEVR), ASIGNANDO ADEMÁS EL CARGO CORRESPONDIENTE COMPARANDO LA ACTIVIDAD CON LOS PERFILES DE LA EMPRESA.

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
    const activeCompanyId = await getActiveCompanyId(userId);
    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const { matrixRows, conversationId } = req.body;

    if (!matrixRows || !Array.isArray(matrixRows) || matrixRows.length === 0) {
      return res.status(400).json({ error: 'No se enviaron filas de la matriz para procesar.' });
    }

    // Determinar a qué empresa pertenece realmente esta sesión para jamás cruzar perfiles entre empresas
    let companyId = activeCompanyId;
    if (conversationId && conversationId !== 'official' && !conversationId.startsWith('official-') && conversationId !== 'new') {
      const existingSession = await GTC45WorkspaceSession.findOne({ conversationId }).select('companyId').lean();
      if (existingSession?.companyId) {
        companyId = existingSession.companyId;
      }
    }

    // 1. Obtener los perfiles de cargo existentes de la empresa con descripción completa
    const PerfilCargoModel = mongoose.models.PerfilCargoData;
    let availableCargos = [];
    let perfilesDetallados = [];
    if (PerfilCargoModel) {
      try {
        const cargoDoc = await PerfilCargoModel.findOne(
          companyId
            ? { user: userId, companyId }
            : { user: userId, $or: [{ companyId: null }, { companyId: { $exists: false } }] }
        ).lean();
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
    const company = companyId
      ? await CompanyInfo.findOne({ user: userId, _id: companyId }).lean()
      : (await CompanyInfo.findOne({ user: userId, isActive: true }).lean()) ||
        (await CompanyInfo.findOne({ user: userId }).lean());
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

    // 4. Agrupar filas por combinación única de (proceso, actividad, tareas) para evitar truncamiento en matrices de miles de filas
    const uniqueGroupMap = new Map();
    const rowGroupKeys = [];

    matrixRows.forEach((r, idx) => {
      const proc = String(r.proceso || '').trim();
      const act = String(r.actividad || '').trim();
      const tar = String(r.tareas || '').trim();
      const groupKey = `${proc.toLowerCase()}|${act.toLowerCase()}|${tar.toLowerCase()}`;
      rowGroupKeys[idx] = groupKey;

      if (!uniqueGroupMap.has(groupKey)) {
        uniqueGroupMap.set(groupKey, {
          groupIndex: uniqueGroupMap.size,
          proceso: proc,
          zona: String(r.zona || '').trim(),
          actividad: act,
          tareas: tar,
          peligro: String(r.peligro_descripcion || '').trim(),
          clasificacion: String(r.peligro_clasificacion || '').trim(),
          cargoActual: String(r.cargo || '').trim(),
        });
      }
    });

    const uniqueGroups = Array.from(uniqueGroupMap.values()).slice(0, 120);
    const rowsSummary = uniqueGroups.map((g) => ({
      index: g.groupIndex,
      proceso: g.proceso,
      zona: g.zona,
      actividad: g.actividad,
      tareas: g.tareas,
      peligro: g.peligro,
      clasificacion: g.clasificacion,
      cargoActual: g.cargoActual,
    }));

    const prompt = `Eres un Director Senior de Seguridad y Salud en el Trabajo (SG-SST) y Recursos Humanos experto en perfiles de cargo, profesiogramas y matrices de peligros IPEVR (GTC-45:2012).
Tu misión es ASIGNAR con la máxima precisión el CARGO o puesto de trabajo correspondiente a cada actividad/fila de la matriz de riesgos.

CONTEXTO EMPRESARIAL:
${companyContext || 'No especificado'}

CATÁLOGO DE PERFILES DE CARGO REGISTRADOS EN LA EMPRESA (CON SU DESCRIPCIÓN Y ACTIVIDADES):
${perfilesFormatText}

GRUPOS DE ACTIVIDADES A CLASIFICAR (Array JSON):
${JSON.stringify(rowsSummary, null, 2)}

REGLA CLAVE DE ORO (LA ACTIVIDAD DE LA MATRIZ DEBE PARECERSE A LA DESCRIPCIÓN DEL PERFIL):
1. Revisa con sumo cuidado el texto de "actividad" y "tareas" de cada grupo de la matriz.
2. Compara dicha labor contra la "DESCRIPCIÓN Y ACTIVIDADES DEL PERFIL" de cada perfil de cargo de la empresa listado arriba.
3. Si la actividad coincide, se asemeja, se relaciona o describe funciones que forman parte de la descripción de un perfil registrado:
   - ASIGNA EXACTAMENTE EL NOMBRE DE ESE CARGO ("nombreCargo" exacto del catálogo registrado).
4. Si una fila YA tiene un cargo asignado en "cargoActual" que es válido y coherente con la actividad, CONSÉRVALO. Si está vacío o dice "Cargo / Rol...", asígnalo obligatoriamente.
5. Solo si la actividad es ajena a los perfiles registrados, asigna un nombre de cargo profesional, técnico y específico en español acorde a la labor (prohibido usar "Operario General" o "Operario" genérico si la tarea es administrativa, clínica o profesional).

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
      const lastObjEnd = text.lastIndexOf('}');
      if (startIdx !== -1 && lastObjEnd !== -1 && lastObjEnd > startIdx) {
        try {
          assignedList = JSON.parse(text.substring(startIdx, lastObjEnd + 1) + ']');
        } catch (e2) {
          logger.error('[GTC45Workspace /auto-assign-cargos] Repair failed:', e2.message);
        }
      }
    }

    if (!Array.isArray(assignedList)) {
      throw new Error('La respuesta de la IA no tuvo el formato esperado.');
    }

    const assignedGroupMap = new Map();
    const groupByIndex = new Map();
    for (const [gKey, gObj] of uniqueGroupMap.entries()) {
      groupByIndex.set(gObj.groupIndex, gKey);
    }

    assignedList.forEach(item => {
      if (item && item.index !== undefined && item.cargo) {
        const gKey = groupByIndex.get(Number(item.index));
        if (gKey) {
          assignedGroupMap.set(gKey, toSentenceCase(item.cargo));
        }
      }
    });

    const updatedRows = matrixRows.map((row, idx) => {
      const gKey = rowGroupKeys[idx];
      const assignedCargo = gKey ? assignedGroupMap.get(gKey) : undefined;
      const existingCargo = String(row.cargo || '').trim();
      const validExistingCargo =
        existingCargo &&
        !existingCargo.toLowerCase().includes('cargo / rol') &&
        existingCargo.toLowerCase() !== 'cargo'
          ? toSentenceCase(existingCargo)
          : '';
      return {
        ...row,
        cargo: assignedCargo || validExistingCargo || toSentenceCase(row.proceso || 'Colaborador del Proceso'),
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
    // Deduplicar por nombre de cargo para evitar race condition que crea duplicados
    if (typeof ensurePerfilExists === 'function') {
      try {
        // Agrupar filas por nombre de cargo único (case-insensitive)
        const uniqueCargoMap = new Map();
        for (const r of updatedRows) {
          if (r.cargo && r.cargo.trim()) {
            const key = r.cargo.trim().toLowerCase();
            if (!uniqueCargoMap.has(key)) {
              uniqueCargoMap.set(key, r);
            }
          }
        }
        // Procesar secuencialmente para evitar race conditions (un cargo a la vez)
        for (const [, r] of uniqueCargoMap) {
          await ensurePerfilExists(userId, companyId, r.cargo, r);
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

      let rowOrigen = row.origen_reporte;
      let newFactores = row.factores_reduccion || '';
      if (newFactores.startsWith('Aporte participativo de')) {
        if (!rowOrigen) rowOrigen = newFactores;
        newFactores = '';
      }
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
          const nrIni = Number(row.nr) || (Number(row.nd || 6) * Number(row.ne || 3) * Number(row.nc || 25)) || 360;
          const frPct = (controlTipo === 'Eliminación' || controlTipo === 'Sustitución') ? 90 : controlTipo === 'Ingeniería' ? 85 : controlTipo === 'Administrativo' ? 65 : 50;
          const nrFin = Math.max(10, Math.round(nrIni * (1 - frPct / 100)));
          const nivFin = nrFin >= 600 ? 'I' : nrFin >= 150 ? 'II' : nrFin >= 40 ? 'III' : 'IV';

          newFactores = `Reducción del ${frPct}% (NRi: ${nrIni} → NRf: ${nrFin}, Nivel ${nivFin}). Análisis Costo/Beneficio (GTC 45 Anexo E): La medida de ${controlTipo} ("${controlTexto}") le conviene prioritariamente a la empresa al mitigar el peligro (${peligro}) en el origen o medio de forma colectiva y duradera para el cargo de ${cargo} en ${proceso} (J > 20). Frente al costo potencial de ${peorCons} y contingencias legales, esta intervención representa la mayor rentabilidad técnica y financiera comparada con medidas puramente administrativas o de EPP.`;
        }
      }

      return {
        ...row,
        factores_reduccion: newFactores || row.factores_reduccion || 'No aplica',
        origen_reporte: rowOrigen || row.origen_reporte || 'Identificación Técnica SG-SST',
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
${otherControls.length > 0 ? `• Controles Complementarios: ${otherControls.map((c) => `[${c.category}] ${c.text}`).join(' | ')}\n` : ''}• Factores de Reducción (Anexo E): ${anexoE}${row.origen_reporte ? `\n• Origen / Trazabilidad: ${row.origen_reporte}` : ''}`;

          const referenceId = `ipevar-control-${rowId}`;
          const referenceName = `Matriz IPEVR (${row.peligro_clasificacion || 'GTC-45'})`;

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

// ─── IA: Generar Matriz Completa de Riesgos (Mínimo 15 Riesgos GTC-45) ─────────
router.post('/ai-generate-risks', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { modelName } = req.body;

    let loadedCompany = null;
    try {
      loadedCompany = await CompanyInfo.findOne({ user: userId, isActive: true }).lean()
        || await CompanyInfo.findOne({ user: userId }).lean();
    } catch (e) {
      logger.warn('[GTC45/ai-generate-risks] Could not load CompanyInfo:', e.message);
    }

    const companyId = loadedCompany?._id || null;
    let cargosList = [];
    try {
      const PerfilCargoData = mongoose.models.PerfilCargoData || require('~/models/PerfilCargoData');
      const cargoDoc = await PerfilCargoData.findOne({
        user: userId,
        ...(companyId ? { companyId } : {}),
      }).lean();
      if (cargoDoc && Array.isArray(cargoDoc.perfiles)) {
        cargosList = cargoDoc.perfiles.map((p) => p.nombreCargo).filter(Boolean);
      }
    } catch (_) {}

    const compName = loadedCompany?.companyName || 'Empresa Activa SG-SST';
    const compNit = loadedCompany?.nit || 'N/A';
    const compSector = loadedCompany?.sector || 'Industrial y Servicios';
    const compAct = loadedCompany?.economicActivity || 'Operaciones generales';
    const compCiiu = loadedCompany?.ciiu || '4659';
    const compRisk = loadedCompany?.riskLevel || 'III';
    const compWorkers = loadedCompany?.workerCount || 25;
    const compGeneral = loadedCompany?.generalActivities || 'Operaciones productivas, administrativas y logísticas';
    const cargosHint = cargosList.length > 0
      ? `CARGOS REGISTRADOS EN LA EMPRESA: ${cargosList.join(', ')}`
      : 'CARGOS SUGERIDOS: Asignar cargos reales acordes a los procesos de la empresa.';

    const prompt = `Eres un especialista senior en Seguridad y Salud en el Trabajo (GTC 45:2012, Decreto 1072 de 2015 en Colombia).
EMPRESA: ${compName} (NIT: ${compNit})
SECTOR: ${compSector} · ACTIVIDAD ECONÓMICA: ${compAct} (CIIU: ${compCiiu})
NIVEL DE RIESGO ARL: Clase ${compRisk} · TRABAJADORES: ${compWorkers}
DESCRIPCIÓN DE ACTIVIDADES: ${compGeneral}
${cargosHint}

Genera mínimo 15 (entre 15 y 18) riesgos laborales críticos, diversos y representativos que abarquen todos los procesos principales de esta empresa y las 7 clasificaciones de peligros de la metodología GTC 45:2012 (Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de seguridad y Fenómenos naturales).
IMPORTANTE:
- El arreglo "filas" DEBE contener al menos 15 objetos de riesgo completos y distintos.
- CONTROLES EXISTENTES (controles_fuente, controles_medio, controles_individuo) — PROHIBIDO INVENTAR CONTROLES:
  * ESTÁ TERMINANTEMENTE PROHIBIDO inventar, asumir o suponer controles existentes si la información suministrada por la empresa ("DESCRIPCIÓN DE ACTIVIDADES") NO los menciona explícitamente.
  * Si la información de la empresa NO dice explícitamente que ya cuentan con un control específico en la fuente, en el medio o en el individuo para ese peligro, DEBES colocar estrictamente "Ninguno" en controles_fuente, controles_medio y controles_individuo.
  * Todos los controles que recomiendes implementar deben ir exclusivamente en CONTROLES PROPUESTOS (medida_eliminacion, medida_sustitucion, medida_ingenieria, medida_administrativa, medida_eppu).
- PROHIBIDO repetir o solapar en los Controles Propuestos (medida_eliminacion, medida_sustitucion, medida_ingenieria, medida_administrativa, medida_eppu) algo que ya esté escrito en los Controles Existentes (controles_fuente, controles_medio, controles_individuo).
- CALIFICACIÓN EXACTA SEGÚN TABLAS GTC 45:2012 (ND, NE, NC) — Evalúa en función de los Controles Existentes, Efectos Posibles, Nro. de Expuestos y datos de la empresa, SIN tener en cuenta los Controles Propuestos ni el Factor de Reducción:
  * ND (Tabla 2): usa 10 (Muy Alto) cuando el peligro pueda generar consecuencias muy significativas/mortales y los controles existentes sean "Ninguno"; usa 6 (Alto) cuando el peligro pueda dar lugar a consecuencias significativas o la eficacia de los controles existentes sea baja; usa 2 (Medio) cuando el peligro dé lugar a consecuencias poco significativas o de menor importancia (o si la empresa declaró controles existentes de eficacia moderada); usa 0 (Bajo) si está totalmente controlado.
  * NE (Tabla 3): 4 (Continua), 3 (Frecuente), 2 (Ocasional), 1 (Esporádica).
  * NC (Tabla 6): 100 (Mortal/Catastrófico), 60 (Muy Grave: invalidez/incapacidad permanente), 25 (Grave: incapacidad temporal), 10 (Leve).
- En cada fila, el campo "factores_reduccion" (Anexo E GTC-45) DEBE seguir obligatoriamente esta estructura de análisis de Costo/Beneficio evaluando los controles propuestos:
  "Reducción del [X]% (NRi: [NR inicial] → NRf: [NR residual], Nivel [III o IV]). Análisis Costo/Beneficio (GTC 45 Anexo E): [Sustentación técnica y financiera de cuál control propuesto (priorizando Ingeniería, Sustitución o Eliminación sobre administrativos y EPP) le conviene más a la empresa (J > 20) frente al costo de incapacidades, ausentismo o indemnizaciones por la peor consecuencia]."
Devuelve ÚNICAMENTE un JSON válido (sin bloques markdown):
{
  "filas": [
    {
      "proceso": "Operaciones",
      "cargo": "Operario de Planta",
      "zona": "Área Operativa",
      "actividad": "Manipulación de herramientas y maquinaria",
      "tareas": "Corte y ensamblado de piezas",
      "rutinaria": "Sí",
      "peligro_descripcion": "Mecánico (atrapamiento en partes móviles de máquinas)",
      "peligro_clasificacion": "Condiciones de seguridad",
      "efectos_posibles": "Laceraciones severas, fracturas por aplastamiento, atrapamiento mecánico y amputación traumática de falanges",
      "controles_fuente": "Ninguno",
      "controles_medio": "Ninguno",
      "controles_individuo": "Ninguno",
      "nd": 10,
      "ne": 3,
      "nc": 60,
      "nro_expuestos": 6,
      "peor_consecuencia": "Amputación de miembro superior",
      "requisito_legal": "Sí",
      "medida_eliminacion": "No aplica",
      "medida_sustitucion": "No aplica",
      "medida_ingenieria": "Instalación de guardas con enclavamiento electromecánico y paradas de emergencia tipo hongo",
      "medida_administrativa": "Procedimiento de trabajo seguro (PTS) y programa de bloqueo y etiquetado (LOTO)",
      "medida_eppu": "Guantes anticorte certificados EN 388 nivel 5 y gafas de seguridad ANSI Z87.1",
      "factores_reduccion": "Reducción del 93.3% (NRi: 1800 → NRf: 120, Nivel III). Análisis Costo/Beneficio (GTC 45 Anexo E): La instalación de guardas con enclavamiento electromecánico y el programa LOTO (ingeniería en la fuente) le convienen prioritariamente a la empresa sobre depender únicamente de guantes anticorte (J=38.4 > 20), anulando la energía mecánica residual y evitando costos millonarios por amputación o litigios laborales."
    }
  ]
}`;

    const targetModel = modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(targetModel, userId, prompt, { useWebSearch: false });
    const rawText = result.response.text();
    let cleanJson = String(rawText || '').replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const firstBrace = cleanJson.indexOf('{');
    const firstBracket = cleanJson.indexOf('[');
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      cleanJson = cleanJson.slice(firstBrace);
    } else if (firstBracket !== -1) {
      cleanJson = cleanJson.slice(firstBracket);
    }

    let rawFilas = [];
    try {
      const parsed = JSON.parse(cleanJson);
      rawFilas = Array.isArray(parsed?.filas) ? parsed.filas : Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      const filasMatch = cleanJson.match(/"filas"\s*:\s*\[/);
      const startIdx = filasMatch ? filasMatch.index + filasMatch[0].length : (cleanJson.startsWith('[') ? 1 : 0);
      let depth = 0;
      let objStart = -1;
      let inString = false;
      let escape = false;
      for (let i = startIdx; i < cleanJson.length; i++) {
        const ch = cleanJson[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\' && inString) { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') {
          if (depth === 0) objStart = i;
          depth++;
        } else if (ch === '}') {
          depth--;
          if (depth === 0 && objStart !== -1) {
            try {
              const obj = JSON.parse(cleanJson.slice(objStart, i + 1));
              if (obj && typeof obj === 'object' && (obj.peligro_descripcion || obj.proceso || obj.actividad)) {
                rawFilas.push(obj);
              }
            } catch (__) {}
            objStart = -1;
          }
        }
      }
    }

    const formattedRows = rawFilas.map((r, i) => {
      const nd = [0, 2, 6, 10].includes(Number(r.nd)) ? Number(r.nd) : 6;
      const ne = [1, 2, 3, 4].includes(Number(r.ne)) ? Number(r.ne) : 3;
      const nc = [10, 25, 60, 100].includes(Number(r.nc)) ? Number(r.nc) : 25;
      const np = nd * ne;
      const nr = np * nc;
      let interpretacion_np = 'Bajo (B)';
      if (np >= 24) interpretacion_np = 'Muy Alto (MA)';
      else if (np >= 10) interpretacion_np = 'Alto (A)';
      else if (np >= 6) interpretacion_np = 'Medio (M)';

      let interpretacion_nr = 'IV';
      let aceptabilidad = 'Aceptable';
      if (nr >= 600) {
        interpretacion_nr = 'I';
        aceptabilidad = 'No Aceptable';
      } else if (nr >= 150) {
        interpretacion_nr = 'II';
        aceptabilidad = 'No Aceptable o Aceptable con Control Específico';
      } else if (nr >= 40) {
        interpretacion_nr = 'III';
        aceptabilidad = 'Mejorable';
      }

      return {
        id: `ai_gen_${Date.now()}_${i}`,
        proceso: r.proceso || 'Operaciones',
        cargo: r.cargo || 'Operario General',
        zona: r.zona || 'Área Operativa',
        actividad: r.actividad || 'Ejecución de labores operativas',
        tareas: r.tareas || r.actividad || 'Tareas generales del cargo',
        rutinaria: r.rutinaria === 'No' ? 'No' : 'Sí',
        peligro_descripcion: r.peligro_descripcion || '',
        peligro_clasificacion: r.peligro_clasificacion || 'Condiciones de seguridad',
        efectos_posibles: r.efectos_posibles || '',
        controles_fuente: r.controles_fuente || 'Ninguno',
        controles_medio: r.controles_medio || 'Ninguno',
        controles_individuo: r.controles_individuo || 'Ninguno',
        nd,
        ne,
        np,
        interpretacion_np,
        nc,
        nr,
        interpretacion_nr,
        aceptabilidad,
        nro_expuestos: Number(r.nro_expuestos) || 1,
        peor_consecuencia: r.peor_consecuencia || '',
        requisito_legal: r.requisito_legal === 'No' ? 'No' : 'Sí',
        medida_eliminacion: r.medida_eliminacion || 'No aplica',
        medida_sustitucion: r.medida_sustitucion || 'No aplica',
        medida_ingenieria: r.medida_ingenieria || 'No aplica',
        medida_administrativa: r.medida_administrativa || 'Protocolos seguros',
        medida_eppu: r.medida_eppu || 'Dotación estándar',
        factores_reduccion: r.factores_reduccion || 'Técnicamente viable y costo-efectiva según Anexo E de la GTC-45.',
        origen_reporte: 'Generación IA GTC-45',
      };
    });

    return res.json({
      success: true,
      matrixRows: formattedRows,
    });
  } catch (error) {
    logger.error('[GTC45/ai-generate-risks] Error:', error);
    return res.status(500).json({ error: error.message || 'Error generando riesgos con IA' });
  }
});

module.exports = router;


