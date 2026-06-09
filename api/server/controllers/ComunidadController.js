const mongoose = require('mongoose');
const crypto = require('crypto');
const axios = require('axios');
const ComunidadConfig = require('../../models/ComunidadConfig');
const ComunidadPurchase = require('../../models/ComunidadPurchase');
const { Lead } = require('../../models/Lead');
const ComunidadSession = require('../../models/ComunidadSession');
const { logger } = require('@librechat/data-schemas');

const getFunnelQuery = (req) => {
    const funnelKey = req.query.funnelKey || req.body.funnelKey || 'comunidad';
    if (funnelKey === 'comunidad') {
        return { $or: [{ funnelKey: 'comunidad' }, { funnelKey: { $exists: false } }] };
    }
    return { funnelKey };
};

const getComunidadConfig = async (req, res) => {
    try {
        const query = getFunnelQuery(req);
        let config = await ComunidadConfig.findOne(query);
        if (!config) {
            const funnelKey = req.query.funnelKey || req.body.funnelKey || 'comunidad';
            config = new ComunidadConfig({
                funnelKey,
                isGlobalSetting: true,
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                requiresPayment: false,
                price: 0,
                gatingSeconds: 120,
                gatingEnabled: true,
                downloadableFiles: [],
                whatsappUrl: 'https://chat.whatsapp.com/GDoaMdEN5m5GhogIL7TGhy?s=cl&p=i&ilr=4',
                extraVideoUrl1: '',
                extraVideoTitle1: 'Clase Extra 1',
                extraVideoUrl2: '',
                extraVideoTitle2: 'Clase Extra 2'
            });
            await config.save();
        }
        return res.json(config);
    } catch (err) {
        logger.error('[ComunidadController] getComunidadConfig error:', err);
        return res.status(500).json({ error: 'Error al obtener la configuración de la comunidad.' });
    }
};

const updateComunidadConfig = async (req, res) => {
    try {
        const { 
            videoUrl, requiresPayment, price, gatingSeconds, gatingEnabled, downloadableFiles,
            whatsappUrl, extraVideoUrl1, extraVideoTitle1, extraVideoUrl2, extraVideoTitle2,
            funnelKey = 'comunidad'
        } = req.body;
        
        const query = getFunnelQuery(req);
        let config = await ComunidadConfig.findOne(query);
        if (!config) {
            config = new ComunidadConfig({ funnelKey, isGlobalSetting: true });
        }

        if (videoUrl !== undefined) config.videoUrl = videoUrl;
        if (requiresPayment !== undefined) config.requiresPayment = requiresPayment;
        if (price !== undefined) config.price = Number(price) || 0;
        if (gatingSeconds !== undefined) config.gatingSeconds = Number(gatingSeconds) || 120;
        if (gatingEnabled !== undefined) config.gatingEnabled = gatingEnabled;
        if (downloadableFiles !== undefined) config.downloadableFiles = downloadableFiles;
        if (whatsappUrl !== undefined) config.whatsappUrl = whatsappUrl;
        if (extraVideoUrl1 !== undefined) config.extraVideoUrl1 = extraVideoUrl1;
        if (extraVideoTitle1 !== undefined) config.extraVideoTitle1 = extraVideoTitle1;
        if (extraVideoUrl2 !== undefined) config.extraVideoUrl2 = extraVideoUrl2;
        if (extraVideoTitle2 !== undefined) config.extraVideoTitle2 = extraVideoTitle2;

        await config.save();
        return res.json({ success: true, config });
    } catch (err) {
        logger.error('[ComunidadController] updateComunidadConfig error:', err);
        return res.status(500).json({ error: 'Error al actualizar la configuración.' });
    }
};

