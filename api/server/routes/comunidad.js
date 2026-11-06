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
const ColmenaIntermediacionDeal = require('../../models/ColmenaIntermediacionDeal');

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

// =========================================================================
// INSTAGRAM FOLLOW GATE (WAPPY APPS + OPENREPLY @wappy_ia INTEGRATION)
// =========================================================================
const crypto = require('crypto');

const IG_GATE_SECRET = process.env.JWT_SECRET || 'wappy_ig_follow_gate_secret_2026';
const OPENREPLY_REDIS_URL = process.env.OPENREPLY_REDIS_URL || 'redis://librechat-openreply-g5vvst-redis-1:6379';
const OPENREPLY_ENC_KEY_HEX = process.env.OPENREPLY_ENCRYPTION_KEY || 'd94f27e57c61730bd7090b8f36a87c1265f24f0c79b1897e934a362f6b8c9d10';
const OPENREPLY_AUTOMATION_ID = 'wappyappsfollowgate2026';

let openReplyRedisClient = null;
function getOpenReplyRedis() {
    if (openReplyRedisClient) return openReplyRedisClient;
    try {
        const Redis = require('ioredis');
        openReplyRedisClient = new Redis(OPENREPLY_REDIS_URL, {
            connectTimeout: 2500,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
            lazyConnect: true,
        });
        openReplyRedisClient.on('error', () => {});
        return openReplyRedisClient;
    } catch (e) {
        return null;
    }
}

function decryptOpenReplyToken(encryptedBase64) {
    try {
        const key = Buffer.from(OPENREPLY_ENC_KEY_HEX, 'hex');
        const combined = Buffer.from(encryptedBase64.trim(), 'base64');
        const iv = combined.subarray(0, 16);
        const authTag = combined.subarray(16, 32);
        const ciphertext = combined.subarray(32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch (e) {
        return null;
    }
}

function signIgPassToken(payloadObj) {
    return jwt.sign(
        {
            ...payloadObj,
            scope: 'wappy_apps_ig_follower_v4',
            verifiedAt: Date.now(),
        },
        IG_GATE_SECRET,
        { expiresIn: '365d' }
    );
}

function verifyIgPassToken(tokenStr, minVerifiedAt = 0) {
    if (!tokenStr || typeof tokenStr !== 'string') return null;
    try {
        const decoded = jwt.verify(tokenStr.trim(), IG_GATE_SECRET);
        if (decoded && decoded.scope === 'wappy_apps_ig_follower_v4') {
            if (minVerifiedAt > 0 && Number(decoded.verifiedAt || 0) < minVerifiedAt) {
                return null;
            }
            return decoded;
        }
    } catch (e) {}
    return null;
}

function setIgPassCookie(res, passToken) {
    res.clearCookie('wappy_ig_follow_pass_v2', { path: '/' });
    res.clearCookie('wappy_ig_follow_pass_v3', { path: '/' });
    res.cookie('wappy_ig_follow_pass_v4', passToken, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
    });
}

async function checkMetaFollowStatus(accessToken, igScopedUserId) {
    if (!accessToken || !igScopedUserId) return null;
    try {
        const url = `https://graph.instagram.com/v25.0/${encodeURIComponent(igScopedUserId)}?fields=name,username,is_user_follow_business`;
        const resp = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: AbortSignal.timeout(5000),
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        return {
            isFollower: typeof data?.is_user_follow_business === 'boolean' ? data.is_user_follow_business : null,
            username: data?.username || null,
            name: data?.name || null,
        };
    } catch (e) {
        return null;
    }
}

async function resolveZernioConfig(redis) {
    let apiKey = process.env.ZERNIO_API_KEY || null;
    let accountId = process.env.ZERNIO_IG_ACCOUNT_ID || '6ae0f9d5dd9f4bc99becb39e';
    if (!apiKey && redis) {
        try {
            if (redis.status === 'wait') await redis.connect().catch(() => {});
            const enc = await redis.get('wappy:zernio:api_key_enc').catch(() => null);
            if (enc) {
                const dec = decryptOpenReplyToken(enc);
                if (dec) apiKey = dec;
            }
            const storedAcc = await redis.get('wappy:zernio:account_id').catch(() => null);
            if (storedAcc) accountId = storedAcc;
        } catch (e) {}
    }
    return { apiKey, accountId };
}

async function checkZernioFollowStatus(zernioApiKey, zernioAccountId, igScopedUserId) {
    if (!zernioApiKey || !zernioAccountId || !igScopedUserId) return null;
    try {
        const url = `https://zernio.com/api/v1/accounts/${encodeURIComponent(zernioAccountId)}/follow-status/${encodeURIComponent(igScopedUserId)}?refresh=true`;
        const resp = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${zernioApiKey}` },
            signal: AbortSignal.timeout(6000),
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        return {
            isFollower: typeof data?.isFollower === 'boolean' ? data.isFollower : null,
            username: data?.username || null,
            name: data?.name || null,
            followerCount: typeof data?.followerCount === 'number' ? data.followerCount : null,
            unavailableReason: data?.unavailableReason || null,
        };
    } catch (e) {
        return null;
    }
}

let zernioConvCache = { ts: 0, list: [] };
const REVOKED_OLD_CODES = new Set(['3659', '1863', '8705', '3642', '3519']);
const WAPPY_IG_BUSINESS_ID = '17841445043944381';

async function sendInstagramWelcomeDm({ redis, accessToken, zernioApiKey, zernioAccountId, recipientId, codeKey }) {
    if (!recipientId) return;
    try {
        // Esperar 1.5s por si el worker de OpenReply ya lo está enviando al mismo tiempo
        await new Promise((r) => setTimeout(r, 1500));
        if (redis) {
            const alreadyRevealed = await redis.get(`wappy:ig:reveal_sent:${recipientId}`).catch(() => null);
            if (alreadyRevealed) return;
            const lock = await redis.set(`wappy:ig:reveal_sent:${recipientId}`, '1', 'EX', 300, 'NX').catch(() => null);
            if (lock !== 'OK') return;
        }

        const welcomeText =
            '¡Acceso verificado! 🎉 Gracias por seguir a @wappy_ia. Toca el botón de abajo para entrar directo a los aplicativos de WAPPY Apps (si enviaste tu código desde computador, tu pantalla ya se desbloqueó automáticamente):';
        const webButtons = [
            {
                type: 'web_url',
                title: '🚀 Abrir WAPPY Apps',
                url: 'https://wappy.club/portal?view=apps&ig_verified=wappy_ig_ok',
            },
            {
                type: 'web_url',
                title: 'Ver Planes y Precios',
                url: 'https://wappy.club/planes',
            },
            {
                type: 'web_url',
                title: 'Hablar por WhatsApp',
                url: 'https://wa.me/573106415385?text=Hola%20WAPPY%20IA%2C%20vengo%20de%20Instagram%20%40wappy_ia%20y%20quiero%20conocer%20WAPPY%20Apps',
            },
        ];

        if (accessToken) {
            const metaResp = await fetch(`https://graph.instagram.com/v25.0/${WAPPY_IG_BUSINESS_ID}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    recipient: { id: String(recipientId) },
                    message: {
                        attachment: {
                            type: 'template',
                            payload: {
                                template_type: 'button',
                                text: welcomeText,
                                buttons: webButtons,
                            },
                        },
                    },
                }),
                signal: AbortSignal.timeout(6000),
            }).catch(() => null);
            if (metaResp && metaResp.ok) return;
        }

        if (zernioApiKey && zernioAccountId) {
            await fetch(`https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(recipientId)}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${zernioApiKey}`,
                },
                body: JSON.stringify({
                    accountId: zernioAccountId,
                    message: welcomeText,
                    buttons: webButtons.map((b) => ({ type: 'url', title: b.title, url: b.url })),
                }),
                signal: AbortSignal.timeout(6000),
            }).catch(() => null);
        }
    } catch (e) {}
}

