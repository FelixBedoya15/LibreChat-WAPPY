const express = require('express');
const mongoose = require('mongoose');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const Notification = require('~/models/Notification');

const router = express.Router();

// ─── GET /api/public-sgsst/company/:companyId ─────────────────────────────
// Get public details of the company (Name, Logo) to show in the portal
router.get('/company/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'ID de empresa inválido' });
        }

        const company = await CompanyInfo.findOne({ user: companyId }).lean();
        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        return res.json({
            companyName: company.companyName || 'Empresa Registrada',
            nit: company.nit || '',
            logo: company.logoBase64 || null
        });
    } catch (error) {
        logger.error('[Public SGSST] Company fetch error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ─── POST /api/public-sgsst/validate-worker/:companyId ─────────────────────
// Validar tempranamente que el trabajador sí existe en el Perfil Sociodemográfico
router.post('/validate-worker/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { cedula, nombre } = req.body;

        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'ID de empresa inválido' });
        }

        if (!cedula || !nombre) {
            return res.status(400).json({ error: 'Nombre y Cédula son obligatorios' });
        }

        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (!PerfilSociodemograficoData) {
            return res.status(500).json({ error: 'Modelo PerfilSociodemografico no encontrado' });
        }

        const perfil = await PerfilSociodemograficoData.findOne({ user: companyId }).lean();
        if (!perfil || !perfil.trabajadores || perfil.trabajadores.length === 0) {
            return res.status(404).json({ error: 'La empresa no cuenta con un Perfil Sociodemográfico registrado' });
        }

        const formatStr = (s) => String(s).trim().toLowerCase();
        
        const workerFound = perfil.trabajadores.find(t => formatStr(t.identificacion) === formatStr(cedula));
        if (!workerFound) {
            return res.status(403).json({ error: 'Cédula no encontrada en la base de datos de esta empresa. No tiene autorización.' });
        }

        const workerNameParts = formatStr(workerFound.nombre).split(' ').filter(p => p.length > 2);
        const inputNameFormat = formatStr(nombre);
        
        const nameMatches = workerNameParts.some(part => inputNameFormat.includes(part));
        if (!nameMatches && workerFound.nombre) {
            return res.status(403).json({ error: 'El nombre ingresado no coincide con el registrado para esta cédula.' });
        }

        return res.json({ success: true, message: 'Validación exitosa' });
    } catch (error) {
        logger.error('[Public SGSST] Worker validation error:', error);
        res.status(500).json({ error: 'Error al procesar la validación' });
    }
});

// ─── POST /api/public-sgsst/reporte-acto/:companyId ───────────────────────
// Submit a new Incident/Act report from a worker
router.post('/reporte-acto/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { cedula, nombre, data } = req.body;

        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'ID de empresa inválido' });
        }

        if (!cedula || !nombre) {
            return res.status(400).json({ error: 'Nombre y Cédula son obligatorios para el reporte' });
        }

        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        const ReporteActosData = mongoose.models.ReporteActosData;

        if (!PerfilSociodemograficoData || !ReporteActosData) {
            return res.status(500).json({ error: 'Los modelos de datos no están listos' });
        }

        // 1. Validar identidad cruzada con el Perfil Sociodemográfico
        const perfil = await PerfilSociodemograficoData.findOne({ user: companyId }).lean();
        if (!perfil || !perfil.trabajadores || perfil.trabajadores.length === 0) {
            return res.status(404).json({ 
                error: 'La empresa no cuenta con un Perfil Sociodemográfico registrado' 
            });
        }

        // Clean strings for comparison
        const formatStr = (s) => String(s).trim().toLowerCase();
        
        const workerFound = perfil.trabajadores.find(t => 
            formatStr(t.identificacion) === formatStr(cedula)
        );

        if (!workerFound) {
            return res.status(403).json({ 
                error: 'Cédula no encontrada en la base de datos de esta empresa. No tiene autorización para reportar.' 
            });
        }

        // Match the name loosely (must contain parts of the name to verify they know it)
        const workerNameParts = formatStr(workerFound.nombre).split(' ').filter(p => p.length > 2);
        const inputNameFormat = formatStr(nombre);
        
        const nameMatches = workerNameParts.some(part => inputNameFormat.includes(part));
        if (!nameMatches && workerFound.nombre) {
            return res.status(403).json({ 
                error: 'El nombre ingresado no coincide en absoluto con el registrado para esta cédula.' 
            });
        }

        // 2. Crear el objeto para el Inbox
        const newInboxItem = {
            id: new mongoose.Types.ObjectId().toString(),
            trabajador: {
                nombre: workerFound.nombre,
                cedula: workerFound.identificacion,
                cargo: workerFound.cargo || 'No especificado'
            },
            data: data || {}, // contains descripcion, fecha, hora, fotos
            createdAt: new Date()
        };

        // 3. Guardar en el Inbox Público de ReporteActosData
        await ReporteActosData.findOneAndUpdate(
            { user: companyId },
            { $push: { inboxPublico: newInboxItem }, $set: { updatedAt: Date.now() } },
            { upsert: true, new: true }
        );

        // ─── Crear notificación de sistema ───
        try {
            await Notification.create({
                user: companyId,
                type: 'sgsst_reporte_acto',
                title: 'Nuevo Reporte de Acto Inseguro',
                body: `${workerFound.nombre} ha reportado un acto o condición insegura desde el portal público.`,
                metadata: { module: 'reporte_actos', reportId: newInboxItem.id }
            });
        } catch (notifErr) {
            logger.warn('[Public SGSST] Could not create notification:', notifErr.message);
        }

        res.json({ success: true, message: 'Reporte radicado de forma exitosa y segura.' });

    } catch (error) {
        logger.error('[Public SGSST] Report submission error:', error);
        res.status(500).json({ error: 'Error al procesar el reporte' });
    }
});

