const express = require('express');
const router = express.Router();
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CompanyInfo = require('~/models/CompanyInfo');
const { getAllUserMemories, createMemory, setMemory, deleteMemory } = require('~/models');
const { Tokenizer } = require('@librechat/api');
const mongoose = require('mongoose');

/**
 * Helper to migrate legacy data (companyId: null) to the user's oldest company.
 * This runs automatically in the background when companies are loaded.
 */
async function migrateLegacyData(userId, firstCompanyId) {
    const models = [
        mongoose.models.PerfilCargoData,
        mongoose.models.PerfilSociodemograficoData,
        mongoose.models.ProgramaCapacitacionesData,
        mongoose.models.MatrizLegalData,
        mongoose.models.ReporteActosData,
        mongoose.models.AnalisisVulnerabilidadData,
        mongoose.models.ParticipacionIpevarData,
        mongoose.models.AnalisisTrabajoSeguroData,
        mongoose.models.MetodoOwasData,
        mongoose.models.PermisoAlturasData,
        mongoose.models.MatrizPeligrosData,
        mongoose.models.AltaDireccionData,
        mongoose.models.ATELAnnualData,
        mongoose.models.InvestigacionAtelData,
        mongoose.models.LiveEditorSession,
        mongoose.models.GTC45WorkspaceSession
    ];
    
    for (const model of models) {
        if (model) {
            try {
                await model.updateMany(
                    { user: userId, $or: [{ companyId: null }, { companyId: { $exists: false } }] },
                    { $set: { companyId: firstCompanyId } }
                );
            } catch (err) {
                // Ignore errors if model is not yet initialized or collection missing
            }
        }
    }
}

/**
 * Syncs the AI automated memory for a given company data.
 */
async function syncCompanyMemory(userId, companyData) {
    try {
        const memoryContent = `Razón Social: ${companyData.companyName || 'N/A'}
NIT: ${companyData.nit || 'N/A'}
Representante Legal: ${companyData.legalRepresentative || 'N/A'}
Número de Trabajadores: ${companyData.workerCount || 'N/A'}
ARL: ${companyData.arl || 'N/A'}
Nivel de Riesgo (ARL): ${companyData.riskLevel || 'N/A'}
Actividad Económica: ${companyData.economicActivity || 'N/A'}
Código CIIU: ${companyData.ciiu || 'N/A'}
Sector: ${companyData.sector || 'N/A'}
Dirección: ${companyData.address || 'N/A'} (Ciudad: ${companyData.city || 'N/A'})
Responsable SG-SST: ${companyData.responsibleSST || 'N/A'}
Nivel de Formación SST: ${companyData.formationLevel || 'N/A'}
Número de Licencia SST: ${companyData.licenseNumber || 'N/A'}
Vigencia de Licencia: ${companyData.licenseExpiry || 'N/A'}
Actualización Curso 50/20H: ${companyData.courseStatus || 'N/A'}
Descripción General de Actividades (Sede Principal): ${companyData.generalActivities || 'N/A'}`;

        let sedesStr = '';
        if (companyData.sedes && Array.isArray(companyData.sedes) && companyData.sedes.length > 0) {
            sedesStr = '\n\nOtras Sedes:\n' + companyData.sedes.map(s => `- Sede: ${s.nombre || 'N/A'}
  Dirección: ${s.address || 'N/A'} (${s.city || 'N/A'})
  Teléfono: ${s.phone || 'N/A'} - Correo: ${s.email || 'N/A'}
  Actividades de Sede: ${s.generalActivities || 'N/A'}`).join('\n');
        }
        
        const memoryContentFinal = memoryContent + sedesStr;
        const memoryKey = 'empresa_sgsst';
        const tokenCount = Tokenizer.getTokenCount(memoryContentFinal, 'o200k_base') || 0;
        
        const memories = await getAllUserMemories(userId);
        const existingMemory = memories.find((m) => m.key === memoryKey);

        if (existingMemory) {
            await setMemory({ userId, key: memoryKey, value: memoryContentFinal, tokenCount });
        } else {
            await createMemory({ userId, key: memoryKey, value: memoryContentFinal, tokenCount });
        }
    } catch (memError) {
        logger.error('[SGSST CompanyInfo] Error syncing automatic memory:', memError);
    }
}

/**
 * GET /api/sgsst/company-info
 * Returns the currently ACTIVE company info. Falls back to first if none active.
 */
