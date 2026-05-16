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
        const worker = await SgsstWorker.findOne({ _id: req.params.id, user: req.user.id });
        if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

        // Fetch cargo profile for context
        let cargoContext = '';
        let cargoNombre = '';
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

        const fitScore = worker.fitScore || 0;
        const percepcionPts = worker.percepcionRiesgoScore || 0;
        const factorReduccion = Math.min(percepcionPts / 500, 0.40);

        const prompt = `Eres un experto en Salud y Seguridad en el Trabajo con enfoque BIO-INDIVIDUAL.
Tu tarea es generar una evaluación de riesgos personalizada bajo la METODOLOGÍA BIO-INDIVIDUAL WAPPY, que evalúa la interacción entre el peligro del cargo y el organismo específico del trabajador.

DATOS DEL TRABAJADOR:
- Nombre: ${worker.nombre}
- Género: ${worker.genero || 'No especificado'}
- Condiciones de Salud / Antecedentes: ${worker.condicionesSalud || 'Ninguno registrado'}
- FIT - Índice Biocéntrico Integral: ${fitScore}%
- Puntos Percepción del Riesgo: ${percepcionPts} pts
- Factor de Reducción por Buena Percepción: ${(factorReduccion * 100).toFixed(0)}%
${cargoContext}

METODOLOGÍA BIO-INDIVIDUAL + JERARQUÍA DE CONTROLES:
1. Analiza las Condiciones de Salud y el Cargo.
2. Identifica el peligro original y asígnalo a uno de los DOMINIOS BIO expandidos (ver abajo).
3. Determina el Origen ('Condición Insegura', 'Acto Inseguro', o 'Inherente a la Tarea').
4. Calcula el Índice Bio-Riesgo Bruto = nivel_susceptibilidad × nivel_exposicion (escala 1-5 c/u, máx 25).
5. Factor Reducción = min(percepcion_pts / 500, 0.40).
6. Índice Bio-Riesgo Efectivo = Bruto × (1 - Factor Reducción). Clasificación: ≥20=Crítico, ≥12=Alto, ≥6=Moderado, <6=Bajo.
7. Diseña la Jerarquía de Controles (Dec. 1072): Fuente, Medio e Individuo. Incluye análisis de costo-beneficio (Anexo E de GTC-45) para el control más recomendado.

Genera EXACTAMENTE 5 riesgos bio-individuales en formato JSON array. Cada objeto DEBE tener estos campos exactos:
{
  "id": "uuid-único",
  "origen_riesgo": "Condición Insegura"|"Acto Inseguro"|"Inherente a la Tarea",
  "dominio_bio": string, // Usa SOLO uno de estos: Osteomuscular|Cardiovascular|Neurológico|Psicoemocional|Metabólico|Respiratorio|Sensorial|Inmunológico / Biológico|Físico / Ambiental|Seguridad / Mecánico|Químico / Toxicológico
  "peligro_cargo": string,
  "actividad_expuesta": string,
  "factor_individual": string, // condición del trabajador que amplifica el riesgo
  "fit_score": ${fitScore},
  "percepcion_riesgo_pts": ${percepcionPts},
  "nivel_susceptibilidad": number (1-5),
  "nivel_exposicion": number (1-5),
  "indice_bio_riesgo_bruto": number,
  "factor_reduccion_percepcion": ${factorReduccion.toFixed(3)},
  "indice_bio_riesgo_efectivo": number,
  "clasificacion_bio": "Crítico"|"Alto"|"Moderado"|"Bajo",
  "intervencion_prioritaria": boolean,
  "controles_fuente": string, // Eliminación o sustitución
  "controles_medio": string, // Controles de ingeniería o administrativos
  "controles_individuo": string, // EPP, pausas, seguimiento médico
  "plan_accion_bio": string, // Resumen general
  "restricciones_laborales": string,
  "seguimiento_medico": "Mensual"|"Trimestral"|"Semestral"|"Anual"
}

PRIORIZA los dominios y clasificaciones GTC-45 que correlacionen lógicamente con las condiciones de salud del trabajador y las actividades de su cargo.
Devuelve SOLO el array JSON, sin formato markdown adicional.`;

        const apiKeys = await resolveApiKeys(req.user.id, getUserKey, AuthKeys);
        const result = await generateWithKeyRotation('gemini-2.5-flash', req.user.id || req.user, prompt);
        const response = await result.response;
        const rawJson = response.text();

        let riesgosBioIndividual = [];
        const match = rawJson.match(/\[\s*\{[\s\S]*?\}\s*\]/m);
        if (match) riesgosBioIndividual = JSON.parse(match[0]);
        else riesgosBioIndividual = JSON.parse(rawJson);

        riesgosBioIndividual = riesgosBioIndividual.map((r, i) => ({
            ...r,
            id: r.id || `bio-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
            fecha_registro: new Date(),
        }));

        worker.riesgosBioIndividual = riesgosBioIndividual;
        worker.updatedAt = Date.now();
        await worker.save();

        res.json({ success: true, riesgosBioIndividual, worker });
    } catch (error) {
        logger.error('[SGSST Workers] Generate bio-risks error:', error);
        res.status(500).json({ error: 'Error al generar riesgos bio-individuales con IA' });
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

        const worker = await SgsstWorker.findOne({ user: req.user.id, documento: String(documento).trim() });
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