// ─── POST /api/public-sgsst/participacion-ipevar/:companyId ───────────────────────
// Submit a new Participacion IPEVAR Trabajadores report from a worker
router.post('/participacion-ipevar/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { cedula, nombre, data } = req.body;

        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'ID de empresa inválido' });
        }

        if (!cedula || !nombre) {
            return res.status(400).json({ error: 'Nombre y Cédula son obligatorios para la participación' });
        }

        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        const ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData;

        if (!PerfilSociodemograficoData || !ParticipacionIpevarData) {
            return res.status(500).json({ error: 'Los modelos de datos no están listos' });
        }

        // 1. Validar identidad cruzada con el Perfil Sociodemográfico
        const perfil = await PerfilSociodemograficoData.findOne({ user: companyId }).lean();
        if (!perfil || !perfil.trabajadores || perfil.trabajadores.length === 0) {
            return res.status(404).json({ 
                error: 'La empresa no cuenta con un Perfil Sociodemográfico registrado' 
            });
        }

        const formatStr = (s) => String(s).trim().toLowerCase();
        
        const workerFound = perfil.trabajadores.find(t => 
            formatStr(t.identificacion) === formatStr(cedula)
        );

        if (!workerFound) {
            return res.status(403).json({ 
                error: 'Cédula no encontrada en la base de datos de esta empresa. No tiene autorización.' 
            });
        }

        const workerNameParts = formatStr(workerFound.nombre).split(' ').filter(p => p.length > 2);
        const inputNameFormat = formatStr(nombre);
        
        const nameMatches = workerNameParts.some(part => inputNameFormat.includes(part));
        if (!nameMatches && workerFound.nombre) {
            return res.status(403).json({ 
                error: 'El nombre ingresado no coincide con el registrado para esta cédula.' 
            });
        }

        // 2. Crear el objeto para el Inbox
        const newInboxItem = {
            id: new mongoose.Types.ObjectId().toString(),
            trabajador: {
                nombre: workerFound.nombre,
                cedula: workerFound.identificacion,
                cargo: workerFound.cargo || 'No especificado'
            },
            data: data || {}, // contains foto, tarea, peligros, controlesExistentes, etc
            createdAt: new Date()
        };

        // 3. Guardar en el Inbox Público de ParticipacionIpevarData
        await ParticipacionIpevarData.findOneAndUpdate(
            { user: companyId },
            { $push: { inboxPublico: newInboxItem }, $set: { updatedAt: Date.now() } },
            { upsert: true, new: true }
        );

        // ─── Crear notificación de sistema ───
        try {
            await Notification.create({
                user: companyId,
                type: 'sgsst_participacion_ipevar',
                title: 'Nueva Participación IPEVAR Recibida',
                body: `${workerFound.nombre} ha enviado su identificación de peligros y participación IPEVAR.`,
                metadata: { module: 'participacion_ipevar', reportId: newInboxItem.id }
            });
        } catch (notifErr) {
            logger.warn('[Public SGSST] Could not create notification:', notifErr.message);
        }

        res.json({ success: true, message: 'Su participación ha sido enviada exitosamente al equipo SGSST.' });

    } catch (error) {
        logger.error('[Public SGSST] Participacion IPEVAR submission error:', error);
        res.status(500).json({ error: 'Error al procesar la participación' });
    }
});

