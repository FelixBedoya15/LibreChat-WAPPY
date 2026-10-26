const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cookies = require('cookie');
const { requireJwtAuth } = require('../middleware');
const { requireAdmin, ADMIN_EMAILS } = require('../middleware/roles/admin');
const { getUserById } = require('~/models');
const { getAppConfig } = require('../../server/services/Config');
const controller = require('../controllers/ComunidadController');
const MatrizIpvrMetric = require('../../models/MatrizIpvrMetric');
const CompanyInfo = require('../../models/CompanyInfo');

/**
 * Middleware resiliente que autentica admin por Bearer token o por cookie refreshToken
 */
const requireAdminCookieOrJwt = async (req, res, next) => {
    // 1. Verificar si ya viene autenticado con rol de admin
    const currentEmail = req.user?.email?.toLowerCase();
    if (req.user && (req.user.role === 'ADMIN' || (currentEmail && ADMIN_EMAILS.includes(currentEmail)))) {
        return next();
    }

    // 2. Intentar autenticar mediante Bearer token en Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded && (decoded.id || decoded._id)) {
                const userId = decoded.id || decoded._id;
                const user = await getUserById(userId, '-password -__v -totpSecret -backupCodes');
                const userEmail = user?.email?.toLowerCase();
                if (user && (user.role === 'ADMIN' || (userEmail && ADMIN_EMAILS.includes(userEmail)))) {
                    req.user = user;
                    return next();
                }
            }
        } catch (e) {}
    }

    // 3. Intentar autenticar mediante la cookie refreshToken enviada por el navegador
    try {
        const rawCookies = req.headers.cookie;
        if (rawCookies) {
            const parsed = cookies.parse(rawCookies);
            const refreshToken = parsed.refreshToken;
            if (refreshToken && process.env.JWT_REFRESH_SECRET) {
                const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                if (payload && (payload.id || payload._id)) {
                    const userId = payload.id || payload._id;
                    const user = await getUserById(userId, '-password -__v -totpSecret -backupCodes');
                    const userEmail = user?.email?.toLowerCase();
                    if (user && (user.role === 'ADMIN' || (userEmail && ADMIN_EMAILS.includes(userEmail)))) {
                        req.user = user;
                        return next();
                    }
                }
            }
        }
    } catch (err) {
        // Fallback a autenticación estándar
    }

    // 4. Fallback a requireJwtAuth y requireAdmin
    return requireJwtAuth(req, res, () => {
        return requireAdmin(req, res, next);
    });
};

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            const appConfig = await getAppConfig();
            const dir = path.join(appConfig.paths.uploads, 'comunidad');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        } catch (err) {
            cb(err);
        }
    },
    filename: function (req, file, cb) {
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const finalName = `${Date.now()}-${cleanName}`;
        cb(null, finalName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// --- Public ---
router.get('/config', controller.getComunidadConfig);

// Endpoint liviano para detectar si el visitante actual tiene sesión activa de Administrador
router.get('/is-admin', async (req, res) => {
    try {
        // 1. Verificar si viene Bearer token en Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded && (decoded.id || decoded._id)) {
                    const userId = decoded.id || decoded._id;
                    const user = await getUserById(userId, '-password -__v -totpSecret -backupCodes');
                    const userEmail = user?.email?.toLowerCase();
                    if (user && (user.role === 'ADMIN' || (userEmail && ADMIN_EMAILS.includes(userEmail)))) {
                        return res.json({ isAdmin: true, email: user.email, name: user.name, token });
                    }
                }
            } catch (e) {}
        }

        // 2. Verificar si viene cookie refreshToken de sesión
        const rawCookies = req.headers.cookie;
        if (rawCookies) {
            const parsed = cookies.parse(rawCookies);
            const refreshToken = parsed.refreshToken;
            if (refreshToken && process.env.JWT_REFRESH_SECRET) {
                const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                if (payload && (payload.id || payload._id)) {
                    const userId = payload.id || payload._id;
                    const user = await getUserById(userId, '-password -__v -totpSecret -backupCodes');
                    const userEmail = user?.email?.toLowerCase();
                    if (user && (user.role === 'ADMIN' || (userEmail && ADMIN_EMAILS.includes(userEmail)))) {
                        const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
                        return res.json({ isAdmin: true, email: user.email, name: user.name, token });
                    }
                }
            }
        }
    } catch (err) {
        // error silencioso
    }
    return res.json({ isAdmin: false });
});
router.post('/checkout', controller.createComunidadCheckout);
router.post('/verify', controller.verifyComunidadTransaction);
router.post('/check-access', controller.checkComunidadAccess);
router.post('/video-finished', controller.markVideoFinished);
router.post('/metrics/session', controller.registerSessionMetric);
router.get('/audit-forensic', controller.auditComunidadForensic);
router.post('/fix-purchase', controller.fixComunidadPurchase);
router.post('/mark-tracked', controller.markPurchaseTracked);