async function sendInstagramStillNotFollowingDm({ redis, accessToken, zernioApiKey, zernioAccountId, recipientId }) {
    if (!recipientId) return;
    try {
        if (redis) {
            const recent = await redis.set(`wappy:ig:recheck_dm:${recipientId}`, '1', 'EX', 12, 'NX').catch(() => null);
            if (recent !== 'OK') return;
        }
        const promptText =
            '🔍 Ya verificamos tu cuenta y aún NO nos sigues en @wappy_ia. Por favor síguenos en @wappy_ia para ingresar a las WAPPY Apps y luego presiona el botón de abajo 👇';

        if (accessToken) {
            const metaResp = await fetch(`https://graph.instagram.com/v25.0/${WAPPY_IG_BUSINESS_ID}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    recipient: { id: String(recipientId) },
                    message: {
                        attachment: {
                            type: 'template',
                            payload: {
                                template_type: 'button',
                                text: promptText,
                                buttons: [
                                    {
                                        type: 'postback',
                                        title: '✅ Ya sigo a @wappy_ia'.slice(0, 20),
                                        payload: `followcheck:${OPENREPLY_AUTOMATION_ID}`,
                                    },
                                ],
                            },
                        },
                    },
                }),
                signal: AbortSignal.timeout(6000),
            }).catch(() => null);
            if (metaResp && metaResp.ok) return;
        }

        if (zernioApiKey && zernioAccountId) {
            await fetch(`https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(recipientId)}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${zernioApiKey}`,
                },
                body: JSON.stringify({
                    accountId: zernioAccountId,
                    message: promptText,
                    buttons: [
                        {
                            type: 'postback',
                            title: '✅ Ya sigo a @wappy_ia'.slice(0, 20),
                            payload: `followcheck:${OPENREPLY_AUTOMATION_ID}`,
                        },
                    ],
                }),
                signal: AbortSignal.timeout(6000),
            }).catch(() => null);
        }
    } catch (e) {}
}

async function findSenderInZernioInbox({ zernioApiKey, zernioAccountId, digitsCode, normalizedCode, forceRefresh = false }) {
    if (!zernioApiKey || !zernioAccountId || (!digitsCode && !normalizedCode)) return null;
    if (digitsCode && REVOKED_OLD_CODES.has(digitsCode)) return null;
    try {
        const now = Date.now();
        let conversations = zernioConvCache.list;
        if (forceRefresh || now - zernioConvCache.ts > 8000 || !Array.isArray(conversations) || conversations.length === 0) {
            const resp = await fetch(
                `https://zernio.com/api/v1/inbox/conversations?status=active&limit=15`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${zernioApiKey}` },
                    signal: AbortSignal.timeout(5500),
                }
            );
            if (resp.ok) {
                const json = await resp.json();
                conversations = Array.isArray(json?.data) ? json.data : [];
                zernioConvCache = { ts: now, list: conversations };
            }
        }

        const matchesCode = (text) => {
            const clean = String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!clean) return false;
            if (digitsCode && clean.includes(digitsCode)) return true;
            if (normalizedCode && normalizedCode.length >= 4 && clean.includes(normalizedCode)) return true;
            return false;
        };

        // 1. Revisar lastMessage directo en las conversaciones activas
        for (const conv of conversations) {
            if (!conv?.participantId) continue;
            if (matchesCode(conv.lastMessage)) {
                return {
                    senderId: String(conv.participantId),
                    username: conv.participantUsername || conv.participantName || null,
                };
            }
        }

        // 2. Si una conversación tuvo actividad reciente (últimos 20 min) pero el último mensaje fue la respuesta automática del bot,
        // inspeccionamos los últimos mensajes de esa conversación
        for (const conv of conversations.slice(0, 4)) {
            if (!conv?.id || !conv?.participantId) continue;
            const updatedMs = conv.updatedTime ? Date.parse(conv.updatedTime) : 0;
            if (updatedMs && now - updatedMs > 20 * 60 * 1000) continue;

            const msgResp = await fetch(
                `https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(conv.id)}/messages?accountId=${encodeURIComponent(zernioAccountId)}`,
                {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${zernioApiKey}` },
                    signal: AbortSignal.timeout(5000),
                }
            ).catch(() => null);

            if (msgResp && msgResp.ok) {
                const msgJson = await msgResp.json().catch(() => null);
                const msgs = Array.isArray(msgJson?.messages) ? msgJson.messages.slice(-8) : [];
                for (let i = msgs.length - 1; i >= 0; i--) {
                    const m = msgs[i];
                    if (m?.direction === 'incoming' && matchesCode(m.message)) {
                        return {
                            senderId: String(m.senderId || conv.participantId),
                            username: m.senderName || conv.participantUsername || conv.participantName || null,
                        };
                    }
                }
            }
        }
    } catch (e) {}
    return null;
}

async function fetchLiveMetaFollowersCount(accessToken) {
    if (!accessToken) return null;
    try {
        const resp = await fetch(
            `https://graph.instagram.com/v25.0/me?fields=id,username,followers_count&_t=${Date.now()}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Cache-Control': 'no-cache',
                },
                signal: AbortSignal.timeout(4500),
            }
        );
        if (!resp.ok) return null;
        const data = await resp.json();
        return typeof data?.followers_count === 'number' ? data.followers_count : null;
    } catch (e) {
        return null;
    }
}