// ─── POST /api/public-sgsst/investigacion-atel/testimonio/:companyId ─────────
// Submit a new testimony from a witness for an ATEL investigation
router.post('/investigacion-atel/testimonio/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { cedula, nombre, data } = req.body;

        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'ID de empresa inválido' });
        }

        if (!cedula || !nombre) {
            return res.status(400).json({ error: 'Nombre y Cédula son obligatorios' });
        }

        const InvestigacionAtelData = mongoose.models.InvestigacionAtelData;
        if (!InvestigacionAtelData) {
            return res.status(500).json({ error: 'Modelo InvestigacionAtelData no encontrado' });
        }

        // Create the testimony object for the inbox
        const newInboxItem = {
            id: new mongoose.Types.ObjectId().toString(),
            testigo: {
                nombre,
                cedula,
                cargo: data.cargo || 'Testigo Externo / No especificado'
            },
            testimonio: data.testimonio || '',
            media: {
                foto1: data.foto1 || null,
                foto2: data.foto2 || null,
                video: data.video || null
            },
            createdAt: new Date(),
            status: 'pending'
        };

        // Push to inboxTestimonios
        await InvestigacionAtelData.findOneAndUpdate(
            { user: companyId },
            { $push: { inboxTestimonios: newInboxItem }, $set: { updatedAt: Date.now() } },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'Su testimonio ha sido radicado exitosamente en el sistema de investigación.' });
    } catch (error) {
        logger.error('[Public SGSST] ATEL Testimony submission error:', error);
        res.status(500).json({ error: 'Error al procesar el testimonio' });
    }
});

// ─── ALTA DIRECCIÓN: HELPERS & ROUTES ───────────────────────────────────────

const GERENCIA_KEYWORDS = [
    'gerente', 'representante legal', 'director', 'presidente', 'ceo',
    'vicepresidente', 'subgerente', 'directora', 'gerencia', 'junta directiva',
    'copropietario', 'administrador', 'socios'
];

function isGerenciaRole(cargo) {
    if (!cargo) return false;
    const lc = cargo.toLowerCase().trim();
    return GERENCIA_KEYWORDS.some(kw => lc.includes(kw));
}

// POST /api/public-sgsst/validate-alta-direccion/:companyId
router.post('/validate-alta-direccion/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { cedula, nombre } = req.body;

        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (!PerfilSociodemograficoData) return res.status(500).json({ error: 'Modelo no encontrado' });

        const perfil = await PerfilSociodemograficoData.findOne({ user: companyId }).lean();
        if (!perfil || !perfil.trabajadores) return res.status(404).json({ error: 'Empresa sin trabajadores registrados.' });

        const worker = perfil.trabajadores.find(t => String(t.identificacion).trim() === String(cedula).trim());
        if (!worker) return res.status(403).json({ error: 'Cédula no encontrada en el sistema.' });

        if (!isGerenciaRole(worker.cargo)) {
            return res.status(403).json({ error: `Acceso denegado. Cargo: "${worker.cargo}". Solo para Gerencia.` });
        }
        res.json({ success: true, trabajador: { nombre: worker.nombre, cargo: worker.cargo, cedula: worker.identificacion } });
    } catch (error) {
        logger.error('[Public AltaDireccion] Validation error:', error);
        res.status(500).json({ error: 'Error al validar' });
    }
});

// POST /api/public-sgsst/alta-direccion/:companyId
router.post('/alta-direccion/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { cedula, data } = req.body;
        const AltaDireccionData = mongoose.models.AltaDireccionData;
        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;

        const perfil = await PerfilSociodemograficoData.findOne({ user: companyId }).lean();
        const worker = perfil?.trabajadores?.find(t => String(t.identificacion).trim() === String(cedula).trim());
        if (!worker || !isGerenciaRole(worker.cargo)) return res.status(403).json({ error: 'No autorizado.' });

        const newReport = {
            id: new mongoose.Types.ObjectId().toString(), // always string
            trabajador: { nombre: worker.nombre, cargo: worker.cargo, cedula: worker.identificacion },
            data: data,
            status: 'pending',
            createdAt: new Date()
        };

        const companyObjectId = new mongoose.Types.ObjectId(companyId);

        await AltaDireccionData.findOneAndUpdate(
            { user: companyObjectId },
            { $push: { inboxPublico: newReport } },
            { upsert: true, new: true }
        );

        // ─── Crear notificación de sistema ───
        try {
            await Notification.create({
                user: companyId,
                type: 'sgsst_alta_direccion',
                title: 'Nueva Evaluación de Alta Dirección',
                body: `${worker.nombre} (${worker.cargo}) ha enviado su revisión por la Alta Dirección desde el portal público.`,
                metadata: { module: 'alta_direccion', reportId: newReport.id }
            });
        } catch (notifErr) {
            logger.warn('[Public AltaDireccion] Could not create notification:', notifErr.message);
        }

        res.json({ success: true });
    } catch (error) {
        logger.error('[Public AltaDireccion] Submission error:', error);
        res.status(500).json({ error: 'Error al enviar' });
    }
});

