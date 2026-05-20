const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { logger } = require('~/config');
const { generateWithKeyRotation, resolveApiKeys } = require('./sgsstGemini');
const { getUserKey } = require('~/server/services/UserService');
const { AuthKeys } = require('librechat-data-provider');
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

// Migration: Drop old unique index and restore correct companyId based on PerfilSociodemograficoData
async function runIndexAndCompanyMigration() {
    try {
        logger.debug('[SGSST Workers Migration] Checking indexes on SgsstWorker...');
        const collections = await mongoose.connection.db.listCollections({ name: 'sgsstworkers' }).toArray();
        if (collections.length === 0) {
            logger.debug('[SGSST Workers Migration] SgsstWorker collection does not exist yet. Skipping index manipulation.');
            return;
        }

        const indexes = await SgsstWorker.collection.indexes();
        const hasOldIndex = indexes.some(idx => idx.name === 'user_1_documento_1');
        if (hasOldIndex) {
            logger.info('[SGSST Workers Migration] Dropping old index: user_1_documento_1');
            await SgsstWorker.collection.dropIndex('user_1_documento_1');
        }

        // Restore companyId for workers based on PerfilSociodemograficoData mapping (legacy workers without companyId)
        const PerfilSocioModel = getPerfilSociodemograficoDataModel();
        if (PerfilSocioModel) {
            logger.info('[SGSST Workers Migration] Starting companyId restoration...');
            const profiles = await PerfilSocioModel.find({}).lean();
            let restoredCount = 0;
            
            for (const profile of profiles) {
                const { user, companyId, trabajadores } = profile;
                if (!user || !companyId || !trabajadores || trabajadores.length === 0) continue;

                for (const worker of trabajadores) {
                    if (!worker.identificacion) continue;
                    const cleanDoc = String(worker.identificacion).trim();
                    
                    // Only update workers who don't have a companyId set yet
                    const result = await SgsstWorker.updateMany(
                        { 
                            user, 
                            documento: cleanDoc, 
                            $or: [
                                { companyId: null }, 
                                { companyId: { $exists: false } }
                            ] 
                        },
                        { $set: { companyId } }
                    );
                    restoredCount += result.modifiedCount || 0;
                }
            }
            if (restoredCount > 0) {
                logger.info(`[SGSST Workers Migration] Successfully restored companyId for ${restoredCount} workers.`);
            }

            // --- DEDUPLICATION OF SGSSTWORKERS BEFORE REPAIR & CLONING ---
            logger.info('[SGSST Workers Migration] Deduplicating SgsstWorker collection...');
            const allWorkersBefore = await SgsstWorker.find({}).lean();
            const seenBefore = new Set();
            for (const worker of allWorkersBefore) {
                if (!worker.documento || !worker.user || !worker.companyId) continue;
                const key = `${worker.user}_${worker.companyId}_${String(worker.documento).trim()}`;
                if (seenBefore.has(key)) {
                    logger.warn(`[SGSST Workers Repair] Deleting duplicate SgsstWorker record: ${worker.nombre} (${worker.documento}) for company ${worker.companyId}`);
                    await SgsstWorker.deleteOne({ _id: worker._id });
                } else {
                    seenBefore.add(key);
                }
            }

            // --- SELF-HEALING REPAIR & CLONING ---
            logger.info('[SGSST Workers Migration] Running companyId repair and worker cloning verification...');
            const allWorkers = await SgsstWorker.find({}).lean();
            for (const worker of allWorkers) {
                if (!worker.documento || !worker.user) continue;
                const cleanDoc = String(worker.documento).trim();
                
                // Support both String and Number representation of identificacion in PerfilSociodemograficoData
                const isNumeric = /^\d+$/.test(cleanDoc);
                const queryConditions = [
                    { 'trabajadores.identificacion': cleanDoc }
                ];
                if (isNumeric) {
                    queryConditions.push({ 'trabajadores.identificacion': Number(cleanDoc) });
                    queryConditions.push({ 'trabajadores.identificacion': String(Number(cleanDoc)) });
                }
                
                // Find all profiles containing this worker
                const matchingProfiles = await PerfilSocioModel.find({
                    user: worker.user,
                    $or: queryConditions
                }).lean();
                
                if (matchingProfiles.length === 0) continue;
                
                const companyIds = matchingProfiles.map(p => String(p.companyId));
                
                // If worker's current companyId is not in the list of profiles they belong to, fix it
                if (!worker.companyId || !companyIds.includes(String(worker.companyId))) {
                    const firstCompanyId = matchingProfiles[0].companyId;
                    await SgsstWorker.updateOne({ _id: worker._id }, { $set: { companyId: firstCompanyId } });
                    logger.info(`[SGSST Workers Repair] Corrected worker ${worker.nombre} (${cleanDoc}) companyId to ${firstCompanyId}`);
                    worker.companyId = firstCompanyId; // update local ref
                }
                
                // Clone worker if they belong to other companies but don't have a record there
                for (const profile of matchingProfiles) {
                    const pCompanyId = profile.companyId;
                    if (String(pCompanyId) === String(worker.companyId)) continue;
                    
                    const otherExist = await SgsstWorker.findOne({
                        user: worker.user,
                        companyId: pCompanyId,
                        documento: cleanDoc
                    });
                    
                    if (!otherExist) {
                        const clonedWorker = new SgsstWorker({
                            ...worker,
                            _id: new mongoose.Types.ObjectId(),
                            companyId: pCompanyId,
                            riesgosBioIndividual: worker.riesgosBioIndividual || [],
                            fitAlerts: worker.fitAlerts || [],
                            atel: worker.atel || [],
                            actos_inseguros: worker.actos_inseguros || [],
                            participaciones_ipevar: worker.participaciones_ipevar || [],
                            capacitaciones: worker.capacitaciones || [],
                            ats: worker.ats || [],
                        });
                        await clonedWorker.save();
                        logger.info(`[SGSST Workers Repair] Cloned worker ${worker.nombre} (${cleanDoc}) for company ${pCompanyId}`);
                    }
                }
            }
        }

        // Ensure the new index is built
        logger.info('[SGSST Workers Migration] Ensuring new unique index: user_1_companyId_1_documento_1');
        await SgsstWorker.collection.createIndex(
            { user: 1, companyId: 1, documento: 1 },
            { unique: true, sparse: true }
        );
    } catch (e) {
        logger.error('[SGSST Workers Migration] Error during migration:', e);
    }
}

// Execute migration when connection is ready
if (mongoose.connection.readyState === 1) {
    runIndexAndCompanyMigration();
} else {
    mongoose.connection.once('connected', () => {
        runIndexAndCompanyMigration();
    });
}

// Helper: Obtener Empresa Activa
async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