// Watcher en memoria + Redis en el servidor (muestreo cada 1.5s mientras haya sesiones activas)
// Garantiza capturar tanto subidas (+1 de seguidores nuevos) como el ciclo Dejar de seguir (-1) -> Volver a seguir (+1)
// incluso cuando la pestaña del navegador está en segundo plano mientras el usuario está en la app de Instagram.
const activeIgSessions = new Map();
let igWatcherInterval = null;
let igWatcherRunning = false;

async function resolveCurrentIgAccessToken(redis) {
    try {
        if (redis) {
            if (redis.status === 'wait') await redis.connect().catch(() => {});
            const enc = await redis.get('wappy:ig:access_token_enc').catch(() => null);
            if (enc) {
                const dec = decryptOpenReplyToken(enc);
                if (dec) return dec;
            }
        }
    } catch (e) {}
    return process.env.INSTAGRAM_ACCESS_TOKEN || null;
}

async function updateBaselineWithCount(redis, codeKey, currentFollowers) {
    if (!codeKey || typeof currentFollowers !== 'number') {
        return {
            initialFollowers: currentFollowers,
            minFollowers: currentFollowers,
            sawUnfollowDip: false,
            verifiedDelta: false,
        };
    }

    const now = Date.now();
    const redisKey = `wappy:ig:baseline:${codeKey}`;
    let state = activeIgSessions.get(codeKey) || null;

    if (!state && redis) {
        try {
            const raw = await redis.get(redisKey);
            if (raw) state = JSON.parse(raw);
        } catch (e) {}
    }

    if (!state || typeof state.initialFollowers !== 'number') {
        state = {
            initialFollowers: currentFollowers,
            minFollowers: currentFollowers,
            sawUnfollowDip: false,
            verifiedDelta: false,
            verifiedAtFollowers: null,
            createdAt: now,
            updatedAt: now,
            expiresAt: now + 5 * 60 * 1000,
        };
    } else {
        let changed = false;
        if (currentFollowers < state.minFollowers) {
            state.minFollowers = currentFollowers;
            state.sawUnfollowDip = true;
            changed = true;
        }
        // Solo se marca verifiedDelta = true si el contador SUBIÓ respecto al mínimo observado
        // Y además es mayor o igual al contador inicial (para que dejar de seguir sin volver a seguir NUNCA desbloquee)
        if (
            currentFollowers > state.minFollowers &&
            currentFollowers >= state.initialFollowers
        ) {
            state.verifiedDelta = true;
            state.verifiedAtFollowers = currentFollowers;
            changed = true;
        }
        state.updatedAt = now;
        state.expiresAt = Math.max(state.expiresAt || 0, now + 3 * 60 * 1000);
        if (changed && redis) {
            await redis.set(redisKey, JSON.stringify(state), 'EX', 86400).catch(() => {});
        }
    }

    activeIgSessions.set(codeKey, state);
    if (redis) {
        await redis.set(redisKey, JSON.stringify(state), 'EX', 86400).catch(() => {});
    }
    startServerSideIgWatcher();
    return state;
}

function startServerSideIgWatcher() {
    if (igWatcherInterval) return;
    igWatcherInterval = setInterval(async () => {
        if (igWatcherRunning) return;
        const now = Date.now();
        for (const [key, sess] of activeIgSessions.entries()) {
            if (!sess || (sess.expiresAt && now > sess.expiresAt) || sess.verifiedDelta) {
                if (sess && sess.expiresAt && now > sess.expiresAt) {
                    activeIgSessions.delete(key);
                }
            }
        }
        const pendingKeys = Array.from(activeIgSessions.keys()).filter((k) => {
            const s = activeIgSessions.get(k);
            return s && !s.verifiedDelta && (!s.expiresAt || now <= s.expiresAt);
        });
        if (pendingKeys.length === 0) {
            clearInterval(igWatcherInterval);
            igWatcherInterval = null;
            return;
        }
        igWatcherRunning = true;
        try {
            const redis = getOpenReplyRedis();
            const accessToken = await resolveCurrentIgAccessToken(redis);
            const liveCount = await fetchLiveMetaFollowersCount(accessToken);
            if (typeof liveCount === 'number') {
                for (const codeKey of pendingKeys) {
                    await updateBaselineWithCount(redis, codeKey, liveCount);
                }
            }
        } catch (e) {
            // ignorar error transitorio
        } finally {
            igWatcherRunning = false;
        }
    }, 1500);
}