router.get('/download/:filename', async (req, res) => {
    try {
        const appConfig = await getAppConfig();
        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.resolve(appConfig.paths.uploads, 'comunidad', filename);
        
        const safeDir = path.resolve(appConfig.paths.uploads, 'comunidad');
        if (!filePath.startsWith(safeDir) || !fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'El archivo solicitado no existe.' });
        }

        const originalName = filename.substring(filename.indexOf('-') + 1);
        return res.download(filePath, originalName);
    } catch (err) {
        console.error('[ComunidadRouter] Download error:', err);
        return res.status(500).json({ error: 'Error interno al descargar.' });
    }
});

// --- Admin ---
router.post('/config', requireAdminCookieOrJwt, controller.updateComunidadConfig);
router.get('/purchases', requireJwtAuth, requireAdmin, controller.getAllPurchases);
router.delete('/purchases/:id', requireJwtAuth, requireAdmin, controller.deletePurchase);
router.get('/metrics/stats', requireJwtAuth, requireAdmin, controller.getMetricsStats);

router.post('/upload', requireJwtAuth, requireAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        const filename = req.file.filename;
        const originalName = req.file.originalname;
        const url = `/api/comunidad/download/${encodeURIComponent(filename)}`;

        return res.json({
            success: true,
            file: {
                name: originalName,
                url,
                filename
            }
        });
    } catch (err) {
        console.error('[ComunidadRouter] Upload error:', err);
        return res.status(500).json({ error: 'Error al subir.' });
    }
});

// --- Matriz IPEVR Metrics (Telemetría de Empresas sin Firmas) ---