// Helper: Sync a worker with Oráculo H1 data from PerfilSociodemograficoData
async function syncWorkerWithOraculoH1(worker, userId) {
    try {
        const PerfilSocioModel = getPerfilSociodemograficoDataModel();
        if (PerfilSocioModel && worker.companyId) {
            const socioDoc = await PerfilSocioModel.findOne({ user: userId, companyId: worker.companyId });
            if (socioDoc && socioDoc.trabajadores) {
                let liveSocioWorker = socioDoc.trabajadores.find(t => 
                    String(t.identificacion || t.documento || '').trim() === String(worker.documento || '').trim()
                );
                if (liveSocioWorker) {
                    // Self-healing: if score is missing or default (100) but has clinical conditions, force recalculate
                    const hasClinicalText = [
                        liveSocioWorker.limitacionesBiomecanicas, liveSocioWorker.recomendacionesMedicas,
                        liveSocioWorker.diagnosticoMedico, liveSocioWorker.enfermedades,
                        liveSocioWorker.alergiasQuimicas, liveSocioWorker.medicamentos
                    ].some(v => v && String(v).trim().length > 2 && !String(v).toLowerCase().includes('ninguna') && !String(v).toLowerCase().includes('ninguno'));

                    if (liveSocioWorker.biocentricScore === undefined || liveSocioWorker.biocentricScore === null || (liveSocioWorker.biocentricScore === 100 && hasClinicalText)) {
                        const getRecalculateHelper = () => {
                            const router = require('./perfilSociodemografico');
                            return router.recalculateAndSyncAllWorkers;
                        };
                        const recalculateAndSyncAllWorkers = getRecalculateHelper();
                        if (typeof recalculateAndSyncAllWorkers === 'function') {
                            const updatedList = await recalculateAndSyncAllWorkers(userId, worker.companyId, socioDoc.trabajadores);
                            socioDoc.trabajadores = updatedList;
                            socioDoc.updatedAt = Date.now();
                            await socioDoc.save();
                            // Refresh local pointer
                            liveSocioWorker = socioDoc.trabajadores.find(t => 
                                String(t.identificacion || t.documento || '').trim() === String(worker.documento || '').trim()
                            ) || liveSocioWorker;
                        }
                    }

                    let updated = false;

                    const liveScore = liveSocioWorker.biocentricScore !== undefined && liveSocioWorker.biocentricScore !== null 
                        ? liveSocioWorker.biocentricScore 
                        : worker.fitScore;
                    
                    if (worker.fitScore !== liveScore) {
                        worker.fitScore = liveScore;
                        updated = true;
                    }

                    // Compare fitAlerts or assign if different
                    if (JSON.stringify(worker.fitAlerts) !== JSON.stringify(liveSocioWorker.biocentricAlerts || [])) {
                        worker.fitAlerts = liveSocioWorker.biocentricAlerts || [];
                        updated = true;
                    }

                    // Build a highly rich clinical profile from live sociodemographic details
                    const clinicalDetails = [];
                    if (liveSocioWorker.diagnosticoMedico) clinicalDetails.push(`Diagnóstico Médico: ${liveSocioWorker.diagnosticoMedico}`);
                    if (liveSocioWorker.recomendacionesMedicas) clinicalDetails.push(`Recomendaciones Médicas: ${liveSocioWorker.recomendacionesMedicas}`);
                    if (liveSocioWorker.enfermedades) clinicalDetails.push(`Enfermedades/Antecedentes: ${liveSocioWorker.enfermedades}`);
                    if (liveSocioWorker.medicamentos) clinicalDetails.push(`Medicamentos: ${liveSocioWorker.medicamentos}`);
                    if (liveSocioWorker.limitacionesBiomecanicas) clinicalDetails.push(`Limitaciones Biomecánicas: ${liveSocioWorker.limitacionesBiomecanicas}`);
                    if (liveSocioWorker.alergiasQuimicas) clinicalDetails.push(`Alergias Químicas/Físicas: ${liveSocioWorker.alergiasQuimicas}`);
                    if (liveSocioWorker.fuma) clinicalDetails.push(`Fuma: ${liveSocioWorker.fuma}`);
                    if (liveSocioWorker.alcohol) clinicalDetails.push(`Alcohol: ${liveSocioWorker.alcohol}`);
                    
                    const conditionsStr = clinicalDetails.length > 0 ? clinicalDetails.join('; ') : worker.condicionesSalud || '';
                    if (worker.condicionesSalud !== conditionsStr) {
                        worker.condicionesSalud = conditionsStr;
                        updated = true;
                    }

                    // Sync basic profile data if changed
                    if (liveSocioWorker.nombre && worker.nombre !== liveSocioWorker.nombre) {
                        worker.nombre = liveSocioWorker.nombre;
                        updated = true;
                    }
                    if (liveSocioWorker.genero && worker.genero !== liveSocioWorker.genero) {
                        worker.genero = liveSocioWorker.genero;
                        updated = true;
                    }

                    if (updated) {
                        worker.updatedAt = Date.now();
                        await worker.save();
                        logger.debug(`[SGSST Workers] Synced worker ${worker.nombre} (${worker.documento}) with latest Oráculo H1 data.`);
                    }
                }
            }
        }
    } catch (e) {
        logger.error('[SGSST Workers] Error in syncWorkerWithOraculoH1 helper:', e);
    }
    return worker;
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Specific routes MUST come before wildcard /:perfilId to avoid
// Express matching them incorrectly.
// ─────────────────────────────────────────────────────────────────────────────

// GET: Obtener un trabajador por ID (Bio-Individuo 360)
router.get('/worker/:id', requireJwtAuth, async (req, res) => {
    try {
        let worker = await SgsstWorker.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!worker) {
            return res.status(404).json({ error: 'Trabajador no encontrado' });
        }

        // Hot-sync with latest Oráculo H1 data
        worker = await syncWorkerWithOraculoH1(worker, req.user.id);

        res.json({ worker });
    } catch (error) {
        logger.error('[SGSST Workers] Load one error:', error);
        res.status(500).json({ error: 'Error al cargar el trabajador' });
    }
});

// POST: Crear o reutilizar trabajador existente (idempotente)
router.post('/', requireJwtAuth, async (req, res) => {
    try {
        const companyId = await getActiveCompanyId(req.user.id);
        const { perfilId, nombre, documento, fechaNacimiento, genero, fechaIngreso, condicionesSalud, observaciones } = req.body;

        const cleanDoc = String(documento || '').trim();
        if (!cleanDoc || !nombre || !perfilId) {
            return res.status(400).json({ error: 'Faltan campos requeridos: nombre, documento, perfilId' });
        }

        // Find-or-create: buscar por documento del usuario para evitar duplicados
        let worker = await SgsstWorker.findOne({ user: req.user.id, companyId, documento: cleanDoc });

        if (!worker) {
            worker = new SgsstWorker({
                user: req.user.id,
                companyId,
                perfilId,
                nombre,
                documento: cleanDoc,
                fechaNacimiento,
                genero,
                fechaIngreso,
                condicionesSalud,
                observaciones,
                riesgosIpevar: []
            });
            await worker.save();
        } else {
            // Si ya existe en esta empresa, actualizar sus datos
            worker.perfilId = perfilId;
            if (nombre) worker.nombre = nombre;
            if (fechaNacimiento) worker.fechaNacimiento = fechaNacimiento;
            if (genero) worker.genero = genero;
            if (fechaIngreso) worker.fechaIngreso = fechaIngreso;
            if (condicionesSalud !== undefined) worker.condicionesSalud = condicionesSalud;
            if (observaciones !== undefined) worker.observaciones = observaciones;
            await worker.save();
        }

        res.json({ success: true, worker });
    } catch (error) {
        logger.error('[SGSST Workers] Create error:', error);
        res.status(500).json({ error: 'Error al crear trabajador' });
    }
});