// 1. Consultar estado de verificación de seguidor de @wappy_ia
router.get('/ig-follow/status', async (req, res) => {
    try {
        const rawCookies = req.headers.cookie ? cookies.parse(req.headers.cookie) : {};
        res.clearCookie('wappy_ig_follow_pass_v2', { path: '/' });
        res.clearCookie('wappy_ig_follow_pass_v3', { path: '/' });
        const candidateToken =
            req.query.ig_pass ||
            req.headers['x-wappy-ig-pass'] ||
            rawCookies.wappy_ig_follow_pass_v4 ||
            '';

        const redis = getOpenReplyRedis();
        let minVerifiedAt = 0;
        if (redis) {
            try {
                if (redis.status === 'wait') await redis.connect().catch(() => {});
                const rawMin = await redis.get('wappy:ig:min_verified_at').catch(() => null);
                if (rawMin) minVerifiedAt = Number(rawMin) || 0;
            } catch (e) {}
        }

        const decoded = verifyIgPassToken(candidateToken, minVerifiedAt);
        if (decoded) {
            // Verificar en vivo si el usuario sigue siendo seguidor de @wappy_ia (si nos deja de seguir, se revoca el acceso de inmediato)
            if (decoded.igUserId && decoded.igUserId !== 'openreply_dm_link' && /^\d+$/.test(String(decoded.igUserId))) {
                try {
                    const { apiKey: zernioApiKey, accountId: zernioAccountId } = await resolveZernioConfig(redis);
                    const accessToken = await resolveCurrentIgAccessToken(redis);
                    const [zernioCheck, metaCheck] = await Promise.all([
                        zernioApiKey ? checkZernioFollowStatus(zernioApiKey, zernioAccountId, String(decoded.igUserId)) : Promise.resolve(null),
                        accessToken ? checkMetaFollowStatus(accessToken, String(decoded.igUserId)) : Promise.resolve(null),
                    ]);
                    const effectiveFollow =
                        typeof zernioCheck?.isFollower === 'boolean'
                            ? zernioCheck.isFollower
                            : typeof metaCheck?.isFollower === 'boolean'
                              ? metaCheck.isFollower
                              : null;

                    if (effectiveFollow === false) {
                        res.clearCookie('wappy_ig_follow_pass_v4', { path: '/' });
                        return res.json({
                            verified: false,
                            unfollowed: true,
                            username: decoded.username || null,
                            message: 'Detectamos que dejaste de seguir a @wappy_ia. Vuelve a seguirnos para reactivar tu acceso.',
                        });
                    }
                } catch (e) {}
            }

            setIgPassCookie(res, candidateToken);
            return res.json({
                verified: true,
                username: decoded.username || 'wappy_ia_follower',
                name: decoded.name || null,
                passToken: candidateToken,
            });
        }
        if (candidateToken) {
            res.clearCookie('wappy_ig_follow_pass_v4', { path: '/' });
        }

        // Si viene redirigido desde el botón de DM de OpenReply (/r/wappy-apps -> ?ig_verified=wappy_ig_ok)
        if (req.query.ig_verified === 'wappy_ig_ok') {
            const newPass = signIgPassToken({
                igUserId: 'openreply_dm_link',
                username: req.query.ig_user || 'seguidor_wappy_ia',
                source: 'openreply_tracked_link',
            });
            setIgPassCookie(res, newPass);
            return res.json({
                verified: true,
                username: req.query.ig_user || 'seguidor_wappy_ia',
                passToken: newPass,
            });
        }

        // Si el cliente envía su código de sesión al abrir el modal, registramos la línea base de seguidores de @wappy_ia
        const rawCode = String(req.query.code || '').trim();
        const digitsMatch = rawCode.match(/(\d{4})/);
        const codeKey = digitsMatch ? digitsMatch[1] : rawCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        let currentFollowers = null;
        let baselineFollowers = null;

        if (codeKey) {
            const redis = getOpenReplyRedis();
            try {
                const accessToken = await resolveCurrentIgAccessToken(redis);
                currentFollowers = await fetchLiveMetaFollowersCount(accessToken);
                if (typeof currentFollowers === 'number') {
                    const baseline = await updateBaselineWithCount(redis, codeKey, currentFollowers);
                    baselineFollowers = baseline.minFollowers;
                }
            } catch (e) {}
        }

        return res.json({
            verified: false,
            followersCount: currentFollowers,
            baselineFollowers,
        });
    } catch (err) {
        return res.json({ verified: false });
    }
});

