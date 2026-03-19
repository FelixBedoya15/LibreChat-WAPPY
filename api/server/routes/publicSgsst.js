const express = require('express');
const mongoose = require('mongoose');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');

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

        res.json({ success: true, message: 'Reporte radicado de forma exitosa y segura.' });

    } catch (error) {
        logger.error('[Public SGSST] Report submission error:', error);
        res.status(500).json({ error: 'Error al procesar el reporte' });
    }
});

module.exports = router;
