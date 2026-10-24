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

module.exports = router;
