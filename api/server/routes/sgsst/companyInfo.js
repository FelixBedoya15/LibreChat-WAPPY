const express = require('express');
const router = express.Router();
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CompanyInfo = require('~/models/CompanyInfo');
const { getAllUserMemories, createMemory, setMemory } = require('~/models');
const { Tokenizer } = require('@librechat/api');

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
            formationLevel, licenseNumber, courseStatus, licenseExpiry,
            legalRepSignature, legalRepConsent, sstRespSignature, sstRespConsent,
        } = req.body;

        const info = await CompanyInfo.findOneAndUpdate(
            { user: req.user.id },
            {
                user: req.user.id,
                companyName, nit, legalRepresentative, workerCount,
                arl, economicActivity, riskLevel, ciiu,
                address, city, phone, email,
                generalActivities, sector, responsibleSST,
                formationLevel, licenseNumber, courseStatus, licenseExpiry,
                legalRepSignature, legalRepConsent, sstRespSignature, sstRespConsent,
            },
            { upsert: true, new: true },
        );

        try {
            // Generar contenido para la memoria de IA automatizada
            const memoryContent = `--- DATOS OFICIALES DE LA EMPRESA ACTUAL DEL USUARIO (SG-SST) ---
Razón Social: ${companyName || 'N/A'}
NIT: ${nit || 'N/A'}
Representante Legal: ${legalRepresentative || 'N/A'}
Número de Trabajadores: ${workerCount || 'N/A'}
ARL: ${arl || 'N/A'}
Nivel de Riesgo (ARL): ${riskLevel || 'N/A'}
Actividad Económica: ${economicActivity || 'N/A'}
Código CIIU: ${ciiu || 'N/A'}
Sector: ${sector || 'N/A'}
Dirección: ${address || 'N/A'} (Ciudad: ${city || 'N/A'})
Responsable SG-SST: ${responsibleSST || 'N/A'}
Nivel de Formación SST: ${formationLevel || 'N/A'}
Número de Licencia SST: ${licenseNumber || 'N/A'}
Vigencia de Licencia: ${licenseExpiry || 'N/A'}
Actualización Curso 50/20H: ${courseStatus || 'N/A'}
Descripción General de Actividades: ${generalActivities || 'N/A'}
--------------------------------------------------------------`;
            
            const memoryKey = 'empresa_sgsst';
            const tokenCount = Tokenizer.getTokenCount(memoryContent, 'o200k_base') || 0;
            
            const memories = await getAllUserMemories(req.user.id);
            const existingMemory = memories.find((m) => m.key === memoryKey);

            if (existingMemory) {
                await setMemory({
                    userId: req.user.id,
                    key: memoryKey,
                    value: memoryContent,
                    tokenCount,
                });
            } else {
                await createMemory({
                    userId: req.user.id,
                    key: memoryKey,
                    value: memoryContent,
                    tokenCount,
                });
            }
        } catch (memError) {
            logger.error('[SGSST CompanyInfo] Error syncing automatic memory:', memError);
            // Non-critical, so we don't throw HTTP error just for memory failure
        }

        res.json(info);
    } catch (error) {
        logger.error('[SGSST CompanyInfo] PUT error:', error);
        res.status(500).json({ error: 'Error saving company info' });
    }
});

module.exports = router;