// 2. Verificar en tiempo real contra OpenReply Redis + Meta Graph API si el usuario envió el DM y sigue a @wappy_ia
async function handleVerifyIgFollow(req, res) {
    try {
        const rawCode = String(req.query.code || req.body?.code || '').trim();
        const digitsMatch = rawCode.match(/(\d{4})/);
        const digitsCode = digitsMatch ? digitsMatch[1] : '';
        const normalizedCode = rawCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        const codeKey = digitsCode || normalizedCode || 'default';

        const redis = getOpenReplyRedis();
        if (!redis) {
            return res.json({
                verified: false,
                status: 'WAITING_DM',
                message: 'Esperando confirmación desde @wappy_ia en Instagram...',
            });
        }

        try {
            if (redis.status === 'wait') {
                await redis.connect();
            }
        } catch (e) {}

        // Obtener las últimas tareas de BullMQ en OpenReply
        const [completedIds, activeIds, waitIds, delayedIds, encryptedToken] = await Promise.all([
            redis.zrevrange('bull:dm-processing:completed', 0, 80).catch(() => []),
            redis.lrange('bull:dm-processing:active', 0, 20).catch(() => []),
            redis.lrange('bull:dm-processing:wait', 0, 20).catch(() => []),
            redis.zrevrange('bull:dm-processing:delayed', 0, 30).catch(() => []),
            redis.get('wappy:ig:access_token_enc').catch(() => null),
        ]);

        const allJobIds = Array.from(new Set([...activeIds, ...waitIds, ...delayedIds, ...completedIds]));
        let matchedSenderId = null;
        let matchedCommenterName = null;
        let recentFallbackSenderId = null;
        const nowMs = Date.now();

        for (const jobId of allJobIds) {
            if (!jobId) continue;
            const jobHash = await redis.hgetall(`bull:dm-processing:${jobId}`).catch(() => null);
            if (!jobHash || !jobHash.data) continue;

            let jobData = null;
            try {
                jobData = JSON.parse(jobHash.data);
            } catch (e) {
                continue;
            }

            const jobTs = Number(jobHash.timestamp) || 0;
            const ageMs = nowMs - jobTs;
            const rawText = String(jobData.messageText || jobData.commentText || '').trim();
            const cleanText = rawText.toLowerCase().replace(/[^a-z0-9]/g, '');
            const senderId = jobData.senderId || jobData.commenterId || jobData.userId || null;

            if (!senderId) continue;
            if (digitsCode && REVOKED_OLD_CODES.has(digitsCode)) continue;

            // Coincidencia exacta por el código único de 4 dígitos de este visitante (ej. WAPPY-4821 o 4821)
            if (digitsCode && cleanText.includes(digitsCode)) {
                matchedSenderId = senderId;
                matchedCommenterName = jobData.commenterName || null;
                break;
            }
            if (normalizedCode && normalizedCode.length >= 4 && cleanText.includes(normalizedCode)) {
                matchedSenderId = senderId;
                matchedCommenterName = jobData.commenterName || null;
                break;
            }
        }

        let targetSenderId = matchedSenderId;
        const accessToken =
            (encryptedToken ? decryptOpenReplyToken(encryptedToken) : null) ||
            process.env.INSTAGRAM_ACCESS_TOKEN ||
            null;
        const { apiKey: zernioApiKey, accountId: zernioAccountId } = await resolveZernioConfig(redis);

        // Si el código aún no llegó por el webhook de BullMQ, consultamos la bandeja en vivo de Zernio
        if (!targetSenderId && zernioApiKey) {
            const zernioMatch = await findSenderInZernioInbox({
                zernioApiKey,
                zernioAccountId,
                digitsCode,
                normalizedCode,
                forceRefresh: String(req.query.explicit || '') === '1',
            });
            if (zernioMatch?.senderId) {
                targetSenderId = zernioMatch.senderId;
                if (zernioMatch.username && !matchedCommenterName) {
                    matchedCommenterName = zernioMatch.username;
                }
            }
        }

        if (!targetSenderId) {
            return res.json({
                verified: false,
                status: 'WAITING_DM',
                message: `Envía tu código ${rawCode || 'WAPPY'} por mensaje directo (DM) a @wappy_ia y sigue la cuenta para desbloquear.`,
            });
        }

        // Comprobar si OpenReply ya aprobó el follow gate (crea el job followup_<automationId>_<senderId>)
        const followUpKey = `bull:dm-processing:followup_${OPENREPLY_AUTOMATION_ID}_${targetSenderId}`;
        const hasFollowUpJob = await redis.exists(followUpKey).catch(() => 0);

        // Consultar primero Meta Graph API v25.0 (is_user_follow_business, sin límite de 10 req/min)
        // y respaldar con Zernio sólo si Meta no devuelve booleano o si es clic explícito
        const isExplicitClick = String(req.query.explicit || '') === '1';
        const metaCheck = accessToken ? await checkMetaFollowStatus(accessToken, targetSenderId) : null;
        const zernioCheck =
            zernioApiKey && (typeof metaCheck?.isFollower !== 'boolean' || isExplicitClick)
                ? await checkZernioFollowStatus(zernioApiKey, zernioAccountId, targetSenderId)
                : null;

        const effectiveFollow =
            typeof metaCheck?.isFollower === 'boolean'
                ? metaCheck.isFollower
                : typeof zernioCheck?.isFollower === 'boolean'
                  ? zernioCheck.isFollower
                  : null;

        const isConfirmedFollower =
            effectiveFollow === true ||
            (hasFollowUpJob > 0 && effectiveFollow !== false);

        const resolvedUsername =
            metaCheck?.username ||
            zernioCheck?.username ||
            matchedCommenterName ||
            'seguidor_wappy_ia';
        const resolvedName =
            metaCheck?.name ||
            zernioCheck?.name ||
            matchedCommenterName ||
            null;

        if (isConfirmedFollower) {
            // Garantizar que al activarse la página SIEMPRE le llegue el mensaje de bienvenida con los 3 botones en Instagram DM
            sendInstagramWelcomeDm({
                redis,
                accessToken,
                zernioApiKey,
                zernioAccountId,
                recipientId: targetSenderId,
                codeKey,
            }).catch(() => {});

            const passToken = signIgPassToken({
                igUserId: targetSenderId,
                username: resolvedUsername,
                name: resolvedName,
                code: rawCode || 'DM',
            });
            setIgPassCookie(res, passToken);
            return res.json({
                verified: true,
                status: 'FOLLOWING',
                igUserId: targetSenderId,
                username: resolvedUsername,
                name: resolvedName,
                passToken,
                message: `¡Verificación exitosa! Gracias por seguir a @wappy_ia${resolvedUsername ? ` (@${resolvedUsername})` : ''}.`,
            });
        }

        // Si el usuario pulsó explícitamente "Ya seguí a @wappy_ia" pero sigue sin seguirnos, enviamos el mensaje de verificación fallida tanto en el modal como en el DM
        if (isExplicitClick) {
            sendInstagramStillNotFollowingDm({
                redis,
                accessToken,
                zernioApiKey,
                zernioAccountId,
                recipientId: targetSenderId,
            }).catch(() => {});

            return res.json({
                verified: false,
                status: 'DM_RECEIVED_NOT_FOLLOWING',
                username: resolvedUsername,
                message:
                    `🔍 Ya verificamos tu cuenta${resolvedUsername ? ` (@${resolvedUsername})` : ''} y aún NO nos sigues en @wappy_ia. ` +
                    `Por favor síguenos en @wappy_ia para poder ingresar a las WAPPY Apps.`,
            });
        }

        // Si envió el DM pero Zernio/Meta confirma que AÚN NO sigue a @wappy_ia (sondeo inicial automático)
        return res.json({
            verified: false,
            status: 'DM_RECEIVED_NOT_FOLLOWING',
            username: resolvedUsername,
            message:
                `📩 ¡Recibimos tu código en Instagram${resolvedUsername ? ` desde @${resolvedUsername}` : ''}! ` +
                `Pero aún NO sigues a @wappy_ia. Toca el botón "Seguir" en nuestro perfil (@wappy_ia) y se desbloqueará al instante.`,
        });
    } catch (err) {
        console.error('[ComunidadRouter] Error verifying IG follow:', err);
        return res.status(500).json({
            verified: false,
            status: 'ERROR',
            message: 'No se pudo consultar el estado en este momento. Intenta nuevamente.',
        });
    }
}

router.get('/ig-follow/verify', handleVerifyIgFollow);
router.post('/ig-follow/verify', handleVerifyIgFollow);

// ============================================================================
// WAPPY ARL COLMENA · MOTOR DE INTERMEDIACIÓN & VENTA PROACTIVA CPS-A-26 V16
// (Exclusivo para Administradores de WAPPY LTDA)
// ============================================================================

let cachedColmenaDataset = null;
function loadColmenaDataset() {
    if (cachedColmenaDataset) {
        return cachedColmenaDataset;
    }
    try {
        const datasetPath = path.resolve(__dirname, '../data/colmenaProactiva2026.json');
        if (fs.existsSync(datasetPath)) {
            cachedColmenaDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
            return cachedColmenaDataset;
        }
    } catch (err) {
        console.error('[WappyColmena] Error cargando colmenaProactiva2026.json:', err.message);
    }
    return { version: 'CPS-A-26 V16 (2026)', activities: [], occupations: [], stats: {} };
}

