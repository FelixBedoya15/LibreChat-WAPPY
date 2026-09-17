const express = require('express');
const mongoose = require('mongoose');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { logger } = require('~/config');
const CompanyInfo = require('../../../models/CompanyInfo');
const AuditoriaData = require('../../../models/AuditoriaData');
const KanbanTask = require('../../../models/KanbanTask');

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

// ─── GET /data — Cargar estado guardado de auditoría ─────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    const doc = await AuditoriaData.findOne({ user: userId, companyId }).lean();
    if (doc) {
      return res.json({
        statusData: doc.statusData || [],
        reviewerInfo: doc.reviewerInfo || {},
        score: doc.score || 0,
        compliancePercentage: doc.compliancePercentage || 0,
        weightedScore: doc.weightedScore || 0,
        weightedPercentage: doc.weightedPercentage || 0,
        summary: doc.summary || {},
        updatedAt: doc.updatedAt,
      });
    }

    res.json({
      statusData: [],
      reviewerInfo: {},
      score: 0,
      compliancePercentage: 0,
      weightedScore: 0,
      weightedPercentage: 0,
      summary: {},
    });
  } catch (error) {
    logger.error('[SGSST Auditoria] Error loading data:', error);
    res.status(500).json({ error: 'Error al cargar datos de auditoría' });
  }
});

// ─── POST /save — Guardar estado de la auditoría ─────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const {
      statusData,
      reviewerInfo,
      score,
      compliancePercentage,
      weightedScore,
      weightedPercentage,
      summary,
    } = req.body;

    const doc = await AuditoriaData.findOneAndUpdate(
      { user: userId, companyId },
      {
        $set: {
          statusData: statusData || [],
          reviewerInfo: reviewerInfo || {},
          score: typeof score === 'number' ? score : 0,
          compliancePercentage: typeof compliancePercentage === 'number' ? compliancePercentage : 0,
          weightedScore: typeof weightedScore === 'number' ? weightedScore : 0,
          weightedPercentage: typeof weightedPercentage === 'number' ? weightedPercentage : 0,
          summary: summary || {},
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, doc });
  } catch (error) {
    logger.error('[SGSST Auditoria] Error saving data:', error);
    res.status(500).json({ error: 'Error al guardar estado de auditoría' });
  }
});

// ─── POST /sync-kanban — Sincronizar hallazgos con Centro de Control ACPM ─────
router.post('/sync-kanban', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const { statusData, customActions } = req.body;
    const items = Array.isArray(statusData) ? statusData : [];

    const syncedTasks = [];
    const today = new Date();

    // 1. Process standard findings (no_cumple & parcial)
    for (const item of items) {
      if (item.status !== 'no_cumple' && item.status !== 'parcial') {
        // If it was previously a finding but now complies, mark task as done
        const refId = `audit-${item.itemId || item.id}`;
        await KanbanTask.updateMany(
          { user: userId, companyId, referenceId: refId, status: { $ne: 'done' } },
          { status: 'done', completedAt: new Date() }
        );
        continue;
      }

      const isNoCumple = item.status === 'no_cumple';
      const code = item.code || item.itemId || '';
      const name = item.name || 'Requisito Auditoría';
      const referenceId = `audit-${item.itemId || item.id}`;
      const referenceName = `Auditoría SG-SST (${code})`;

      const daysToAdd = isNoCumple ? 30 : 45;
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + daysToAdd);

      const title = `[Auditoría SG-SST] ${code ? code + ' - ' : ''}${name}`;
      const description = isNoCumple
        ? `No Conformidad identificada en Auditoría Interna. Requisito: ${name}. ${item.description || ''}. Criterio: ${item.criteria || 'Dec. 1072 / Res. 0312'}. ${item.observation ? 'Hallazgo específico: ' + item.observation : 'Requiere plan de acción correctivo inmediato.'}`
        : `Oportunidad de Mejora identificada en Auditoría Interna. Requisito: ${name}. ${item.description || ''}. ${item.observation ? 'Observación: ' + item.observation : 'Requiere formulación de plan preventivo.'}`;

      let task = await KanbanTask.findOne({ user: userId, companyId, referenceId });
      if (!task) {
        task = await KanbanTask.create({
          user: userId,
          companyId,
          title,
          description,
          dueDate,
          status: 'todo',
          type: 'audit_finding',
          priority: isNoCumple ? 'alta' : 'media',
          actionType: isNoCumple ? 'correctiva' : 'mejora',
          sourceModule: 'auditoria',
          referenceId,
          referenceName,
        });
      } else {
        if (task.status !== 'done') {
          task.title = title;
          task.description = description;
          task.priority = isNoCumple ? 'alta' : 'media';
          task.actionType = isNoCumple ? 'correctiva' : 'mejora';
          await task.save();
        }
      }
      syncedTasks.push(task);
    }

    // 2. Process custom actions if passed
    if (Array.isArray(customActions)) {
      for (const act of customActions) {
        if (!act.title) continue;
        const refId = act.id ? `audit-custom-${act.id}` : `audit-custom-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const dueDate = act.dueDate ? new Date(act.dueDate) : new Date(Date.now() + 30 * 86400000);

        let task = await KanbanTask.findOne({ user: userId, companyId, referenceId: refId });
        if (!task) {
          task = await KanbanTask.create({
            user: userId,
            companyId,
            title: act.title,
            description: act.description || '',
            dueDate,
            status: act.status || 'todo',
            type: 'audit_finding',
            priority: act.priority || 'media',
            actionType: act.actionType || 'correctiva',
            assignedTo: act.responsible || '',
            sourceModule: 'auditoria',
            referenceId: refId,
            referenceName: 'Plan de Acción Auditoría',
          });
        }
        syncedTasks.push(task);
      }
    }

    res.json({
      success: true,
      syncedCount: syncedTasks.length,
      tasks: syncedTasks,
    });
  } catch (error) {
    logger.error('[SGSST Auditoria] Error syncing to Kanban:', error);
    res.status(500).json({ error: 'Error al sincronizar hallazgos con Centro de Control' });
  }
});

module.exports = router;