// 1. Guardar métricas de empresa desde /matrizipvr (Público, omite firmas)
router.post('/matrizipvr/metrics', async (req, res) => {
    try {
        const payload = req.body || {};
        
        // REGLA ESTRICTA: Eliminar totalmente firmas digitales ("todo menos las firmas")
        delete payload.legalRepSignature;
        delete payload.sstRespSignature;
        delete payload.logoBase64;

        const companyName = (payload.companyName || '').trim();
        const nit = (payload.nit || '').trim();

        if (!companyName && !nit) {
            return res.status(400).json({ error: 'Razón Social o NIT es requerido.' });
        }

        const query = nit ? { nit, source: 'matrizipvr_live' } : { companyName, source: 'matrizipvr_live' };
        const updateData = {
            companyName: companyName || 'Empresa Sin Nombre',
            companyType: payload.companyType || 'Persona Jurídica',
            nit: nit || '',
            legalRepresentative: payload.legalRepresentative || '',
            legalRepresentativeId: payload.legalRepresentativeId || '',
            workerCount: Number(payload.workerCount) || 0,
            arl: payload.arl || '',
            economicActivity: payload.economicActivity || '',
            riskLevel: payload.riskLevel || '',
            ciiu: payload.ciiu || '',
            address: payload.address || '',
            city: payload.city || '',
            phone: payload.phone || '',
            email: payload.email || '',
            responsibleSST: payload.responsibleSST || '',
            licenseNumber: payload.licenseNumber || '',
            licenseExpiry: payload.licenseExpiry || '',
            formationLevel: payload.formationLevel || '',
            totalRisks: Number(payload.totalRisks) || (Array.isArray(payload.processes) ? payload.processes.length : 0),
            highRisks: Number(payload.highRisks) || 0,
            mediumRisks: Number(payload.mediumRisks) || 0,
            lowRisks: Number(payload.lowRisks) || 0,
            matrixRowsCount: Number(payload.matrixRowsCount) || Number(payload.totalRisks) || 0,
            processes: Array.isArray(payload.processes) ? payload.processes.slice(0, 50) : [],
            cargos: Array.isArray(payload.cargos) ? payload.cargos.slice(0, 50) : [],
            peligros: Array.isArray(payload.peligros) ? payload.peligros.slice(0, 50) : [],
            sedesCount: Array.isArray(payload.sedes) ? payload.sedes.length : (Number(payload.sedesCount) || 0),
            clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
            source: 'matrizipvr_live',
            updatedAt: new Date()
        };

        const result = await MatrizIpvrMetric.findOneAndUpdate(
            query,
            { $set: updateData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.json({ success: true, id: result._id });
    } catch (err) {
        console.error('[ComunidadRouter] Error saving matrizipvr metrics:', err);
        return res.status(500).json({ error: 'Error al registrar métricas de empresa.' });
    }
});

// 2. Consultar métricas de empresas para el panel de Admin (Solo Administradores, únicamente empresas de /matrizipvr, omite firmas)
router.get('/matrizipvr/metrics', requireAdminCookieOrJwt, async (req, res) => {
    try {
        // Consultar únicamente las métricas registradas desde /matrizipvr.html
        const ipvrList = await MatrizIpvrMetric.find({
            source: { $ne: 'wappystudio_live' }
        })
            .sort({ updatedAt: -1 })
            .lean();

        const allCompanies = ipvrList.map((m) => ({
            ...m,
            _id: m._id.toString(),
        }));

        // Estadísticas agregadas
        let totalWorkers = 0;
        let totalRisks = 0;
        let totalHighRisks = 0;
        const byRiskLevel = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0, 'Sin especificar': 0 };
        const byCompanySize = { 'Micro (1-10)': 0, 'Pequeña (11-50)': 0, 'Mediana (51-200)': 0, 'Grande (>200)': 0 };
        const sectorMap = {};

        for (const c of allCompanies) {
            const wc = Number(c.workerCount) || 0;
            totalWorkers += wc;
            totalRisks += Number(c.totalRisks) || 0;
            totalHighRisks += Number(c.highRisks) || 0;

            // Nivel de riesgo
            const rl = (c.riskLevel || '').toString().trim().toUpperCase();
            if (byRiskLevel[rl] !== undefined) {
                byRiskLevel[rl]++;
            } else {
                byRiskLevel['Sin especificar']++;
            }

            // Tamaño
            if (wc <= 10) byCompanySize['Micro (1-10)']++;
            else if (wc <= 50) byCompanySize['Pequeña (11-50)']++;
            else if (wc <= 200) byCompanySize['Mediana (51-200)']++;
            else byCompanySize['Grande (>200)']++;

            // Sector
            const sector = (c.economicActivity || c.companyType || 'General').trim();
            if (sector) {
                sectorMap[sector] = (sectorMap[sector] || 0) + 1;
            }
        }

        const topSectors = Object.entries(sectorMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        return res.json({
            success: true,
            stats: {
                totalCompanies: allCompanies.length,
                totalWorkers,
                totalRisks,
                totalHighRisks,
                byRiskLevel,
                byCompanySize,
                topSectors
            },
            companies: allCompanies
        });
    } catch (err) {
        console.error('[ComunidadRouter] Error fetching matrizipvr metrics:', err);
        return res.status(500).json({ error: 'Error al consultar métricas de empresas.' });
    }
});

// 3. Eliminar registro de métrica (Solo Administrador)
router.delete('/matrizipvr/metrics/:id', requireAdminCookieOrJwt, async (req, res) => {
    try {
        const { id } = req.params;
        await MatrizIpvrMetric.findByIdAndDelete(id);
        return res.json({ success: true, message: 'Registro de métrica eliminado.' });
    } catch (err) {
        console.error('[ComunidadRouter] Error deleting metric:', err);
        return res.status(500).json({ error: 'Error al eliminar registro de métrica.' });
    }
});

// --- WAPPY Studio Metrics (Telemetría de Empresas sin Firmas) ---

// 1. Guardar métricas de empresa desde /wappystudio (Público, omite firmas)
router.post('/wappystudio/metrics', async (req, res) => {
    try {
        const payload = req.body || {};

        // REGLA ESTRICTA: Eliminar totalmente firmas digitales ("todo menos las firmas")
        delete payload.legalRepSignature;
        delete payload.sstRespSignature;
        delete payload.logoBase64;

        const companyName = (payload.companyName || '').trim();
        const nit = (payload.nit || '').trim();

        if (!companyName && !nit) {
            return res.status(400).json({ error: 'Razón Social o NIT es requerido.' });
        }

        const query = nit
            ? { nit, source: 'wappystudio_live' }
            : { companyName, source: 'wappystudio_live' };

        const updateData = {
            companyName: companyName || 'Empresa Sin Nombre',
            companyType: payload.companyType || 'Persona Jurídica',
            nit: nit || '',
            legalRepresentative: payload.legalRepresentative || '',
            legalRepresentativeId: payload.legalRepresentativeId || '',
            workerCount: Number(payload.workerCount) || 0,
            arl: payload.arl || '',
            economicActivity: payload.economicActivity || '',
            riskLevel: payload.riskLevel || '',
            ciiu: payload.ciiu || '',
            address: payload.address || '',
            city: payload.city || '',
            phone: payload.phone || '',
            email: payload.email || '',
            responsibleSST: payload.responsibleSST || '',
            licenseNumber: payload.licenseNumber || '',
            licenseExpiry: payload.licenseExpiry || '',
            formationLevel: payload.formationLevel || '',
            totalRisks: Number(payload.totalRisks) || Number(payload.audiosCount) || 0,
            highRisks: Number(payload.highRisks) || Number(payload.videosCount) || 0,
            mediumRisks: Number(payload.mediumRisks) || 0,
            lowRisks: Number(payload.lowRisks) || 0,
            matrixRowsCount: Number(payload.matrixRowsCount) || Number(payload.projectsCount) || 0,
            processes: Array.isArray(payload.processes) ? payload.processes.slice(0, 50) : [],
            cargos: Array.isArray(payload.cargos) ? payload.cargos.slice(0, 50) : [],
            peligros: Array.isArray(payload.peligros) ? payload.peligros.slice(0, 50) : [],
            sedesCount: Array.isArray(payload.sedes) ? payload.sedes.length : (Number(payload.sedesCount) || 0),
            clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
            source: 'wappystudio_live',
            updatedAt: new Date()
        };

        const result = await MatrizIpvrMetric.findOneAndUpdate(
            query,
            { $set: updateData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.json({ success: true, id: result._id });
    } catch (err) {
        console.error('[ComunidadRouter] Error saving wappystudio metrics:', err);
        return res.status(500).json({ error: 'Error al registrar métricas de empresa en WAPPY Studio.' });
    }
});

// 2. Consultar métricas de empresas desde /wappystudio (Solo Administradores, omite firmas)
router.get('/wappystudio/metrics', requireAdminCookieOrJwt, async (req, res) => {
    try {
        const studioList = await MatrizIpvrMetric.find({ source: 'wappystudio_live' })
            .sort({ updatedAt: -1 })
            .lean();

        const allCompanies = studioList.map((m) => ({
            ...m,
            _id: m._id.toString(),
        }));

        let totalWorkers = 0;
        let totalAudios = 0;
        let totalVideos = 0;
        const byRiskLevel = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0, 'Sin especificar': 0 };
        const byCompanySize = { 'Micro (1-10)': 0, 'Pequeña (11-50)': 0, 'Mediana (51-200)': 0, 'Grande (>200)': 0 };
        const sectorMap = {};

        for (const c of allCompanies) {
            const wc = Number(c.workerCount) || 0;
            totalWorkers += wc;
            totalAudios += Number(c.totalRisks) || 0;
            totalVideos += Number(c.highRisks) || 0;

            const rl = (c.riskLevel || '').toString().trim().toUpperCase();
            if (byRiskLevel[rl] !== undefined) {
                byRiskLevel[rl]++;
            } else {
                byRiskLevel['Sin especificar']++;
            }

            if (wc <= 10) byCompanySize['Micro (1-10)']++;
            else if (wc <= 50) byCompanySize['Pequeña (11-50)']++;
            else if (wc <= 200) byCompanySize['Mediana (51-200)']++;
            else byCompanySize['Grande (>200)']++;

            const sector = (c.economicActivity || c.companyType || 'General').trim();
            if (sector) {
                sectorMap[sector] = (sectorMap[sector] || 0) + 1;
            }
        }

        const topSectors = Object.entries(sectorMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        return res.json({
            success: true,
            stats: {
                totalCompanies: allCompanies.length,
                totalWorkers,
                totalAudios,
                totalVideos,
                totalRisks: totalAudios,
                totalHighRisks: totalVideos,
                byRiskLevel,
                byCompanySize,
                topSectors
            },
            companies: allCompanies
        });
    } catch (err) {
        console.error('[ComunidadRouter] Error fetching wappystudio metrics:', err);
        return res.status(500).json({ error: 'Error al consultar métricas de WAPPY Studio.' });
    }
});

// 3. Eliminar registro de métrica de WAPPY Studio (Solo Administrador)
router.delete('/wappystudio/metrics/:id', requireAdminCookieOrJwt, async (req, res) => {
    try {
        const { id } = req.params;
        await MatrizIpvrMetric.findByIdAndDelete(id);
        return res.json({ success: true, message: 'Registro de métrica eliminado.' });
    } catch (err) {
        console.error('[ComunidadRouter] Error deleting wappystudio metric:', err);
        return res.status(500).json({ error: 'Error al eliminar registro de métrica.' });
    }
});

module.exports = router;