const ARL_RATES_BY_CLASE = {
    1: 0.00522,
    2: 0.01044,
    3: 0.02436,
    4: 0.04350,
    5: 0.06960,
};

function parseRomanOrDigitRisk(val) {
    const s = String(val || '').trim().toUpperCase();
    if (s === 'V' || s === '5' || s.includes('CLASE V') || s.includes('NIVEL V') || s.includes('5')) return 5;
    if (s === 'IV' || s === '4' || s.includes('CLASE IV') || s.includes('NIVEL IV') || s.includes('4')) return 4;
    if (s === 'III' || s === '3' || s.includes('CLASE III') || s.includes('NIVEL III') || s.includes('3')) return 3;
    if (s === 'II' || s === '2' || s.includes('CLASE II') || s.includes('NIVEL II') || s.includes('2')) return 2;
    return 1;
}

function matchCompanyToColmenaCPS(company, dataset) {
    const activities = Array.isArray(dataset?.activities) ? dataset.activities : [];
    const rawCiiu = String(company.ciiu || '').trim();
    const rawAct = String(company.economicActivity || company.sector || '').trim();
    const combined = `${rawCiiu} ${rawAct}`;

    // 1. Buscar código Decreto 768 exacto de 7 dígitos
    const match7 = combined.match(/\b([1-5]\d{6})\b/);
    if (match7) {
        const exact7 = activities.find((a) => a.cod768 === match7[1]);
        if (exact7) return exact7;
    }

    // 2. Buscar código CIIU de 4 dígitos
    const match4 = combined.match(/\b(\d{4})\b/);
    if (match4) {
        const ciiu4 = match4[1];
        const byCiiu = activities.filter((a) => a.ciiu === ciiu4);
        if (byCiiu.length > 0) {
            const plena = byCiiu.find((a) => a.nivel === 'Autorización Plena');
            return plena || byCiiu[0];
        }
    }

    // 3. Buscar por coincidencia semántica en descripción / grupo / sector
    const riskHint = parseRomanOrDigitRisk(company.riskLevel);
    const words = rawAct
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 4);

    if (words.length > 0) {
        let best = null;
        let bestScore = 0;
        for (const a of activities) {
            const hay = `${a.descripcion} ${a.grupo} ${a.division} ${a.sector}`
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
            let score = 0;
            for (const w of words) {
                if (hay.includes(w)) score += 2;
            }
            if (score > 0 && a.clase === riskHint) score += 2;
            if (score > 0 && a.nivel === 'Autorización Plena') score += 1;
            if (score > bestScore) {
                bestScore = score;
                best = a;
            }
        }
        if (best) return best;
    }

    // Fallback por clase de riesgo hacia actividad empresarial/consultoría estándar
    const defaultByClase =
        activities.find((a) => a.clase === riskHint && a.nivel === 'Autorización Plena') ||
        activities[0] ||
        null;
    return defaultByClase;
}

// 1. Obtener Dataset completo CPS-A-26 V16 (1.104 actividades + 322 ocupaciones)
router.get('/wappycolmena/dataset', requireAdminCookieOrJwt, async (req, res) => {
    try {
        const dataset = loadColmenaDataset();
        return res.json({ success: true, ...dataset });
    } catch (err) {
        console.error('[WappyColmena] Error en /dataset:', err);
        return res.status(500).json({ error: 'Error cargando matriz CPS-A-26 V16.' });
    }
});

// 2. Radar de Prospectos Internos (Cruce automático de Somos SST + Matriz IPVR + Wappy Studio contra CPS-A-26 V16)
router.get('/wappycolmena/radar', requireAdminCookieOrJwt, async (req, res) => {
    try {
        const dataset = loadColmenaDataset();
        const [sgsstCompanies, ipvrMetrics] = await Promise.all([
            CompanyInfo.find({ companyName: { $ne: '' } }).sort({ updatedAt: -1 }).lean(),
            MatrizIpvrMetric.find({ companyName: { $ne: '' } }).sort({ updatedAt: -1 }).lean(),
        ]);

        const mapByKey = new Map();
        const DEFAULT_IBC = 1750905;

        const ingestRecord = (rec, originLabel) => {
            const name = (rec.companyName || '').trim();
            if (!name || name.toLowerCase() === 'empresa sin nombre') return;
            const nitClean = String(rec.nit || '').replace(/[^0-9]/g, '').slice(0, 9);
            const key = nitClean || name.toLowerCase();

            const existing = mapByKey.get(key);
            const workerCount = Math.max(Number(rec.workerCount) || 0, existing?.workerCount || 1);

            const matched = matchCompanyToColmenaCPS(
                {
                    ciiu: rec.ciiu || existing?.ciiu || '',
                    economicActivity: rec.economicActivity || rec.sector || existing?.economicActivity || '',
                    riskLevel: rec.riskLevel || existing?.riskLevel || '',
                },
                dataset,
            );

            const clase = matched?.clase || parseRomanOrDigitRisk(rec.riskLevel || existing?.riskLevel);
            const rate = ARL_RATES_BY_CLASE[clase] || 0.00522;
            const monthlyPrima = Math.round(workerCount * DEFAULT_IBC * rate);
            const annualPrima = monthlyPrima * 12;
            const minPrima = matched?.minPrima || 0;
            const meetsMinPrima = minPrima === 0 || annualPrima >= minPrima || monthlyPrima >= minPrima;

            mapByKey.set(key, {
                key,
                sourceId: (rec._id || '').toString(),
                companyName: name,
                nit: rec.nit || existing?.nit || '',
                legalRepresentative: rec.legalRepresentative || existing?.legalRepresentative || '',
                legalRepresentativeId: rec.legalRepresentativeId || existing?.legalRepresentativeId || '',
                workerCount,
                currentArl: rec.arl || existing?.currentArl || 'Por confirmar',
                city: rec.city || existing?.city || '',
                address: rec.address || existing?.address || '',
                phone: rec.phone || existing?.phone || '',
                email: rec.email || existing?.email || '',
                responsibleSST: rec.responsibleSST || existing?.responsibleSST || '',
                rawCiiu: rec.ciiu || existing?.rawCiiu || '',
                rawEconomicActivity: rec.economicActivity || rec.sector || existing?.rawEconomicActivity || '',
                origin: existing && existing.origin !== originLabel ? `${existing.origin} + ${originLabel}` : originLabel,
                cpsMatch: matched
                    ? {
                          cod768: matched.cod768,
                          ciiu: matched.ciiu,
                          clase: matched.clase,
                          descripcion: matched.descripcion,
                          nicho: matched.nicho,
                          nivel: matched.nivel,
                          excepcion: matched.excepcion,
                          minPrima: matched.minPrima,
                          plenaAlternatesInCiiu: matched.plenaAlternatesInCiiu || [],
                      }
                    : null,
                monthlyPrima,
                annualPrima,
                meetsMinPrima,
                estimatedAnnualCommission10: Math.round(annualPrima * 0.1),
                updatedAt: rec.updatedAt || existing?.updatedAt || new Date(),
            });
        };

        for (const c of sgsstCompanies) ingestRecord(c, 'Somos SST');
        for (const m of ipvrMetrics) {
            ingestRecord(m, m.source === 'wappystudio_live' ? 'Wappy Studio' : 'Matriz IPVR');
        }

        const prospects = Array.from(mapByKey.values()).sort((a, b) => {
            const aPlena = a.cpsMatch?.nivel === 'Autorización Plena' ? 1 : 0;
            const bPlena = b.cpsMatch?.nivel === 'Autorización Plena' ? 1 : 0;
            if (aPlena !== bPlena) return bPlena - aPlena;
            return b.annualPrima - a.annualPrima;
        });

        return res.json({
            success: true,
            totalProspects: prospects.length,
            plenaCount: prospects.filter((p) => p.cpsMatch?.nivel === 'Autorización Plena').length,
            totalPotentialAnnualPrima: prospects.reduce((acc, p) => acc + (p.annualPrima || 0), 0),
            prospects,
        });
    } catch (err) {
        console.error('[WappyColmena] Error en /radar:', err);
        return res.status(500).json({ error: 'Error cruzando radar de prospectos.' });
    }
});