// GET: Listar trabajadores por perfil (wildcard — must be AFTER specific routes)
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
                const socioData = await PerfilSocioModel.findOne({ user: req.user.id, companyId });
                if (socioData && socioData.trabajadores && socioData.trabajadores.length > 0) {
                    const matchingWorkers = socioData.trabajadores.filter(w => w.cargo && w.cargo.trim().toLowerCase() === cleanPerfilNombre);
                    logger.debug(`[SGSST Workers] Found ${matchingWorkers.length} matching workers in Sociodemografico.`);
                    
                    for (const w of matchingWorkers) {
                        if (!w.identificacion || !w.nombre) continue;
                        
                        const cleanDoc = String(w.identificacion).trim();
                        // Check if it already exists in SgsstWorker by identification, companyId, and user
                        const existing = await SgsstWorker.findOne({ 
                            user: req.user.id, 
                            companyId,
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
                        } else {
                            // Si existe, asegurar que el perfilId esté asignado
                            if (!existing.perfilId || existing.perfilId !== req.params.perfilId) {
                                existing.perfilId = req.params.perfilId;
                                logger.debug(`[SGSST Workers] Updating existing bio-individual (perfilId) for: ${w.nombre}`);
                                await existing.save();
                            }
                        }
                    }
                } else {
                    logger.debug(`[SGSST Workers] No sociodemographic data or workers found for user.`);
                }
            } else {
                logger.debug(`[SGSST Workers] PerfilSocioModel could not be loaded.`);
            }
        }

        const workers = await SgsstWorker.find({
            user: req.user.id,
            companyId: companyId,
            perfilId: req.params.perfilId
        }).sort({ fechaIngreso: -1 });

        // Hot-sync each worker in the list with the latest Oráculo H1 data
        const syncedWorkers = await Promise.all(
            workers.map(worker => syncWorkerWithOraculoH1(worker, req.user.id))
        );

        res.json({ workers: syncedWorkers });
    } catch (error) {
        logger.error('[SGSST Workers] Load error:', error);
        res.status(500).json({ error: 'Error al cargar trabajadores' });
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

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS BIO-INDIVIDUALES (Nueva metodología independiente)
// ─────────────────────────────────────────────────────────────────────────────

// PUT: Guardar riesgos Bio-Individuales (nueva metodología)
router.put('/:id/bio-ipevar', requireJwtAuth, async (req, res) => {
    try {
        const { riesgosBioIndividual } = req.body;
        const worker = await SgsstWorker.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: { riesgosBioIndividual, updatedAt: Date.now() } },
            { new: true }
        );
        if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });
        res.json({ success: true, worker });
    } catch (error) {
        logger.error('[SGSST Workers] Bio-IPEVAR update error:', error);
        res.status(500).json({ error: 'Error al guardar riesgos bio-individuales' });
    }
});

