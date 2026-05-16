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

// Helper: Obtener Empresa Activa
async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Specific routes MUST come before wildcard /:perfilId to avoid
// Express matching them incorrectly.
// ─────────────────────────────────────────────────────────────────────────────

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
        let worker = await SgsstWorker.findOne({ user: req.user.id, documento: cleanDoc });

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
            // Si ya existe pero sin perfilId o con uno diferente, actualizarlo
            if (!worker.perfilId || worker.perfilId !== perfilId) {
                worker.perfilId = perfilId;
                if (companyId) worker.companyId = companyId;
                await worker.save();
            }
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

        const workers = await SgsstWorker.find({
            user: req.user.id,
            companyId: companyId,
            perfilId: req.params.perfilId
        }).sort({ fechaIngreso: -1 });

        res.json({ workers });
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

// POST: Generar riesgos IPEVAR con IA para un trabajador bio-individual
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