// 3. Listar Negocios / Pipeline CRM de Intermediación WAPPY LTDA
router.get('/wappycolmena/deals', requireAdminCookieOrJwt, async (req, res) => {
    try {
        const deals = await ColmenaIntermediacionDeal.find({}).sort({ updatedAt: -1 }).lean();
        return res.json({
            success: true,
            deals: deals.map((d) => ({ ...d, _id: d._id.toString() })),
        });
    } catch (err) {
        console.error('[WappyColmena] Error listando deals:', err);
        return res.status(500).json({ error: 'Error consultando pipeline de intermediación.' });
    }
});

// 4. Crear o Actualizar Negocio de Intermediación
router.post('/wappycolmena/deals', requireAdminCookieOrJwt, async (req, res) => {
    try {
        const body = req.body || {};
        const companyName = String(body.companyName || '').trim();
        if (!companyName) {
            return res.status(400).json({ error: 'La Razón Social de la empresa es obligatoria.' });
        }

        const updatePayload = {
            companyName,
            nit: String(body.nit || '').trim(),
            legalRepresentative: String(body.legalRepresentative || '').trim(),
            legalRepresentativeId: String(body.legalRepresentativeId || '').trim(),
            city: String(body.city || '').trim(),
            address: String(body.address || '').trim(),
            phone: String(body.phone || '').trim(),
            email: String(body.email || '').trim(),
            responsibleSST: String(body.responsibleSST || '').trim(),
            currentArl: String(body.currentArl || 'SURA').trim(),
            targetType: body.targetType === 'VOLUNTARIO' ? 'VOLUNTARIO' : 'EMPRESA',
            ciiu: String(body.ciiu || '').trim(),
            cod768: String(body.cod768 || '').trim(),
            claseRiesgo: Number(body.claseRiesgo) || 1,
            descripcionActividad: String(body.descripcionActividad || '').trim(),
            nicho2026: String(body.nicho2026 || 'Otras Actividades').trim(),
            nivelAutorizacion: String(body.nivelAutorizacion || 'Autorización Plena').trim(),
            excepcionPrima: String(body.excepcionPrima || '').trim(),
            minPrimaRequerida: Number(body.minPrimaRequerida) || 0,
            workerCount: Number(body.workerCount) || 1,
            avgIbc: Number(body.avgIbc) || 1750905,
            centers: Array.isArray(body.centers) ? body.centers : [],
            monthlyPrimaColmena: Number(body.monthlyPrimaColmena) || 0,
            annualPrimaColmena: Number(body.annualPrimaColmena) || 0,
            meetsMinPrimaRule: body.meetsMinPrimaRule !== false,
            commissionPct: Number(body.commissionPct) || 10,
            estimatedMonthlyCommission: Number(body.estimatedMonthlyCommission) || 0,
            estimatedAnnualCommission: Number(body.estimatedAnnualCommission) || 0,
            reinvestmentSstPct: Number(body.reinvestmentSstPct) || 20,
            estimatedReinvestmentSst: Number(body.estimatedReinvestmentSst) || 0,
            stage: body.stage || 'PROSPECTO',
            sourceOrigin: body.sourceOrigin || 'MANUAL',
            notes: String(body.notes || ''),
            aiProposalHtml: body.aiProposalHtml || '',
            aiTechnicalSheetHtml: body.aiTechnicalSheetHtml || '',
            aiBrokerLetterHtml: body.aiBrokerLetterHtml || '',
            createdBy: req.user?.email || 'admin@wappy.club',
        };

        let saved;
        if (body._id) {
            saved = await ColmenaIntermediacionDeal.findByIdAndUpdate(
                body._id,
                { $set: updatePayload },
                { new: true, upsert: true },
            );
        } else {
            const query = updatePayload.nit
                ? { nit: updatePayload.nit, companyName }
                : { companyName };
            saved = await ColmenaIntermediacionDeal.findOneAndUpdate(
                query,
                { $set: updatePayload },
                { new: true, upsert: true, setDefaultsOnInsert: true },
            );
        }

        return res.json({
            success: true,
            deal: { ...saved.toObject(), _id: saved._id.toString() },
        });
    } catch (err) {
        console.error('[WappyColmena] Error guardando deal:', err);
        return res.status(500).json({ error: 'Error al guardar gestión de intermediación.' });
    }
});