// ─── GET /api/public-sgsst/perfil-update/:companyId/:workerId ──────────────
// Fetch current worker profile data to pre-fill the self-update form
router.get('/perfil-update/:companyId/:workerId', async (req, res) => {
    try {
        const { companyId, workerId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'ID de empresa inválido' });
        }

        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (!PerfilSociodemograficoData) {
            return res.status(500).json({ error: 'Modelo no encontrado' });
        }

        const perfil = await PerfilSociodemograficoData.findOne({ user: companyId }).lean();
        if (!perfil || !perfil.trabajadores) {
            return res.status(404).json({ error: 'Empresa sin trabajadores registrados.' });
        }

        const worker = perfil.trabajadores.find(t => String(t.id) === String(workerId));
        if (!worker) {
            return res.status(404).json({ error: 'Trabajador no encontrado' });
        }

        const company = await (require('~/models/CompanyInfo')).findOne({ user: companyId }).lean();

        return res.json({
            companyName: company?.companyName || 'Empresa',
            logo: company?.logoBase64 || null,
            worker: {
                id: worker.id,
                nombre: worker.nombre,
                cargo: worker.cargo,
                identificacion: worker.identificacion,
                telefono: worker.telefono || '',
                emergenciaContacto: worker.emergenciaContacto || '',
                tipoSangre: worker.tipoSangre || '',
                enfermedades: worker.enfermedades || '',
                medicamentos: worker.medicamentos || '',
                fuma: worker.fuma || '',
                alcohol: worker.alcohol || '',
                terapiaPsicologica: worker.terapiaPsicologica || '',
                personasCargo: worker.personasCargo ?? '',
                estrato: worker.estrato || '',
                vivienda: worker.vivienda || '',
                soatVencimiento: worker.soatVencimiento || '',
                tecnicomecanicaVencimiento: worker.tecnicomecanicaVencimiento || '',
                licenciaSST: worker.licenciaSST || '',
                licenciaVencimiento: worker.licenciaVencimiento || '',
                curso50h: worker.curso50h || '',
                curso20h: worker.curso20h || '',
            }
        });
    } catch (err) {
        logger.error('[Public Perfil Update GET]', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ─── POST /api/public-sgsst/perfil-update/:companyId/:workerId ─────────────
// Worker self-submits profile data update; stored in pending inbox for admin approval
router.post('/perfil-update/:companyId/:workerId', async (req, res) => {
    try {
        const { companyId, workerId } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'ID de empresa inválido' });
        }

        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        const perfil = await PerfilSociodemograficoData.findOne({ user: new mongoose.Types.ObjectId(companyId) });
        if (!perfil) return res.status(404).json({ error: 'Empresa no encontrada' });

        const worker = (perfil.trabajadores || []).find(t => String(t.id) === String(workerId));
        if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

        // Store in the pending inbox
        if (!perfil.actualizacionesPendientes) perfil.actualizacionesPendientes = [];
        perfil.actualizacionesPendientes.push({
            id: new mongoose.Types.ObjectId().toString(),
            workerId,
            workerNombre: worker.nombre,
            workerCargo: worker.cargo,
            updates,
            status: 'pending',
            createdAt: new Date()
        });
        await perfil.save();

        // Notify admin
        try {
            const Notif = require('~/models/Notification');
            await Notif.create({
                user: new mongoose.Types.ObjectId(companyId),
                type: 'sgsst_perfil_update',
                title: 'Actualización de Perfil Recibida',
                body: `${worker.nombre} ha solicitado actualizar su perfil sociodemográfico.`,
                metadata: { module: 'perfil_sociodemografico', workerId }
            });
        } catch (notifErr) {
            logger.warn('[Public Perfil Update] Could not create notification:', notifErr.message);
        }

        res.json({ success: true });
    } catch (err) {
        logger.error('[Public Perfil Update POST]', err);
        res.status(500).json({ error: 'Error al enviar actualización' });
    }
});

module.exports = router;