// POST: Generar riesgos Bio-Individuales con IA
router.post('/worker/:id/generate-bio-risks', requireJwtAuth, async (req, res) => {
    try {
        const { instruccionesExtra, riesgosActuales, modelName } = req.body || {};
        const worker = await SgsstWorker.findOne({ _id: req.params.id, user: req.user.id });
        if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

        // ─── SYNC ORÁCULO H1 DATA FROM PERFIL SOCIODEMOGRAFICO ─────────────────
        await syncWorkerWithOraculoH1(worker, req.user.id);
        const fitScore = worker.fitScore || 0;
        const fitAlerts = worker.fitAlerts || [];
        const condicionesSaludStr = worker.condicionesSalud || '';

        // Fetch cargo profile for context
        let cargoContext = '';
        let cargoNombre = '';
        let perfil = null;
        try {
            const getPerfilCargoDataModel = () => {
                if (!mongoose.models.PerfilCargoData) require('./perfilesCargo');
                return mongoose.models.PerfilCargoData;
            };
            const PerfilCargoData = getPerfilCargoDataModel();
            const cargoDoc = await PerfilCargoData.findOne({ user: req.user.id, companyId: worker.companyId });
            if (cargoDoc && cargoDoc.perfilesList) {
                perfil = cargoDoc.perfilesList.find(p => p.id === worker.perfilId);
                if (perfil) {
                    cargoNombre = perfil.nombreCargo || 'No especificado';
                    cargoContext = `
- Cargo: ${perfil.nombreCargo || 'No especificado'}
- Área: ${perfil.area || ''}
- Exigencia Física: ${perfil.exigenciaFisica || ''}
- Exigencia Mental: ${perfil.exigenciaMental || ''}
- Opera Maquinaria: ${perfil.operaMaquinaria || ''}
- EPP Requerido: ${(perfil.eppSeleccionados || []).join(', ')}
- Contexto adicional del cargo: ${perfil.contextoAdicional || ''}`;
                }
            }
        } catch (e) { /* ignore */ }

        // Gather all actual verified controls from PerfilCargo and MatrizPeligros
        let realControlesFuente = new Set();
        let realControlesMedio = new Set();
        let realControlesIndividuo = new Set();

        if (perfil) {
            if (perfil.eppSeleccionados && Array.isArray(perfil.eppSeleccionados)) {
                perfil.eppSeleccionados.forEach(c => {
                    if (c && c.trim()) realControlesIndividuo.add(c.trim());
                });
            }
            if (perfil.entrenamientosSeleccionados && Array.isArray(perfil.entrenamientosSeleccionados)) {
                perfil.entrenamientosSeleccionados.forEach(c => {
                    if (c && c.trim()) realControlesIndividuo.add(`Capacitación: ${c.trim()}`);
                });
            }
        }

        try {
            const getMatrizPeligrosDataModel = () => {
                if (!mongoose.models.MatrizPeligrosData) require('./matrizPeligros');
                return mongoose.models.MatrizPeligrosData;
            };
            const MatrizPeligrosData = getMatrizPeligrosDataModel();
            const peligrosDoc = await MatrizPeligrosData.findOne({ user: req.user.id, companyId: worker.companyId });
            if (peligrosDoc && peligrosDoc.procesos) {
                peligrosDoc.procesos.forEach(p => {
                    if (p.controlesExistentes && p.controlesExistentes.trim()) {
                        realControlesMedio.add(p.controlesExistentes.trim());
                    }
                    if (p.peligros && Array.isArray(p.peligros)) {
                        p.peligros.forEach(pel => {
                            if (pel.fuenteGeneradora && pel.fuenteGeneradora.trim() && pel.fuenteGeneradora.toLowerCase() !== 'ninguno') {
                                realControlesFuente.add(pel.fuenteGeneradora.trim());
                            }
                            if (pel.medioExistente && pel.medioExistente.trim() && pel.medioExistente.toLowerCase() !== 'ninguno') {
                                realControlesMedio.add(pel.medioExistente.trim());
                            }
                            if (pel.individuoControl && pel.individuoControl.trim() && pel.individuoControl.toLowerCase() !== 'ninguno') {
                                realControlesIndividuo.add(pel.individuoControl.trim());
                            }
                        });
                    }
                });
            }
        } catch (e) {
            logger.error('[SGSST Workers] Error loading real company controls from MatrizPeligros:', e);
        }

        const fuenteListStr = realControlesFuente.size > 0 
            ? Array.from(realControlesFuente).map(c => `- ${c}`).join('\n') 
            : '- No se registran controles específicos en la fuente en la base de datos de la empresa. Utiliza "Ninguno" o "No registrado en Perfil de Cargo"';
        const medioListStr = realControlesMedio.size > 0 
            ? Array.from(realControlesMedio).map(c => `- ${c}`).join('\n') 
            : '- No se registran controles específicos en el medio en la base de datos de la empresa. Utiliza "Ninguno" o "No registrado en Perfil de Cargo"';
        const individuoListStr = realControlesIndividuo.size > 0 
            ? Array.from(realControlesIndividuo).map(c => `- ${c}`).join('\n') 
            : '- No se registran controles específicos en el individuo en la base de datos de la empresa. Utiliza "Ninguno" o "No registrado en Perfil de Cargo"';

        const verdaderosControlesContext = `
=========================================
VERDADEROS CONTROLES EXISTENTES DE LA EMPRESA (Extraídos estrictamente de la base de datos y perfiles de cargo):

CONTROLES EN LA FUENTE:
${fuenteListStr}

CONTROLES EN EL MEDIO:
${medioListStr}

CONTROLES EN EL INDIVIDUO:
${individuoListStr}
=========================================`;

        const percepcionPts = worker.percepcionRiesgoScore || 0;
        const factorReduccion = Math.min(percepcionPts / 500, 0.40);

        const prompt = `Eres un experto en Salud y Seguridad en el Trabajo con enfoque BIO-INDIVIDUAL.
Tu tarea es generar una evaluación de riesgos personalizada bajo la METODOLOGÍA BIO-INDIVIDUAL WAPPY, que evalúa la interacción entre el peligro del cargo y el organismo específico del trabajador.

RIESGOS ACTUALES EN LA MATRIZ:
${riesgosActuales && riesgosActuales.length > 0 ? JSON.stringify(riesgosActuales, null, 2) : 'Ninguno. La matriz está vacía.'}

${riesgosActuales && riesgosActuales.length > 0
    ? (instruccionesExtra 
        ? `\nINSTRUCCIONES DEL USUARIO:\n"${instruccionesExtra}"\nModifica la matriz actual según esta instrucción (puedes agregar nuevos, eliminar o editar los riesgos actuales). Devuelve la matriz COMPLETA actualizada.\n` 
        : `\nINSTRUCCIÓN: La matriz ya tiene riesgos registrados. Tu tarea es analizar el perfil del trabajador y AGREGAR nuevos riesgos relevantes que falten a la lista actual. Devuelve la lista COMPLETA combinando los riesgos actuales (mantén su ID si no los modificas) junto con los nuevos que generes.\n`)
    : (instruccionesExtra
        ? `\nINSTRUCCIÓN: La matriz está vacía. Genera una nueva evaluación de riesgos para el trabajador basada en la siguiente instrucción: "${instruccionesExtra}". Debes generar un análisis exhaustivo con MÍNIMO 8 y MÁXIMO 12 riesgos diferentes que cubran múltiples dominios fisiológicos (Sensorial, Respiratorio, Osteomuscular, Psicoemocional, Inmunológico, Cardiovascular, Metabólico, Neurológico, Seguridad).\n`
        : `\nINSTRUCCIÓN: Como la matriz está vacía (primera carga), es obligatorio identificar de manera exhaustiva MÍNIMO 8 y MÁXIMO 12 riesgos diferentes para el trabajador, cubriendo múltiples dominios fisiológicos (por ejemplo: Sensorial, Osteomuscular, Psicoemocional, Respiratorio, Inmunológico, Seguridad, etc.). No limites el análisis a sólo 2 o 3 riesgos; debes estructurar la matriz de forma completa y robusta.\n`)
}

DATOS DEL TRABAJADOR:
- Nombre: ${worker.nombre}
- Género: ${worker.genero || 'No especificado'}
- Condiciones de Salud / Antecedentes: ${condicionesSaludStr || 'Ninguno registrado'}
- FIT - Índice Biocéntrico Integral: ${fitScore}%
- Puntos Percepción del Riesgo: ${percepcionPts} pts
- Factor de Reducción por Buena Percepción: ${(factorReduccion * 100).toFixed(0)}%
${cargoContext}

${verdaderosControlesContext}

REGLAS DE OBLIGATORIO CUMPLIMIENTO PARA CONTROLES EXISTENTES:
1. Queda ABSOLUTAMENTE PROHIBIDO inventar o alucinar controles existentes.
2. Para los campos "controles_fuente", "controles_medio", y "controles_individuo", debes seleccionar y mapear ÚNICAMENTE los controles que aparezcan en la sección "VERDADEROS CONTROLES EXISTENTES DE LA EMPRESA" que correspondan al peligro analizado.
3. Si para algún peligro o celda no existe un control registrado en dicha lista que aplique, debes colocar exactamente la frase: "No registrado en Perfil de Cargo" o "Ninguno". NUNCA te inventes controles como "Uso de tapabocas" o "Pausas activas" a menos que estén explícitamente en la lista provista.
4. Para el control del individuo, prioriza mapear los EPP Requeridos y Capacitaciones de la lista de controles en el individuo que correspondan al cargo del trabajador.

REGLAS OBLIGATORIAS PARA CONTROLES PROPUESTOS (JERARQUÍA DE CONTROLES):
1. Queda TERMINANTEMENTE PROHIBIDO usar "No aplica" de forma perezosa en los campos de controles propuestos. Para cada riesgo identificado, debes formular medidas de intervención reales y técnicamente viables.
2. "medida_eliminacion" y "medida_sustitucion" deben argumentar técnicamente la viabilidad de eliminar o sustituir la fuente o material peligroso. Si no es viable tras el análisis, explica brevemente por qué.
3. "medida_ingenieria", "medida_administrativa" y "medida_eppu" DEBEN contener propuestas concretas y detalladas con especificaciones técnicas adecuadas (ej. extractores, rediseño de puesto, capacitaciones específicas, tipo de EPP certificado).
4. El campo "factores_reduccion_texto" (Justificación Reducción) es OBLIGATORIO. Debes escribir un párrafo analítico y estructurado de MÍNIMO 3 oraciones completas y técnicas que:
   - Identifique y nombre explícitamente cuál de las 5 medidas de control propuestas (Eliminación, Sustitución, Ingeniería, Administrativa o EPP) representa la mejor alternativa en términos de relación costo-beneficio para la organización y por qué.
   - Detalle una escala priorizada (de mejor a menos efectivo) de los demás controles propuestos, explicando brevemente el nivel de efectividad relativa de cada uno para mitigar el riesgo.
   - Sustente la viabilidad financiera e impacto técnico preventivo (reducción de ausentismo frente a costo de inversión).

METODOLOGÍA BIO-INDIVIDUAL + JERARQUÍA DE CONTROLES:
1. Analiza las Condiciones de Salud y el Cargo.
2. Identifica el peligro original y asígnalo a uno de los DOMINIOS FISIOLÓGICOS (Sensorial, Respiratorio, Osteomuscular, Psicoemocional, Inmunológico, Cardiovascular, Metabólico, Neurológico, Seguridad).
3. Asígnalo a una DIMENSIÓN exacta de la GTC-45. DEBES utilizar EXACTAMENTE una de las opciones válidas para el dominio seleccionado, de la siguiente lista:
   - Sensorial: 'Ruido (impacto, intermitente, continuo)', 'Iluminación (exceso o deficiencia)', 'Radiaciones no ionizantes', 'Radiaciones ionizantes', 'Afectación táctil/olfativa'
   - Respiratorio: 'Polvos orgánicos/inorgánicos', 'Fibras', 'Gases y vapores', 'Humos metálicos/no metálicos', 'Material particulado'
   - Osteomuscular: 'Postura (mantenida, forzada, antigravitacional)', 'Esfuerzo', 'Movimiento repetitivo', 'Manipulación manual de cargas'
   - Psicoemocional: 'Gestión organizacional', 'Características de la organización', 'Características del grupo social', 'Condiciones de la tarea', 'Interfase persona-tarea', 'Jornada de trabajo'
   - Inmunológico: 'Virus', 'Bacterias', 'Hongos', 'Ricketsias', 'Parásitos', 'Picaduras/Mordeduras', 'Fluidos o excrementos'
   - Cardiovascular: 'Temperaturas extremas (calor/frío)', 'Presión atmosférica', 'Exigencia cardiovascular alta', 'Trabajo sedentario prolongado'
   - Metabólico: 'Líquidos (nieblas y rocíos)', 'Alteración nutricional/digestiva', 'Desbalance térmico extremo', 'Sedentarismo metabólico'
   - Neurológico: 'Vibración (cuerpo entero, segmentaria)', 'Fatiga del sistema nervioso', 'Alteración del ciclo circadiano', 'Sobrecarga sensorial'
   - Seguridad: 'Mecánico (máquinas, herramientas)', 'Eléctrico (alta/baja tensión)', 'Locativo (superficies, caídas)', 'Tecnológico (explosión, incendio)', 'Accidentes de tránsito', 'Públicos (robos, asaltos)', 'Trabajo en alturas', 'Espacios confinados', 'Fenómenos naturales (Sismo, etc.)'
4. Determina el Origen ('Condición Insegura', 'Acto Inseguro', o 'Inherente a la Tarea').
4. Calcula el Índice Bio-Riesgo Bruto = nivel_susceptibilidad × nivel_exposicion (escala 1-5 c/u, máx 25).
5. Factor Reducción = min(percepcion_pts / 500, 0.40).
6. Índice Bio-Riesgo Efectivo = Bruto × (1 - Factor Reducción). Clasificación: ≥20=Crítico, ≥12=Alto, ≥6=Moderado, <6=Bajo.
7. Diseña la Jerarquía de Controles (Dec. 1072): Fuente, Medio e Individuo. Incluye análisis de costo-beneficio para el control más recomendado.

Genera los riesgos bio-individuales relevantes y necesarios en formato JSON array (devuelve la lista completa, incluyendo los que ya existían).
Cada objeto DEBE tener estos campos exactos:
{
  "id": "uuid-único", // Conserva el ID original si estás devolviendo un riesgo existente. Genera uno nuevo si es un riesgo nuevo.
  "origen_riesgo": "Condición Insegura"|"Acto Inseguro"|"Inherente a la Tarea",
  "dominio_bio": string, // Usa SOLO uno de estos: Sensorial|Respiratorio|Osteomuscular|Psicoemocional|Inmunológico|Cardiovascular|Metabólico|Neurológico|Seguridad
  "dimension_bio": string, // OBLIGATORIO: Debe ser EXACTAMENTE una de las opciones válidas listadas arriba para el dominio_bio seleccionado. Copia el texto idéntico.
  "peligro_cargo": string,
  "actividad_expuesta": string,
  "efectos_posibles": string, // Posibles enfermedades o lesiones (ej. Hipoacusia, Lumbalgia)
  "factor_individual": string, // condición del trabajador que amplifica el riesgo
  "controles_fuente": string, // Controles existentes en la fuente (DEBE ser del listado VERDADEROS CONTROLES o "Ninguno"/"No registrado en Perfil de Cargo")
  "controles_medio": string, // Controles existentes en el medio (DEBE ser del listado VERDADEROS CONTROLES o "Ninguno"/"No registrado en Perfil de Cargo")
  "controles_individuo": string, // Controles existentes en el individuo (DEBE ser del listado VERDADEROS CONTROLES o "Ninguno"/"No registrado en Perfil de Cargo")
  "fit_score": ${fitScore},
  "percepcion_riesgo_pts": ${percepcionPts},
  "nivel_susceptibilidad": number (1-5),
  "nivel_exposicion": number (1-5),
  "indice_bio_riesgo_bruto": number,
  "factor_reduccion_percepcion": ${factorReduccion.toFixed(3)},
  "indice_bio_riesgo_efectivo": number,
  "clasificacion_bio": "Crítico"|"Alto"|"Moderado"|"Bajo",
  "intervencion_prioritaria": boolean,
  "medida_eliminacion": string, // Medida de Eliminación propuesta (ej. automatización, eliminar tarea peligrosa). NUNCA dejes vacío ni pongas "No aplica" genérico sin justificar.
  "medida_sustitucion": string, // Medida de Sustitución propuesta (ej. cambiar herramienta o químico por uno menos nocivo). Si no aplica, describe por qué.
  "medida_ingenieria": string, // Medida de Ingeniería propuesta (ej. rediseño ergonómico, ventilación localizada). DEBE ser detallada y técnicamente viable.
  "medida_administrativa": string, // Medida Administrativa propuesta (ej. rotación de turnos, procedimientos específicos, entrenamientos).
  "medida_eppu": string, // Medida de EPP propuesto (especificando tipo, material, o norma de certificación). Para riesgos psicosociales: "No aplica - el riesgo psicosocial no se mitiga con EPP. La intervención debe ser organizacional."
  "factores_reduccion_texto": string, // Justificación analítica detallando cuál control propuesto es el óptimo en relación costo-beneficio y por qué, seguido de la escala jerarquizada de los demás controles (de mejor a menos efectivo) con su respectiva justificación de prioridad.
  "plan_accion_bio": string, // Resumen general
  "restricciones_laborales": string,
  "seguimiento_medico": "Mensual"|"Trimestral"|"Semestral"|"Anual"
}

PRIORIZA los dominios y clasificaciones GTC-45 que correlacionen lógicamente con las condiciones de salud del trabajador y las actividades de su cargo.
Devuelve SOLO el array JSON, sin formato markdown adicional ni bloques delimitadores.`;

        const apiKeys = await resolveApiKeys(req.user.id, getUserKey, AuthKeys);
        const selectedModel = modelName || 'gemini-2.5-flash';
        const result = await generateWithKeyRotation(selectedModel, req.user.id || req.user, prompt);
        const response = await result.response;
        let rawJson = response.text();

        // Sanitizar salida Markdown
        rawJson = rawJson.replace(/^```(json)?/im, '').replace(/```$/m, '').trim();

        let riesgosBioIndividual = [];
        try {
            riesgosBioIndividual = JSON.parse(rawJson);
        } catch (parseError) {
            const match = rawJson.match(/\[\s*\{[\s\S]*?\}\s*\]/m);
            if (match) {
                riesgosBioIndividual = JSON.parse(match[0]);
            } else {
                throw new Error("Formato JSON inválido devuelto por la IA");
            }
        }

        const clasificarBioRiesgo = (val) => {
            if (val >= 20) return 'Crítico';
            if (val >= 12) return 'Alto';
            if (val >= 6) return 'Moderado';
            return 'Bajo';
        };

        riesgosBioIndividual = riesgosBioIndividual.map((r, i) => {
            const nd = Number(r.nivel_susceptibilidad) || 1;
            const ne = Number(r.nivel_exposicion) || 1;
            const bruto = nd * ne;
            const factor = Math.min(percepcionPts / 500, 0.40);
            const efectivo = parseFloat((bruto * (1 - factor)).toFixed(2));

            return {
                ...r,
                id: r.id || `bio-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
                fit_score: fitScore,
                percepcion_riesgo_pts: percepcionPts,
                nivel_susceptibilidad: nd,
                nivel_exposicion: ne,
                indice_bio_riesgo_bruto: bruto,
                factor_reduccion_percepcion: parseFloat(factor.toFixed(3)),
                indice_bio_riesgo_efectivo: efectivo,
                clasificacion_bio: clasificarBioRiesgo(efectivo),
                intervencion_prioritaria: efectivo >= 12,
                fecha_registro: r.fecha_registro || new Date(),
            };
        });

        worker.riesgosBioIndividual = riesgosBioIndividual;
        worker.updatedAt = Date.now();
        await worker.save();

        res.json({ success: true, riesgosBioIndividual, worker });
    } catch (error) {
        logger.error('[SGSST Workers] Generate bio-risks error:', error);
        res.status(500).json({ error: 'Error al generar riesgos bio-individuales con IA' });
    }
});

// POST: Actualizar una fila individual con IA (Bio-IPEVAR)
router.post('/worker/:id/ai-update-bio-row', requireJwtAuth, async (req, res) => {
    try {
        const { row, instruction, modelName } = req.body;
        if (!row) return res.status(400).json({ error: 'Se requiere la fila a actualizar' });
        
        const worker = await SgsstWorker.findOne({ _id: req.params.id, user: req.user.id });
        if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

        // Fetch cargo profile for context
        let cargoContext = '';
        let cargoNombre = '';
        let perfil = null;
        try {
            const getPerfilCargoDataModel = () => {
                if (!mongoose.models.PerfilCargoData) require('./perfilesCargo');
                return mongoose.models.PerfilCargoData;
            };
            const PerfilCargoData = getPerfilCargoDataModel();
            const cargoDoc = await PerfilCargoData.findOne({ user: req.user.id, companyId: worker.companyId });
            if (cargoDoc && cargoDoc.perfilesList) {
                perfil = cargoDoc.perfilesList.find(p => p.id === worker.perfilId);
                if (perfil) {
                    cargoNombre = perfil.nombreCargo || 'No especificado';
                    cargoContext = `
- Cargo: ${perfil.nombreCargo || 'No especificado'}
- Área: ${perfil.area || ''}
- Exigencia Física: ${perfil.exigenciaFisica || ''}
- Exigencia Mental: ${perfil.exigenciaMental || ''}
- Opera Maquinaria: ${perfil.operaMaquinaria || ''}
- EPP Requerido: ${(perfil.eppSeleccionados || []).join(', ')}
- Contexto adicional del cargo: ${perfil.contextoAdicional || ''}`;
                }
            }
        } catch (e) { /* ignore */ }

        // Gather all actual verified controls from PerfilCargo and MatrizPeligros
        let realControlesFuente = new Set();
        let realControlesMedio = new Set();
        let realControlesIndividuo = new Set();

        if (perfil) {
            if (perfil.eppSeleccionados && Array.isArray(perfil.eppSeleccionados)) {
                perfil.eppSeleccionados.forEach(c => {
                    if (c && c.trim()) realControlesIndividuo.add(c.trim());
                });
            }
            if (perfil.entrenamientosSeleccionados && Array.isArray(perfil.entrenamientosSeleccionados)) {
                perfil.entrenamientosSeleccionados.forEach(c => {
                    if (c && c.trim()) realControlesIndividuo.add(`Capacitación: ${c.trim()}`);
                });
            }
        }

        try {
            const getMatrizPeligrosDataModel = () => {
                if (!mongoose.models.MatrizPeligrosData) require('./matrizPeligros');
                return mongoose.models.MatrizPeligrosData;
            };
            const MatrizPeligrosData = getMatrizPeligrosDataModel();
            const peligrosDoc = await MatrizPeligrosData.findOne({ user: req.user.id, companyId: worker.companyId });
            if (peligrosDoc && peligrosDoc.procesos) {
                peligrosDoc.procesos.forEach(p => {
                    if (p.controlesExistentes && p.controlesExistentes.trim()) {
                        realControlesMedio.add(p.controlesExistentes.trim());
                    }
                    if (p.peligros && Array.isArray(p.peligros)) {
                        p.peligros.forEach(pel => {
                            if (pel.fuenteGeneradora && pel.fuenteGeneradora.trim() && pel.fuenteGeneradora.toLowerCase() !== 'ninguno') {
                                realControlesFuente.add(pel.fuenteGeneradora.trim());
                            }
                            if (pel.medioExistente && pel.medioExistente.trim() && pel.medioExistente.toLowerCase() !== 'ninguno') {
                                realControlesMedio.add(pel.medioExistente.trim());
                            }
                            if (pel.individuoControl && pel.individuoControl.trim() && pel.individuoControl.toLowerCase() !== 'ninguno') {
                                realControlesIndividuo.add(pel.individuoControl.trim());
                            }
                        });
                    }
                });
            }
        } catch (e) {
            logger.error('[SGSST Workers] Error loading real company controls in update-row:', e);
        }

        const fuenteListStr = realControlesFuente.size > 0 
            ? Array.from(realControlesFuente).map(c => `- ${c}`).join('\n') 
            : '- No se registran controles específicos en la fuente en la base de datos de la empresa. Utiliza "Ninguno" o "No registrado en Perfil de Cargo"';
        const medioListStr = realControlesMedio.size > 0 
            ? Array.from(realControlesMedio).map(c => `- ${c}`).join('\n') 
            : '- No se registran controles específicos en el medio en la base de datos de la empresa. Utiliza "Ninguno" o "No registrado en Perfil de Cargo"';
        const individuoListStr = realControlesIndividuo.size > 0 
            ? Array.from(realControlesIndividuo).map(c => `- ${c}`).join('\n') 
            : '- No se registran controles específicos en el individuo en la base de datos de la empresa. Utiliza "Ninguno" o "No registrado en Perfil de Cargo"';

        const verdaderosControlesContext = `
=========================================
VERDADEROS CONTROLES EXISTENTES DE LA EMPRESA (Extraídos estrictamente de la base de datos y perfiles de cargo):

CONTROLES EN LA FUENTE:
${fuenteListStr}

CONTROLES EN EL MEDIO:
${medioListStr}

CONTROLES EN EL INDIVIDUO:
${individuoListStr}
=========================================`;

        const prompt = `Eres un experto en SST y jerarquía de controles biocéntricos.
Se te proporciona una fila de una Matriz IPEVAR Bio-Individual.
Tu tarea es analizar el peligro y generar una recomendación MEJORADA para todos los campos de controles propuestos, controles existentes, efectos y clasificación. NO modifiques el Dominio, Dimensión, u Origen.
${instruction ? `\nINSTRUCCIONES ESPECÍFICAS DEL USUARIO:\n"${instruction}"\n` : ''}

DATOS DEL TRABAJADOR:
- Nombre: ${worker.nombre}
- Condiciones de Salud: ${worker.condicionesSalud || 'Ninguno registrado'}
- FIT Score: ${worker.fitScore || 0}%
${cargoContext}

${verdaderosControlesContext}

REGLAS DE OBLIGATORIO CUMPLIMIENTO PARA CONTROLES EXISTENTES:
1. Queda ABSOLUTAMENTE PROHIBIDO inventar o alucinar controles existentes.
2. Para los campos "controles_fuente", "controles_medio", y "controles_individuo", debes seleccionar y mapear ÚNICAMENTE los controles que aparezcan en la sección "VERDADEROS CONTROLES EXISTENTES DE LA EMPRESA" que correspondan al peligro analizado.
3. Si para algún peligro o celda no existe un control registrado en dicha lista que aplique, debes colocar exactamente la frase: "No registrado en Perfil de Cargo" o "Ninguno". NUNCA te inventes controles como "Uso de tapabocas" o "Pausas activas" a menos que estén explícitamente en la lista provista.
4. Para el control del individuo, prioriza mapear los EPP Requeridos y Capacitaciones de la lista de controles en el individuo que correspondan al cargo del trabajador.

REGLAS OBLIGATORIAS PARA CONTROLES PROPUESTOS (JERARQUÍA DE CONTROLES):
1. Queda TERMINANTEMENTE PROHIBIDO usar "No aplica" de forma perezosa en los campos de controles propuestos. Formula medidas de intervención reales y técnicamente viables.
2. "medida_eliminacion" y "medida_sustitucion" deben argumentar técnicamente la viabilidad de eliminar o sustituir la fuente o material peligroso. Si no es viable, describe por qué. NUNCA dejes vacío ni pongas "No aplica" genérico sin justificar.
3. "medida_ingenieria", "medida_administrativa" y "medida_eppu" DEBEN contener propuestas concretas y detalladas con especificaciones técnicas adecuadas (ej. extractores, rediseño de puesto, capacitaciones específicas, tipo de EPP certificado).
4. El campo "factores_reduccion_texto" (Justificación Reducción) es OBLIGATORIO. Debes escribir un párrafo analítico y estructurado de MÍNIMO 3 oraciones completas y técnicas que:
   - Identifique y nombre explícitamente cuál de las 5 medidas de control propuestas (Eliminación, Sustitución, Ingeniería, Administrativa o EPP) representa la mejor alternativa en relación costo-beneficio y por qué.
   - Detalle una escala priorizada (de mejor a menos efectivo) de los demás controles propuestos, explicando brevemente la efectividad de cada uno para mitigar el riesgo.
   - Sustente la viabilidad financiera e impacto técnico preventivo (reducción de ausentismo frente a costo de inversión).

FILA ACTUAL:
${JSON.stringify(row, null, 2)}

Devuelve ÚNICAMENTE un objeto JSON con los campos actualizados. Ejemplo:
{
  "efectos_posibles": "...",
  "controles_fuente": "...",
  "controles_medio": "...",
  "controles_individuo": "...",
  "medida_eliminacion": "...",
  "medida_sustitucion": "...",
  "medida_ingenieria": "...",
  "medida_administrativa": "...",
  "medida_eppu": "...",
  "factores_reduccion_texto": "...",
  "plan_accion_bio": "...",
  "restricciones_laborales": "..."
}
No incluyas markdown.`;

        const apiKeys = await resolveApiKeys(req.user.id, getUserKey, AuthKeys);
        const selectedModel = modelName || 'gemini-2.5-flash';
        const result = await generateWithKeyRotation(selectedModel, req.user.id || req.user, prompt);
        const response = await result.response;
        let rawJson = response.text();
        rawJson = rawJson.replace(/^```(json)?/im, '').replace(/```$/m, '').trim();

        let updatedFields = {};
        try {
            updatedFields = JSON.parse(rawJson);
        } catch (e) {
            const match = rawJson.match(/\{[\s\S]*?\}/m);
            if (match) updatedFields = JSON.parse(match[0]);
            else throw new Error("JSON parse error");
        }

        res.json({ success: true, updatedFields });
    } catch (error) {
        logger.error('[SGSST Workers] AI Update Bio Row Error:', error);
        res.status(500).json({ error: 'Error al actualizar fila con IA' });
    }
});

// POST: Generar conclusión IA para Dashboard Bio-IPEVAR
router.post('/worker/:id/ai-chart-conclusion-bio', requireJwtAuth, async (req, res) => {
    try {
        const { chartType, matrixRows, chartStats, manualText, modelName } = req.body;
        
        if (manualText !== undefined) {
            // Guardar texto manual si se provee la funcionalidad en base de datos.
            // Para simplificar, devolvemos success.
            return res.json({ success: true, conclusion: manualText });
        }

        const prompt = `Eres un auditor SST analizando métricas de la Matriz Bio-Individual IPEVAR.
Gráfico analizado: ${chartType}
Estadísticas del gráfico: ${JSON.stringify(chartStats)}
Total de riesgos evaluados: ${matrixRows.length}

Genera una conclusión gerencial corta (2-3 oraciones) sobre estos datos. 
- Identifica el punto más crítico o la tendencia principal.
- Proporciona una recomendación de alto nivel.
Devuelve ÚNICAMENTE el texto de la conclusión.`;

        const apiKeys = await resolveApiKeys(req.user.id, getUserKey, AuthKeys);
        const selectedModel = modelName || 'gemini-2.5-flash';
        const result = await generateWithKeyRotation(selectedModel, req.user.id || req.user, prompt);
        const response = await result.response;
        const conclusion = response.text().trim();

        res.json({ success: true, conclusion });
    } catch (error) {
        logger.error('[SGSST Workers] AI Chart Conclusion Error:', error);
        res.status(500).json({ error: 'Error al generar conclusión' });
    }
});

// POST: Agregar puntos de percepción del riesgo (llamado desde otros módulos)
router.post('/worker/:id/add-percepcion-pts', requireJwtAuth, async (req, res) => {
    try {
        const { puntos, accion, modulo, referencia } = req.body;
        const worker = await SgsstWorker.findOne({ _id: req.params.id, user: req.user.id });
        if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

        const nuevoPts = Math.max(0, (worker.percepcionRiesgoScore || 0) + (Number(puntos) || 0));
        worker.percepcionRiesgoScore = nuevoPts;
        worker.percepcionRiesgoHistorial.push({ fecha: new Date(), accion, puntos: Number(puntos), modulo, referencia });
        worker.updatedAt = Date.now();
        await worker.save();

        res.json({ success: true, percepcionRiesgoScore: nuevoPts, worker });
    } catch (error) {
        logger.error('[SGSST Workers] Add percepcion pts error:', error);
        res.status(500).json({ error: 'Error al actualizar puntos de percepción' });
    }
});

// POST: Feed desde módulo externo — agrega evento a hoja de vida del trabajador
// body: { documento, tipo_modulo, descripcion, puntos, referencia }
router.post('/feed-hoja-vida', requireJwtAuth, async (req, res) => {
    try {
        const { documento, tipo_modulo, descripcion, puntos, referencia } = req.body;
        if (!documento || !tipo_modulo) return res.status(400).json({ error: 'documento y tipo_modulo requeridos' });

        const companyId = await getActiveCompanyId(req.user.id);
        const worker = await SgsstWorker.findOne({ user: req.user.id, companyId, documento: String(documento).trim() });
        if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado con ese documento' });

        const pts = Number(puntos) || 0;

        const update = { $set: { updatedAt: Date.now() } };

        if (tipo_modulo === 'atel') {
            update.$push = { atel: { fecha: new Date(), tipo: descripcion, descripcion, referenciaId: referencia } };
        } else if (tipo_modulo === 'actos') {
            update.$push = { actos_inseguros: { fecha: new Date(), tipo: descripcion, descripcion } };
        } else if (tipo_modulo === 'participacion_ipevar') {
            update.$push = { participaciones_ipevar: { fecha: new Date(), descripcion } };
        } else if (tipo_modulo === 'capacitacion') {
            update.$push = { capacitaciones: { nombre: descripcion, fecha: new Date() } };
        } else if (tipo_modulo === 'ats') {
            update.$push = { ats: { fecha: new Date(), descripcion } };
        }

        if (pts !== 0) {
            update.$inc = { percepcionRiesgoScore: pts };
            if (!update.$push) update.$push = {};
            update.$push.percepcionRiesgoHistorial = {
                fecha: new Date(), accion: descripcion, puntos: pts, modulo: tipo_modulo, referencia,
            };
        }

        await SgsstWorker.updateOne({ _id: worker._id }, update);
        res.json({ success: true, percepcionRiesgoScore: (worker.percepcionRiesgoScore || 0) + pts });
    } catch (error) {
        logger.error('[SGSST Workers] Feed hoja vida error:', error);
        res.status(500).json({ error: 'Error al actualizar hoja de vida del trabajador' });
    }
});

// POST: Generar riesgos IPEVAR con IA para un trabajador bio-individual (legado GTC 45)

router.post('/worker/:id/generate-risks', requireJwtAuth, async (req, res) => {
    try {
        const worker = await SgsstWorker.findOne({ _id: req.params.id, user: req.user.id });
        if (!worker) {
            return res.status(404).json({ error: 'Trabajador no encontrado' });
        }

        // Fetch cargo profile for context
        let cargoContext = '';
        try {
            const getPerfilCargoDataModel = () => {
                if (!mongoose.models.PerfilCargoData) require('./perfilesCargo');
                return mongoose.models.PerfilCargoData;
            };
            const PerfilCargoData = getPerfilCargoDataModel();
            const cargoDoc = await PerfilCargoData.findOne({ user: req.user.id });
            if (cargoDoc && cargoDoc.perfilesList) {
                const perfil = cargoDoc.perfilesList.find(p => p.id === worker.perfilId);
                if (perfil) {
                    cargoContext = `
- Cargo: ${perfil.nombreCargo || 'No especificado'}
- Área: ${perfil.area || ''}
- Exigencia Física: ${perfil.exigenciaFisica || ''}
- Exigencia Mental: ${perfil.exigenciaMental || ''}
- Opera Maquinaria: ${perfil.operaMaquinaria || ''}
- EPP Requerido: ${(perfil.eppSeleccionados || []).join(', ')}
- Contexto adicional: ${perfil.contextoAdicional || ''}`;
                }
            }
        } catch (e) { /* ignore if cargo not found */ }

        const prompt = `Eres un experto en Seguridad y Salud en el Trabajo, especializado en la metodología GTC 45 de Colombia.
Genera una matriz IPEVAR bio-individual personalizada para el siguiente trabajador.

DATOS DEL TRABAJADOR:
- Nombre: ${worker.nombre}
- Documento: ${worker.documento}
- Género: ${worker.genero || 'No especificado'}
- Condiciones de Salud Previas: ${worker.condicionesSalud || 'Ninguna registrada'}
${cargoContext}

Genera EXACTAMENTE 5 riesgos IPEVAR personalizados en formato JSON. Cada riesgo debe ser un objeto con estos campos EXACTOS:
{
  "proceso": string,
  "zona": string,
  "actividad": string,
  "tareas": string,
  "rutinaria": "Sí" | "No",
  "peligro_descripcion": string,
  "peligro_clasificacion": string (ej: "Biomecánico", "Físico", "Químico", "Psicosocial", "Locativo", "Mecánico"),
  "efectos_posibles": string,
  "controles_fuente": string,
  "controles_medio": string,
  "controles_individuo": string,
  "nd": number (1-4),
  "ne": number (1-4),
  "np": number (calculado: nd * ne),
  "nc": number (10=Catastrófico, 6=Muy grave, 2=Grave, 1=Leve),
  "nr": number (calculado: np * nc),
  "interpretacion_nr": "I" | "II" | "III" | "IV",
  "aceptabilidad": string,
  "medida_eliminacion": string,
  "medida_sustitucion": string,
  "medida_ingenieria": string,
  "medida_administrativa": string,
  "medida_eppu": string,
  "factores_reduccion": string,
  "nd_cualitativo": null,
  "id": string (UUID único)
}

PRIORIZA riesgos relacionados con las condiciones de salud del trabajador. Devuelve SOLO el array JSON, sin texto adicional.`;

        const apiKeys = await resolveApiKeys(req.user.id, getUserKey, AuthKeys);
        const rawJson = await generateWithKeyRotation(prompt, null, 'application/json', null, apiKeys);

        let riesgosIpevar = [];
        const match = rawJson.match(/\[\s*\{[\s\S]*?\}\s*\]/m);
        if (match) {
            riesgosIpevar = JSON.parse(match[0]);
        } else {
            riesgosIpevar = JSON.parse(rawJson);
        }

        // Add IDs if missing
        riesgosIpevar = riesgosIpevar.map((r, i) => ({
            ...r,
            id: r.id || `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`
        }));

        // Save to worker
        worker.riesgosIpevar = riesgosIpevar;
        worker.updatedAt = Date.now();
        await worker.save();

        res.json({ success: true, riesgosIpevar, worker });
    } catch (error) {
        logger.error('[SGSST Workers] Generate risks error:', error);
        res.status(500).json({ error: 'Error al generar los riesgos con IA' });
    }
});

module.exports = router;
