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
            scope: 'wappy_apps_ig_follower_v2',
            verifiedAt: Date.now(),
        },
        IG_GATE_SECRET,
        { expiresIn: '365d' }
    );
}

function verifyIgPassToken(tokenStr) {
    if (!tokenStr || typeof tokenStr !== 'string') return null;
    try {
        const decoded = jwt.verify(tokenStr.trim(), IG_GATE_SECRET);
        if (decoded && decoded.scope === 'wappy_apps_ig_follower_v2') {
            return decoded;
        }
    } catch (e) {}
    return null;
}

function setIgPassCookie(res, passToken) {
    res.cookie('wappy_ig_follow_pass_v2', passToken, {
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

async function findSenderInZernioInbox({ zernioApiKey, zernioAccountId, digitsCode, normalizedCode }) {
    if (!zernioApiKey || !zernioAccountId || (!digitsCode && !normalizedCode)) return null;
    try {
        const now = Date.now();
        let conversations = zernioConvCache.list;
        if (now - zernioConvCache.ts > 2000 || !Array.isArray(conversations) || conversations.length === 0) {
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
        const candidateToken =
            req.query.ig_pass ||
            req.headers['x-wappy-ig-pass'] ||
            rawCookies.wappy_ig_follow_pass_v2 ||
            '';

        const decoded = verifyIgPassToken(candidateToken);
        if (decoded) {
            setIgPassCookie(res, candidateToken);
            return res.json({
                verified: true,
                username: decoded.username || 'wappy_ia_follower',
                name: decoded.name || null,
                passToken: candidateToken,
            });
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

            // 1. Coincidencia exacta por código de 4 dígitos (ej. WAPPY-4821 o 4821)
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

            // 2. Fallback: si el usuario acaba de escribir "WAPPY" o "APPS" o tocó el botón "✅ Ya sigo a @wappy_ia" en los últimos 3 minutos
            if (ageMs >= 0 && ageMs <= 3 * 60 * 1000) {
                if (
                    jobHash.name === 'process-postback' &&
                    String(jobData.payload || '').includes(OPENREPLY_AUTOMATION_ID)
                ) {
                    recentFallbackSenderId = senderId;
                } else if (
                    /wappy|apps|acceso|studio|matriz/i.test(rawText) &&
                    !recentFallbackSenderId
                ) {
                    recentFallbackSenderId = senderId;
                }
            }
        }

        let targetSenderId = matchedSenderId || recentFallbackSenderId;
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

        // Consultar en vivo a Zernio (App aprobada en Live Mode) y/o Meta Graph API v25.0 (is_user_follow_business)
        const [zernioCheck, metaCheck] = await Promise.all([
            zernioApiKey ? checkZernioFollowStatus(zernioApiKey, zernioAccountId, targetSenderId) : Promise.resolve(null),
            accessToken ? checkMetaFollowStatus(accessToken, targetSenderId) : Promise.resolve(null),
        ]);

        const effectiveFollow =
            typeof zernioCheck?.isFollower === 'boolean'
                ? zernioCheck.isFollower
                : typeof metaCheck?.isFollower === 'boolean'
                  ? metaCheck.isFollower
                  : null;

        const isConfirmedFollower =
            effectiveFollow === true ||
            (hasFollowUpJob > 0 && effectiveFollow !== false);

        const resolvedUsername =
            zernioCheck?.username ||
            metaCheck?.username ||
            matchedCommenterName ||
            'seguidor_wappy_ia';
        const resolvedName =
            zernioCheck?.name ||
            metaCheck?.name ||
            matchedCommenterName ||
            null;

        if (isConfirmedFollower) {
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

        // Si envió el DM pero Zernio/Meta confirma que AÚN NO sigue a @wappy_ia
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

module.exports = router;