// 5. Eliminar Negocio del Pipeline
router.delete('/wappycolmena/deals/:id', requireAdminCookieOrJwt, async (req, res) => {
    try {
        await ColmenaIntermediacionDeal.findByIdAndDelete(req.params.id);
        return res.json({ success: true });
    } catch (err) {
        console.error('[WappyColmena] Error eliminando deal:', err);
        return res.status(500).json({ error: 'Error eliminando registro.' });
    }
});

// 6. Generador IA de Documentos Ejecutivos para Intermediación WAPPY LTDA × ARL Colmena
router.post('/wappycolmena/ai-generate', requireAdminCookieOrJwt, async (req, res) => {
    try {
        const { docType, dealData, customApiKey } = req.body || {};
        const d = dealData || {};
        const sysKeys = (process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY || '')
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
        const apiKey = (customApiKey || '').trim() || sysKeys[0] || '';

        const promptByType = {
            propuesta: `Actúa como Director del Área de Intermediación de Seguros de Riesgos Laborales de WAPPY LTDA (Somos SST) aliado de ARL Colmena Seguros.
Redacta en HTML limpio (solo etiquetas semánticas <h3>, <p>, <ul>, <li>, <table>, <strong>, sin bloques markdown \`\`\`) una PROPUESTA EJECUTIVA DE VALOR COMERCIAL Y TÉCNICA dirigida a la empresa "${d.companyName || 'Empresa Prospecto'}" (NIT: ${d.nit || 'N/A'}, Rep. Legal: ${d.legalRepresentative || 'Representante Legal'}, Ciudad: ${d.city || 'Colombia'}, ARL Actual: ${d.currentArl || 'Otra ARL'}).
Datos técnicos CPS-A-26 V16 (2026):
- Código Decreto 768: ${d.cod768 || 'N/A'} (CIIU ${d.ciiu || 'N/A'}) - Clase de Riesgo ${d.claseRiesgo || 1}
- Actividad: ${d.descripcionActividad || 'N/A'}
- Nicho Estratégico Colmena 2026: ${d.nicho2026 || 'General'}
- Nivel de Autorización CPS-A-26 V16: ${d.nivelAutorizacion || 'Autorización Plena'}
- N° Trabajadores: ${d.workerCount || 10} | Prima Mensual Estimada ARL: $${Number(d.monthlyPrimaColmena || 0).toLocaleString('es-CO')} COP | Prima Anual: $${Number(d.annualPrimaColmena || 0).toLocaleString('es-CO')} COP
- Presupuesto de Reinversión Preventiva SST estimado: $${Number(d.estimatedReinvestmentSst || 0).toLocaleString('es-CO')} COP/año.
Incluye: 1) Resumen Ejecutivo de la Alianza WAPPY LTDA + ARL Colmena Seguros; 2) Diagnóstico Tarifario y Clasificación Decreto 768 de 2022; 3) Beneficios Exclusivos Sin Costo Adicional al nombrar a WAPPY LTDA como Intermediario (Ecosistema WAPPY IA con +30 módulos de los 8 Hitos SG-SST, Agentes IA Especialistas, Auditoría Resolución 0312 de 2019 y Decreto 1072 de 2015, y Gestión de Reinversión ante ARL Colmena); 4) Cronograma de Transición / Afiliación en 4 pasos sin traumatismos operativos.`,

            ficha_suscripcion: `Actúa como Director Técnico de Suscripción ARL de WAPPY LTDA presentando un caso de Venta Proactiva ante la Gerencia Comercial / Suscripción de ARL Colmena Seguros bajo el instructivo oficial CPS-A-26 V16 (2026).
Redacta en HTML limpio (solo etiquetas <h3>, <p>, <ul>, <li>, <table>, <strong>, sin bloques markdown) el CONCEPTO TÉCNICO DE VIABILIDAD Y SUSCRIPCIÓN CPS-A-26 V16 para:
- Razón Social: ${d.companyName || 'Empresa'} (NIT: ${d.nit || 'N/A'})
- Código Decreto 768: ${d.cod768 || 'N/A'} | CIIU V4: ${d.ciiu || 'N/A'} | Clase de Riesgo: ${d.claseRiesgo || 1}
- Descripción Decreto 768: ${d.descripcionActividad || 'N/A'}
- Nicho Colmena 2026: ${d.nicho2026 || 'Otras Actividades'} | Nivel Autorización CPS-A-26 V16: ${d.nivelAutorizacion || 'Autorización Plena'}
- Regla de Excepción Prima Mínima: ${d.excepcionPrima || 'Sin restricción de prima mínima'} (${d.meetsMinPrimaRule ? 'CUMPLE REGLA DE PRIMA' : 'REQUIERE VALIDACIÓN DE PRIMA'})
- Masa Salarial / Trabajadores: ${d.workerCount || 10} trabajadores | Prima Mensual: $${Number(d.monthlyPrimaColmena || 0).toLocaleString('es-CO')} COP | Prima Anual: $${Number(d.annualPrimaColmena || 0).toLocaleString('es-CO')} COP.
Incluye justificación de control de siniestralidad apalancada en el monitoreo continuo con WAPPY IA (Matriz GTC 45 en vivo, control de actos/condiciones inseguras y cumplimiento Resolución 0312/2019) para avalar su suscripción inmediata en ARL Colmena.`,
        };

        const selectedPrompt = promptByType[docType] || promptByType.propuesta;
        const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];

        if (apiKey) {
            for (const modelId of modelsToTry) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: selectedPrompt }] }],
                            generationConfig: { temperature: 0.35, maxOutputTokens: 2048 },
                        }),
                    });
                    if (resp.ok) {
                        const json = await resp.json();
                        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (text.trim()) {
                            const cleanHtml = text
                                .replace(/^```html\s*/i, '')
                                .replace(/^```\s*/i, '')
                                .replace(/```\s*$/i, '')
                                .trim();
                            return res.json({ success: true, html: cleanHtml, modelUsed: modelId });
                        }
                    }
                } catch (_e) {}
            }
        }

        return res.json({
            success: true,
            html: '',
            fallback: true,
            message: 'Usando plantilla determinista de alta precisión WAPPY LTDA.',
        });
    } catch (err) {
        console.error('[WappyColmena] Error en /ai-generate:', err);
        return res.status(500).json({ error: 'Error generando documento.' });
    }
});

module.exports = router;