const createComunidadCheckout = async (req, res) => {
    try {
        const { fullName, email, phone, funnelKey = 'comunidad' } = req.body;
        if (!fullName || !email || !phone) {
            return res.status(400).json({ error: 'Todos los campos (nombre, correo, celular) son obligatorios.' });
        }

        try {
            const leadQuery = funnelKey === 'comunidad'
                ? { email: email.toLowerCase().trim(), $or: [{ funnelKey: 'comunidad' }, { funnelKey: { $exists: false } }] }
                : { email: email.toLowerCase().trim(), funnelKey };
            const existingLead = await Lead.findOne(leadQuery);
            if (!existingLead) {
                const newLead = new Lead({
                    fullName: fullName.trim(),
                    email: email.toLowerCase().trim(),
                    phone: phone.trim(),
                    funnelKey
                });
                await newLead.save();
            }
        } catch (leadErr) {
            logger.error('[ComunidadController] Error registering lead:', leadErr);
        }

        const purchaseQuery = funnelKey === 'comunidad'
            ? { email: email.toLowerCase().trim(), $or: [{ funnelKey: 'comunidad' }, { funnelKey: { $exists: false } }] }
            : { email: email.toLowerCase().trim(), funnelKey };
        let purchase = await ComunidadPurchase.findOne(purchaseQuery);
        
        if (purchase && purchase.isPaid) {
            return res.json({ 
                alreadyPaid: true, 
                message: 'Ya has realizado el pago para este curso. ¡Acceso concedido!',
                fullName: purchase.fullName,
                phone: purchase.phone,
                videoWatched: purchase.videoWatched
            });
        }

        if (!purchase) {
            purchase = new ComunidadPurchase({
                fullName: fullName.trim(),
                email: email.toLowerCase().trim(),
                phone: phone.trim(),
                isPaid: false,
                funnelKey
            });
        } else {
            purchase.fullName = fullName.trim();
            purchase.phone = phone.trim();
        }

        const configQuery = funnelKey === 'comunidad'
            ? { $or: [{ funnelKey: 'comunidad' }, { funnelKey: { $exists: false } }] }
            : { funnelKey };
        const config = await ComunidadConfig.findOne(configQuery);
        const price = config ? config.price : 0;
        const requiresPayment = config ? config.requiresPayment : false;

        if (!requiresPayment || price <= 0) {
            purchase.isPaid = true;
            purchase.status = 'APPROVED';
            await purchase.save();
            return res.json({ freeAccess: true });
        }

        const amountInCents = Math.round(price * 100);
        const prefix = funnelKey === 'wappyvital' ? 'WAP-VIT' : 'WAP-COM';
        const reference = `${prefix}-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-6)}`;

        purchase.wompiReference = reference;
        purchase.amountInCents = amountInCents;
        purchase.status = 'PENDING';
        await purchase.save();

        const publicKey = process.env.WOMPI_PUBLIC_KEY;
        if (!publicKey) {
            throw new Error('WOMPI_PUBLIC_KEY no configurada en las variables de entorno');
        }

        const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
        let signature = '';
        if (integritySecret) {
            const stringToSign = `${reference}${amountInCents}COP${integritySecret}`;
            signature = crypto.createHash('sha256').update(stringToSign, 'utf-8').digest('hex');
        }

        return res.json({
            publicKey,
            reference,
            amountInCents,
            currency: 'COP',
            signature
        });
    } catch (err) {
        logger.error('[ComunidadController] createComunidadCheckout error:', err);
        return res.status(500).json({ error: 'Error al iniciar el pago con Wompi.', details: err.message });
    }
};

const verifyComunidadTransaction = async (req, res) => {
    try {
        const { transactionId } = req.body;
        if (!transactionId) return res.status(400).json({ error: 'Falta ID de transacción' });

        const isSandbox = process.env.WOMPI_PUBLIC_KEY?.startsWith('pub_test_');
        const wompiDomain = isSandbox ? 'sandbox.wompi.co' : 'production.wompi.co';

        const response = await axios.get(`https://${wompiDomain}/v1/transactions/${transactionId}`);
        const txData = response.data?.data;
        if (!txData) return res.status(404).json({ error: 'Transacción no encontrada en Wompi.' });

        if (txData.status !== 'APPROVED') {
            return res.json({ status: txData.status });
        }

        const purchase = await ComunidadPurchase.findOne({ wompiReference: txData.reference });
        if (!purchase) return res.status(404).json({ error: 'Transacción no reconocida en nuestra base de datos.' });

        if (!purchase.isPaid) {
            purchase.isPaid = true;
            purchase.status = 'APPROVED';
            await purchase.save();
            console.log(`[Comunidad Wompi Verify] Unlocked course access for: ${purchase.email}`);
        }

        return res.json({ 
            success: true, 
            status: 'APPROVED', 
            email: purchase.email,
            fullName: purchase.fullName,
            phone: purchase.phone,
            funnelKey: purchase.funnelKey || 'comunidad'
        });
    } catch (err) {
        logger.error('[ComunidadController] verifyComunidadTransaction error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const checkComunidadAccess = async (req, res) => {
    try {
        const { email, funnelKey = 'comunidad' } = req.body;
        if (!email) return res.status(400).json({ error: 'El correo electrónico es obligatorio.' });

        const query = funnelKey === 'comunidad'
            ? { email: email.toLowerCase().trim(), isPaid: true, $or: [{ funnelKey: 'comunidad' }, { funnelKey: { $exists: false } }] }
            : { email: email.toLowerCase().trim(), isPaid: true, funnelKey };
        const purchase = await ComunidadPurchase.findOne(query);
        if (purchase) {
            return res.json({
                isPaid: true,
                fullName: purchase.fullName,
                phone: purchase.phone,
                videoWatched: purchase.videoWatched,
                purchaseTracked: purchase.purchaseTracked === true
            });
        }

        return res.json({ isPaid: false });
    } catch (err) {
        logger.error('[ComunidadController] checkComunidadAccess error:', err);
        return res.status(500).json({ error: 'Error al verificar el acceso.' });
    }
};

const markVideoFinished = async (req, res) => {
    try {
        const { email, funnelKey = 'comunidad' } = req.body;
        if (!email) return res.status(400).json({ error: 'El correo electrónico es obligatorio.' });

        const query = funnelKey === 'comunidad'
            ? { email: email.toLowerCase().trim(), isPaid: true, $or: [{ funnelKey: 'comunidad' }, { funnelKey: { $exists: false } }] }
            : { email: email.toLowerCase().trim(), isPaid: true, funnelKey };
        const purchase = await ComunidadPurchase.findOneAndUpdate(
            query,
            { $set: { videoWatched: true } },
            { new: true }
        );

        if (!purchase) {
            return res.status(404).json({ error: 'No se encontró un registro de pago activo para este correo.' });
        }

        return res.json({ success: true, videoWatched: true });
    } catch (err) {
        logger.error('[ComunidadController] markVideoFinished error:', err);
        return res.status(500).json({ error: 'Error al actualizar el progreso del video.' });
    }
};

const getAllPurchases = async (req, res) => {
    try {
        const query = getFunnelQuery(req);
        const purchases = await ComunidadPurchase.find(query).sort({ createdAt: -1 });
        return res.json(purchases);
    } catch (err) {
        logger.error('[ComunidadController] getAllPurchases error:', err);
        return res.status(500).json({ error: 'Error al obtener la lista de pagos.' });
    }
};

const deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await ComunidadPurchase.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Registro de pago no encontrado.' });
        }
        return res.json({ success: true, message: 'Registro de pago eliminado correctamente.' });
    } catch (err) {
        logger.error('[ComunidadController] deletePurchase error:', err);
        return res.status(500).json({ error: 'Error al eliminar el registro.' });
    }
};

