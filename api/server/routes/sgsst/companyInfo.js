const express = require('express');
const router = express.Router();
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CompanyInfo = require('~/models/CompanyInfo');

/**
 * GET /api/sgsst/company-info
 * Returns the company info for the authenticated user.
 */
router.get('/', requireJwtAuth, async (req, res) => {
    try {
        const info = await CompanyInfo.findOne({ user: req.user.id }).lean();
        res.json(info || {});
    } catch (error) {
        logger.error('[SGSST CompanyInfo] GET error:', error);
        res.status(500).json({ error: 'Error loading company info' });
    }
});

/**
 * PUT /api/sgsst/company-info
 * Creates or updates company info for the authenticated user.
 */
router.put('/', requireJwtAuth, async (req, res) => {
    try {
        const {
            companyName, nit, legalRepresentative, workerCount,
            arl, economicActivity, riskLevel, ciiu,
            address, city, phone, email,
            generalActivities, sector, responsibleSST,
        } = req.body;

        const info = await CompanyInfo.findOneAndUpdate(
            { user: req.user.id },
            {
                user: req.user.id,
                companyName, nit, legalRepresentative, workerCount,
                arl, economicActivity, riskLevel, ciiu,
                address, city, phone, email,
                generalActivities, sector, responsibleSST,
            },
            { upsert: true, new: true },
        );

        res.json(info);
    } catch (error) {
        logger.error('[SGSST CompanyInfo] PUT error:', error);
        res.status(500).json({ error: 'Error saving company info' });
    }
});

module.exports = router;
