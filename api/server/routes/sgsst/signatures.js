const express = require('express');
const router = express.Router();
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CompanyInfo = require('~/models/CompanyInfo');
const mongoose = require('mongoose');
const { logger } = require('~/config');

router.get('/', requireJwtAuth, async (req, res) => {
    try {
        const signatures = {};
        
        // 1. Fetch Company Info
        const info = await CompanyInfo.findOne({ user: req.user.id }).lean();
        if (info) {
            if (info.legalRepConsent === 'Sí' && info.legalRepSignature && info.legalRepresentative) {
                signatures[info.legalRepresentative.trim().toUpperCase()] = info.legalRepSignature;
            }
            if (info.sstRespConsent === 'Sí' && info.sstRespSignature && info.responsibleSST) {
                signatures[info.responsibleSST.trim().toUpperCase()] = info.sstRespSignature;
            }
        }

        // 2. Fetch PerfilSociodemografico Workers
        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (PerfilSociodemograficoData) {
            const perfil = await PerfilSociodemograficoData.findOne({ user: req.user.id }).lean();
            if (perfil && perfil.trabajadores) {
                for (const worker of perfil.trabajadores) {
                    if (worker.consentimientoFirmaDigital === 'Sí' && worker.firmaDigital && worker.nombre) {
                        signatures[worker.nombre.trim().toUpperCase()] = worker.firmaDigital;
                    }
                }
            }
        }

        res.json({ signatures });
    } catch (error) {
        logger.error('[SGSST Signatures] Fetch error:', error);
        res.status(500).json({ error: 'Error fetching signatures' });
    }
});

module.exports = router;