const registerSessionMetric = async (req, res) => {
    try {
        const { sessionId, durationSeconds, clickType, funnelKey = 'comunidad' } = req.body;
        if (!sessionId) {
            return res.status(400).json({ error: 'Falta ID de sesión.' });
        }

        const update = { $set: { updatedAt: new Date(), funnelKey } };

        if (durationSeconds !== undefined) {
            update.$set.durationSeconds = Number(durationSeconds) || 0;
        }

        if (clickType) {
            const allowedClicks = ['playVideo', 'quickAccess', 'checkoutSubmit', 'downloadFile', 'recoverAccess', 'whatsapp'];
            if (allowedClicks.includes(clickType)) {
                update.$inc = { [`clicks.${clickType}`]: 1 };
            }
        }

        const session = await ComunidadSession.findOneAndUpdate(
            { sessionId: sessionId.trim() },
            update,
            { new: true, upsert: true }
        );

        return res.json({ success: true, session });
    } catch (err) {
        logger.error('[ComunidadController] registerSessionMetric error:', err);
        return res.status(500).json({ error: 'Error al registrar métricas.' });
    }
};

const getMetricsStats = async (req, res) => {
    try {
        const query = getFunnelQuery(req);
        const totalVisits = await ComunidadSession.countDocuments(query);
        
        const durationStats = await ComunidadSession.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    avgDuration: { $avg: "$durationSeconds" }
                }
            }
        ]);
        
        const avgDurationSeconds = durationStats[0]?.avgDuration || 0;

        const clickStats = await ComunidadSession.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    playVideo: { $sum: "$clicks.playVideo" },
                    quickAccess: { $sum: "$clicks.quickAccess" },
                    checkoutSubmit: { $sum: "$clicks.checkoutSubmit" },
                    downloadFile: { $sum: "$clicks.downloadFile" },
                    recoverAccess: { $sum: "$clicks.recoverAccess" },
                    whatsapp: { $sum: "$clicks.whatsapp" }
                }
            }
        ]);

        const clicks = clickStats[0] || {
            playVideo: 0,
            quickAccess: 0,
            checkoutSubmit: 0,
            downloadFile: 0,
            recoverAccess: 0,
            whatsapp: 0
        };

        return res.json({
            totalVisits,
            avgDurationSeconds: Math.round(avgDurationSeconds),
            clicks: {
                playVideo: clicks.playVideo || 0,
                quickAccess: clicks.quickAccess || 0,
                checkoutSubmit: clicks.checkoutSubmit || 0,
                downloadFile: clicks.downloadFile || 0,
                recoverAccess: clicks.recoverAccess || 0,
                whatsapp: clicks.whatsapp || 0
            }
        });
    } catch (err) {
        logger.error('[ComunidadController] getMetricsStats error:', err);
        return res.status(500).json({ error: 'Error al obtener métricas de estadísticas.' });
    }
};

