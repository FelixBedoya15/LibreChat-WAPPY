const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { logger } = require('~/config');
const CompanyInfo = require('../../../models/CompanyInfo');
const SgsstWorker = require('../../../models/SgsstWorker');
const mongoose = require('mongoose');

// We need to access PerfilSociodemograficoData. It's currently defined dynamically in its own route file,
// so we'll access it through mongoose.models to avoid duplicating the schema if it's already registered.
const getPerfilSociodemograficoDataModel = () => {
    if (!mongoose.models.PerfilSociodemograficoData) {
        require('./perfilSociodemografico'); // Force register
    }
    return mongoose.models.PerfilSociodemograficoData;
};

const router = express.Router();

// Helper: Obtener Empresa Activa
async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

// GET: Obtener trabajadores por perfil
router.get('/:perfilId', requireJwtAuth, async (req, res) => {
    try {
        const companyId = await getActiveCompanyId(req.user.id);
        const { perfilNombre } = req.query;

        // Auto-sync from Perfil Sociodemografico if a name is provided
        if (perfilNombre) {
            const cleanPerfilNombre = perfilNombre.trim().toLowerCase();
            logger.debug(`[SGSST Workers] Attempting sync for perfilNombre: "${cleanPerfilNombre}"`);
            
            const PerfilSocioModel = getPerfilSociodemograficoDataModel();
            if (PerfilSocioModel) {
                const socioData = await PerfilSocioModel.findOne({ user: req.user.id });
                if (socioData && socioData.trabajadores && socioData.trabajadores.length > 0) {
                    const matchingWorkers = socioData.trabajadores.filter(w => w.cargo && w.cargo.trim().toLowerCase() === cleanPerfilNombre);
                    logger.debug(`[SGSST Workers] Found ${matchingWorkers.length} matching workers in Sociodemografico.`);
                    
                    for (const w of matchingWorkers) {
                        if (!w.identificacion || !w.nombre) continue;
                        
                        const cleanDoc = String(w.identificacion).trim();
                        // Check if it already exists in SgsstWorker by identification and user
                        const existing = await SgsstWorker.findOne({ 
                            user: req.user.id, 
                            documento: cleanDoc
                        });
                        
                        if (!existing) {
                            // Create new SgsstWorker for this bio-individual
                            logger.debug(`[SGSST Workers] Creating new bio-individual for: ${w.nombre}`);
                            const newWorker = new SgsstWorker({
                                user: req.user.id,
                                companyId: companyId || null,
                                perfilId: req.params.perfilId,
                                nombre: w.nombre,
                                documento: cleanDoc,
                                fechaNacimiento: null,
                                genero: w.genero,
                                fechaIngreso: new Date(),
                                condicionesSalud: (w.enfermedades || w.diagnosticoMedico || w.limitacionesBiomecanicas) ? 
                                    [w.enfermedades, w.diagnosticoMedico, w.limitacionesBiomecanicas].filter(Boolean).join('; ') : '',
                                observaciones: 'Importado automáticamente desde Perfil Sociodemográfico',
                                riesgosIpevar: []
                            });
                            await newWorker.save();
                        } else if (!existing.perfilId) {
                            // If they exist but have no profile assigned, update them
                            logger.debug(`[SGSST Workers] Updating existing bio-individual profile for: ${w.nombre}`);
                            existing.perfilId = req.params.perfilId;
                            await existing.save();
                        }
                    }
                } else {
                    logger.debug(`[SGSST Workers] No sociodemographic data or workers found for user.`);
                }
            } else {
                logger.debug(`[SGSST Workers] PerfilSocioModel could not be loaded.`);
            }
        }

        // Fetch all workers for this profile.
        // Use companyId in filter ONLY if one exists (security: prevent cross-company leaks).
        const workerFilter: any = {
            user: req.user.id,
            perfilId: req.params.perfilId
        };
        if (companyId) workerFilter.companyId = companyId;

        const workers = await SgsstWorker.find(workerFilter).sort({ fechaIngreso: -1 });
        
        res.json({ workers });
    } catch (error) {
        logger.error('[SGSST Workers] Load error:', error);
        res.status(500).json({ error: 'Error al cargar trabajadores' });
    }
});

// GET: Obtener un trabajador por ID (Bio-Individuo 360)
router.get('/worker/:id', requireJwtAuth, async (req, res) => {
    try {
        const worker = await SgsstWorker.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!worker) {
            return res.status(404).json({ error: 'Trabajador no encontrado' });
        }
        
        res.json({ worker });
    } catch (error) {
        logger.error('[SGSST Workers] Load one error:', error);
        res.status(500).json({ error: 'Error al cargar el trabajador' });
    }
});

// POST: Crear nuevo trabajador
router.post('/', requireJwtAuth, async (req, res) => {
    try {
        const companyId = await getActiveCompanyId(req.user.id);
        const { perfilId, nombre, documento, fechaNacimiento, genero, fechaIngreso, condicionesSalud, observaciones } = req.body;
        
        const newWorker = new SgsstWorker({
            user: req.user.id,
            companyId,
            perfilId,
            nombre,
            documento,
            fechaNacimiento,
            genero,
            fechaIngreso,
            condicionesSalud,
            observaciones,
            riesgosIpevar: []
        });
        
        await newWorker.save();
        res.json({ success: true, worker: newWorker });
    } catch (error) {
        logger.error('[SGSST Workers] Create error:', error);
        res.status(500).json({ error: 'Error al crear trabajador' });
    }
});

// PUT: Actualizar trabajador
router.put('/:id', requireJwtAuth, async (req, res) => {
    try {
        const { nombre, documento, fechaNacimiento, genero, fechaIngreso, condicionesSalud, observaciones } = req.body;
        
        const worker = await SgsstWorker.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { 
                $set: { 
                    nombre, documento, fechaNacimiento, genero, fechaIngreso, 
                    condicionesSalud, observaciones, updatedAt: Date.now() 
                } 
            },
            { new: true }
        );
        
        if (!worker) {
            return res.status(404).json({ error: 'Trabajador no encontrado' });
        }
        
        res.json({ success: true, worker });
    } catch (error) {
        logger.error('[SGSST Workers] Update error:', error);
        res.status(500).json({ error: 'Error al actualizar trabajador' });
    }
});

// DELETE: Eliminar trabajador
router.delete('/:id', requireJwtAuth, async (req, res) => {
    try {
        const worker = await SgsstWorker.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!worker) {
            return res.status(404).json({ error: 'Trabajador no encontrado' });
        }
        res.json({ success: true });
    } catch (error) {
        logger.error('[SGSST Workers] Delete error:', error);
        res.status(500).json({ error: 'Error al eliminar trabajador' });
    }
});

// PUT: Actualizar matriz IPEVAR del bio-individuo
router.put('/:id/ipevar', requireJwtAuth, async (req, res) => {
    try {
        const { riesgosIpevar } = req.body;
        
        const worker = await SgsstWorker.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: { riesgosIpevar, updatedAt: Date.now() } },
            { new: true }
        );
        
        if (!worker) {
            return res.status(404).json({ error: 'Trabajador no encontrado' });
        }
        
        res.json({ success: true, worker });
    } catch (error) {
        logger.error('[SGSST Workers] Update IPEVAR error:', error);
        res.status(500).json({ error: 'Error al actualizar matriz IPEVAR' });
    }
});

module.exports = router;