router.get('/', requireJwtAuth, async (req, res) => {
    try {
        let info = await CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean();
        if (!info) {
            info = await CompanyInfo.findOne({ user: req.user.id }).lean();
            if (info) {
                // Auto-activate the first one found for legacy support
                await CompanyInfo.updateOne({ _id: info._id }, { isActive: true });
                info.isActive = true;
            }
        }
        
        if (info) {
            // Background migration for backward compatibility
            migrateLegacyData(req.user.id, info._id).catch(e => logger.error('[SGSST] Migration error:', e));
        }
        
        res.json(info || {});
    } catch (error) {
        logger.error('[SGSST CompanyInfo] GET error:', error);
        res.status(500).json({ error: 'Error loading company info' });
    }
});

/**
 * GET /api/sgsst/company-info/all
 * Returns all companies for the authenticated user.
 */
router.get('/all', requireJwtAuth, async (req, res) => {
    try {
        const companies = await CompanyInfo.find({ user: req.user.id }).sort({ createdAt: 1 }).lean();
        
        if (companies && companies.length > 0) {
            // Background migration: assign any null companyId data to the oldest company
            migrateLegacyData(req.user.id, companies[0]._id).catch(e => logger.error('[SGSST] Migration error:', e));
        }

        res.json(companies);
    } catch (error) {
        logger.error('[SGSST CompanyInfo] GET /all error:', error);
        res.status(500).json({ error: 'Error loading all companies' });
    }
});

/**
 * POST /api/sgsst/company-info
 * Creates a new company profile (Max 3).
 */
router.post('/', requireJwtAuth, async (req, res) => {
    try {
        const count = await CompanyInfo.countDocuments({ user: req.user.id });
        if (count >= 3) {
            return res.status(400).json({ error: 'Límite máximo de 3 empresas alcanzado.' });
        }

        // Deactivate others
        await CompanyInfo.updateMany({ user: req.user.id }, { isActive: false });

        const newCompany = new CompanyInfo({
            ...req.body,
            user: req.user.id,
            isActive: true,
        });

        await newCompany.save();
        await syncCompanyMemory(req.user.id, newCompany);

        res.json(newCompany);
    } catch (error) {
        logger.error('[SGSST CompanyInfo] POST error:', error);
        res.status(500).json({ error: 'Error creating company info' });
    }
});

/**
 * PUT /api/sgsst/company-info/:id
 * Updates a specific company info.
 */
router.put('/:id', requireJwtAuth, async (req, res) => {
    try {
        // Enforce user ownership
        const info = await CompanyInfo.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true }
        );

        if (!info) return res.status(404).json({ error: 'Company not found' });

        if (info.isActive) {
            await syncCompanyMemory(req.user.id, info);
        }

        res.json(info);
    } catch (error) {
        logger.error('[SGSST CompanyInfo] PUT /:id error:', error);
        res.status(500).json({ error: 'Error saving company info' });
    }
});

/**
 * PUT /api/sgsst/company-info
 * Legacy fallback for updating the active company (Backwards compatibility).
 */
router.put('/', requireJwtAuth, async (req, res) => {
    try {
        let active = await CompanyInfo.findOne({ user: req.user.id, isActive: true });
        if (!active) active = await CompanyInfo.findOne({ user: req.user.id });

        if (!active) {
            // Forward to POST if none exists
            req.url = '/';
            return router.handle(req, res);
        }

        const info = await CompanyInfo.findOneAndUpdate(
            { _id: active._id },
            req.body,
            { new: true }
        );

        await syncCompanyMemory(req.user.id, info);
        res.json(info);
    } catch (error) {
        logger.error('[SGSST CompanyInfo] PUT (Legacy) error:', error);
        res.status(500).json({ error: 'Error saving company info' });
    }
});

/**
 * PUT /api/sgsst/company-info/:id/activate
 * Switches the active context.
 */
router.put('/:id/activate', requireJwtAuth, async (req, res) => {
    try {
        const target = await CompanyInfo.findOne({ _id: req.params.id, user: req.user.id });
        if (!target) return res.status(404).json({ error: 'Company not found' });

        await CompanyInfo.updateMany({ user: req.user.id }, { isActive: false });
        target.isActive = true;
        await target.save();

        await syncCompanyMemory(req.user.id, target);

        res.json(target);
    } catch (error) {
        logger.error('[SGSST CompanyInfo] PUT activate error:', error);
        res.status(500).json({ error: 'Error activating company' });
    }
});

module.exports = router;