const markPurchaseTracked = async (req, res) => {
    try {
        const { email, funnelKey = 'comunidad' } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const query = funnelKey === 'comunidad'
            ? { email: normalizedEmail, $or: [{ funnelKey: 'comunidad' }, { funnelKey: { $exists: false } }] }
            : { email: normalizedEmail, funnelKey };
        const purchase = await ComunidadPurchase.findOneAndUpdate(
            query,
            { $set: { purchaseTracked: true } },
            { new: true }
        );

        if (!purchase) {
            return res.status(404).json({ error: 'No purchase found for this email' });
        }

        return res.json({ success: true, purchaseTracked: purchase.purchaseTracked });
    } catch (err) {
        logger.error('[ComunidadController] markPurchaseTracked error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const auditComunidadForensic = async (req, res) => {
    try {
        const { secret, email } = req.query;
        if (secret !== 'forensic2026') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const targetEmail = email ? email.toLowerCase().trim() : '';
        const emails = targetEmail ? [targetEmail] : [
            'a.rendonpro.sst@gmail.com',
            'nena21514@hotmail.com',
            'fajema23@gmail.com',
            'prevencionlaboralsgsst@gmail.com',
            'wilkewillmarquez@gmail.com'
        ];

        const results = {
            leads: [],
            purchases: [],
            users: [],
            wompiTransactions: []
        };

        const User = mongoose.model('User');
        const WompiTransaction = require('../../models/WompiTransaction');

        for (const email of emails) {
            const normEmail = email.toLowerCase().trim();
            
            const leads = await Lead.find({ email: normEmail });
            results.leads.push({ email, leads });

            const purchases = await ComunidadPurchase.find({ email: normEmail });
            results.purchases.push({ email, purchases });

            const user = await User.findOne({ email: normEmail });
            results.users.push({ email, user });

            const transactions = await WompiTransaction.find({ 
                $or: [
                    { email: normEmail },
                    { userId: user?._id }
                ]
            });
            results.wompiTransactions.push({ email, transactions });
        }

        let webhookLogs = [];
        try {
            const WompiWebhookLog = mongoose.models.WompiWebhookLog || mongoose.model('WompiWebhookLog');
            webhookLogs = await WompiWebhookLog.find({}).sort({ createdAt: -1 }).limit(30).lean();
        } catch (logErr) {
            // Safe fallback if model doesn't exist
            webhookLogs = [{ error: `Could not fetch logs: ${logErr.message}` }];
        }
        results.webhookLogs = webhookLogs;

        return res.json(results);
    } catch (err) {
        logger.error('[ComunidadController] auditComunidadForensic error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const fixComunidadPurchase = async (req, res) => {
    try {
        const { secret, email, action, reference, amount, funnelKey = 'comunidad' } = req.body;
        if (secret !== 'forensic2026') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (action === 'approve') {
            const query = funnelKey === 'comunidad'
                ? { email: normalizedEmail, $or: [{ funnelKey: 'comunidad' }, { funnelKey: { $exists: false } }] }
                : { email: normalizedEmail, funnelKey };
            let purchase = await ComunidadPurchase.findOne(query);
            
            const leadQuery = funnelKey === 'comunidad'
                ? { email: normalizedEmail, $or: [{ funnelKey: 'comunidad' }, { funnelKey: { $exists: false } }] }
                : { email: normalizedEmail, funnelKey };
            const lead = await Lead.findOne(leadQuery);

            if (!purchase) {
                purchase = new ComunidadPurchase({
                    fullName: lead ? lead.fullName : 'Manual Audit Approved',
                    email: normalizedEmail,
                    phone: lead ? lead.phone : '3000000000',
                    isPaid: true,
                    status: 'APPROVED',
                    wompiReference: reference || `${funnelKey === 'wappyvital' ? 'WAP-VIT' : 'WAP-COM'}-MANUAL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                    amountInCents: amount ? Number(amount) : 2800000,
                    purchaseTracked: false,
                    funnelKey
                });
            } else {
                purchase.isPaid = true;
                purchase.status = 'APPROVED';
                purchase.purchaseTracked = false; // Reset so pixel will fire
                if (reference) purchase.wompiReference = reference;
                if (amount) purchase.amountInCents = Number(amount);
            }

            await purchase.save();
            return res.json({ success: true, message: `Approved and repaired purchase for ${normalizedEmail}`, purchase });
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (err) {
        logger.error('[ComunidadController] fixComunidadPurchase error:', err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getComunidadConfig,
    updateComunidadConfig,
    createComunidadCheckout,
    verifyComunidadTransaction,
    checkComunidadAccess,
    markVideoFinished,
    getAllPurchases,
    deletePurchase,
    registerSessionMetric,
    getMetricsStats,
    markPurchaseTracked,
    auditComunidadForensic,
    fixComunidadPurchase
};
