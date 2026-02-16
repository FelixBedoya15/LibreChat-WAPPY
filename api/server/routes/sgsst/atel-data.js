const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');

// ─── Mongoose Schema ─────────────────────────────────────────────────
// We use a flexible schema for MonthData to avoid strict validation issues with dynamic fields
const MonthDataSchema = new mongoose.Schema({
    numTrabajadores: { type: mongoose.Schema.Types.Mixed, default: '' }, // number or empty string
    diasProgramados: { type: mongoose.Schema.Types.Mixed, default: '' },
    events: [{
        id: String,
        fecha: String,
        tipo: String, // 'AT', 'EL', 'Ausentismo'
        causaInmediata: String,
        peligro: String,
        consecuencia: String,
        diasIncapacidad: Number,
        diasCargados: Number,
        parteCuerpo: String,
    }]
}, { _id: false });

const ATELAnnualDataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    months: {
        type: Map,
        of: MonthDataSchema,
        default: {}
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create model (or retrieve if exists to avoid overwrite error in HMR)
const ATELAnnualData = mongoose.models.ATELAnnualData || mongoose.model('ATELAnnualData', ATELAnnualDataSchema);

// ─── Routes ──────────────────────────────────────────────────────────

// GET /api/sgsst/atel-data/:year
router.get('/:year', requireJwtAuth, async (req, res) => {
    try {
        const { year } = req.params;
        const userId = req.user.id;

        const data = await ATELAnnualData.findOne({ user: userId, year: Number(year) });

        if (!data) {
            // Return empty structure if not found
            return res.json({ months: {} });
        }

        res.json(data);
    } catch (error) {
        logger.error('[SGSST ATEL Data] Error fetching data:', error);
        res.status(500).json({ error: 'Error al cargar datos anuales' });
    }
});

// POST /api/sgsst/atel-data/save
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { year, annualData } = req.body;
        const userId = req.user.id;

        if (!year || !annualData) {
            return res.status(400).json({ error: 'Año y datos requeridos' });
        }

        // Upsert
        const result = await ATELAnnualData.findOneAndUpdate(
            { user: userId, year: Number(year) },
            {
                $set: {
                    months: annualData,
                    updatedAt: new Date()
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error('[SGSST ATEL Data] Error saving data:', error);
        res.status(500).json({ error: 'Error al guardar datos anuales' });
    }
});

module.exports = router;
