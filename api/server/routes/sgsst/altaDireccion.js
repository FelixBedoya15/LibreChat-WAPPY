const express = require('express');
const mongoose = require('mongoose');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { logger } = require('~/config');

const router = express.Router();

// ─── Mongoose Schema for Alta Dirección Review  ──────────────────────────────
const AltaDireccionDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Array of { itemId, status ('cumple'|'no_cumple'|'parcial'|'no_aplica'|'pendiente'), observation }
    statusData: { type: Array, default: [] },
    // Reviewer information
    reviewerInfo: {
        nombre: { type: String, default: '' },
        cargo: { type: String, default: '' },
        cedula: { type: String, default: '' },
        fecha: { type: String, default: '' },
    },
    // Public inbox: evaluations received from QR portal (by managers)
    inboxPublico: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now },
});

AltaDireccionDataSchema.index({ user: 1 }, { unique: true });

const AltaDireccionData = mongoose.models.AltaDireccionData
    || mongoose.model('AltaDireccionData', AltaDireccionDataSchema);

// ─── GET /data — Load saved data and inbox ─────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const data = await AltaDireccionData.findOne({ user: userId }).lean();
        if (data) {
            return res.json({
                statusData: data.statusData || [],
                reviewerInfo: data.reviewerInfo || {},
                inboxPublico: data.inboxPublico || [],
            });
        }
        res.json({ statusData: [], reviewerInfo: {}, inboxPublico: [] });
    } catch (error) {
        logger.error('[SGSST AltaDireccion] Load error:', error);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});

// ─── POST /save — Save current form state ────────────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { statusData, reviewerInfo } = req.body;
        const userId = new mongoose.Types.ObjectId(req.user.id);
        await AltaDireccionData.findOneAndUpdate(
            { user: userId },
            { $set: { statusData: statusData || [], reviewerInfo: reviewerInfo || {}, updatedAt: Date.now() } },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        logger.error('[SGSST AltaDireccion] Save error:', error);
        res.status(500).json({ error: 'Error al guardar datos' });
    }
});

// ─── POST /inbox/approve — Approve an inbox item, load its statuses ──────────
router.post('/inbox/approve', requireJwtAuth, async (req, res) => {
    try {
        const { reportId } = req.body;
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const doc = await AltaDireccionData.findOne({ user: userId });
        if (!doc) return res.status(404).json({ error: 'No se encontraron datos' });

        const item = (doc.inboxPublico || []).find(i => String(i.id) === String(reportId));
        if (!item) return res.status(404).json({ error: 'Reporte no encontrado' });

        // Mark the item as 'approved' in the inbox
        doc.inboxPublico = doc.inboxPublico.map(i => {
            if (String(i.id) === String(reportId)) i.status = 'approved';
            return i;
        });

        // Load statuses from the inbox item into the main form
        if (item.data && item.data.statusData) {
            doc.statusData = item.data.statusData;
        }
        // Load reviewer info
        if (item.trabajador) {
            doc.reviewerInfo = {
                nombre: item.trabajador.nombre || '',
                cargo: item.trabajador.cargo || '',
                cedula: item.trabajador.cedula || '',
                fecha: item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-CO') : '',
            };
        }
        doc.markModified('inboxPublico');
        doc.markModified('statusData');
        doc.markModified('reviewerInfo');
        await doc.save();

        res.json({
            success: true,
            statusData: doc.statusData,
            reviewerInfo: doc.reviewerInfo,
            inboxPublico: doc.inboxPublico,
        });
    } catch (error) {
        logger.error('[SGSST AltaDireccion] Inbox approve error:', error);
        res.status(500).json({ error: 'Error al aprobar la evaluación' });
    }
});

// ─── POST /inbox/dismiss — Dismiss an inbox item ───────────────────────────
router.post('/inbox/dismiss', requireJwtAuth, async (req, res) => {
    try {
        const { reportId } = req.body;
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const doc = await AltaDireccionData.findOne({ user: userId });
        if (!doc) return res.status(404).json({ error: 'No se encontraron datos' });
        if (doc.inboxPublico) {
            doc.inboxPublico = doc.inboxPublico.filter(item => String(item.id) !== String(reportId));
            await doc.save();
        }
        res.json({ success: true, inboxPublico: doc?.inboxPublico || [] });
    } catch (error) {
        logger.error('[SGSST AltaDireccion] Inbox dismiss error:', error);
        res.status(500).json({ error: 'Error al descartar la evaluación' });
    }
});

module.exports = router;
module.exports.AltaDireccionData = AltaDireccionData;
