const mongoose = require('mongoose');
const crypto = require('crypto');
const axios = require('axios');
const ComunidadConfig = require('../../models/ComunidadConfig');
const ComunidadPurchase = require('../../models/ComunidadPurchase');
const { Lead } = require('../../models/Lead');
const { logger } = require('@librechat/data-schemas');

const getComunidadConfig = async (req, res) => {
    try {
        let config = await ComunidadConfig.findOne({ isGlobalSetting: true });
        if (!config) {
            config = new ComunidadConfig({
                isGlobalSetting: true,
                videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                requiresPayment: false,
                price: 0,
                downloadableFiles: []
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
        const { videoUrl, requiresPayment, price, downloadableFiles } = req.body;
        
        let config = await ComunidadConfig.findOne({ isGlobalSetting: true });
        if (!config) {
            config = new ComunidadConfig({ isGlobalSetting: true });
        }

        if (videoUrl !== undefined) config.videoUrl = videoUrl;
        if (requiresPayment !== undefined) config.requiresPayment = requiresPayment;
        if (price !== undefined) config.price = Number(price) || 0;
        if (downloadableFiles !== undefined) config.downloadableFiles = downloadableFiles;

        await config.save();
        return res.json({ success: true, config });
    } catch (err) {
        logger.error('[ComunidadController] updateComunidadConfig error:', err);
        return res.status(500).json({ error: 'Error al actualizar la configuración.' });
    }
};

const createComunidadCheckout = async (req, res) => {
    try {
        const { fullName, email, phone } = req.body;
        if (!fullName || !email || !phone) {
            return res.status(400).json({ error: 'Todos los campos (nombre, correo, celular) son obligatorios.' });
        }

        try {
            const existingLead = await Lead.findOne({ email: email.toLowerCase().trim() });
            if (!existingLead) {
                const newLead = new Lead({
                    fullName: fullName.trim(),
                    email: email.toLowerCase().trim(),
                    phone: phone.trim()
                });
                await newLead.save();
            }
        } catch (leadErr) {
            logger.error('[ComunidadController] Error registering lead:', leadErr);
        }

        let purchase = await ComunidadPurchase.findOne({ email: email.toLowerCase().trim() });
        
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
                isPaid: false
            });
        } else {
            purchase.fullName = fullName.trim();
            purchase.phone = phone.trim();
        }

        const config = await ComunidadConfig.findOne({ isGlobalSetting: true });
        const price = config ? config.price : 0;
        const requiresPayment = config ? config.requiresPayment : false;

        if (!requiresPayment || price <= 0) {
            purchase.isPaid = true;
            purchase.status = 'APPROVED';
            await purchase.save();
            return res.json({ freeAccess: true });
        }

        const amountInCents = Math.round(price * 100);
        const reference = `WAP-COM-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-6)}`;

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

        return res.json({ success: true, status: 'APPROVED', email: purchase.email });
    } catch (err) {
        logger.error('[ComunidadController] verifyComunidadTransaction error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const checkComunidadAccess = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'El correo electrónico es obligatorio.' });

        const purchase = await ComunidadPurchase.findOne({ email: email.toLowerCase().trim(), isPaid: true });
        if (purchase) {
            return res.json({
                isPaid: true,
                fullName: purchase.fullName,
                phone: purchase.phone,
                videoWatched: purchase.videoWatched
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
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'El correo electrónico es obligatorio.' });

        const purchase = await ComunidadPurchase.findOneAndUpdate(
            { email: email.toLowerCase().trim(), isPaid: true },
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
        const purchases = await ComunidadPurchase.find().sort({ createdAt: -1 });
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

module.exports = {
    getComunidadConfig,
    updateComunidadConfig,
    createComunidadCheckout,
    verifyComunidadTransaction,
    checkComunidadAccess,
    markVideoFinished,
    getAllPurchases,
    deletePurchase
};
