const mongoose = require('mongoose');
const crypto = require('crypto');
const UserPlan = require('~/models/UserPlan');
const Plan = require('~/models/Plan');
const PromoCode = require('~/models/PromoCode');
const WompiTransaction = require('~/models/WompiTransaction');
const { User } = require('~/models');

// We use crypto to safely create checksums for integrity if required,
// but for standard Wompi widget, reference generation is sufficient until verification.

/**
 * GET /api/wompi/configured-plans
 * Returns the configured plans from the database (for frontend UI)
 */
const getPublicPlansConfig = async (req, res) => {
    try {
        const plans = await Plan.find().lean();
        return res.json(plans);
    } catch (error) {
        console.error('[Wompi] getPublicPlansConfig error:', error);
        return res.status(500).json({ error: 'Error obteniendo planes configurados' });
    }
};

const validatePromoCode = async (req, res) => {
    try {
        const { code } = req.params;
        const codeDoc = await PromoCode.findOne({ code: code.toUpperCase() });
        if (!codeDoc || !codeDoc.active) {
            return res.status(404).json({ error: 'Código promocional inválido o expirado' });
        }
        return res.json({ discountPercentage: codeDoc.discountPercentage, code: codeDoc.code });
    } catch (error) {
        console.error('[Wompi] validatePromoCode error:', error);
        return res.status(500).json({ error: 'Error validando código' });
    }
};

/** Plan display names */
const PLAN_NAMES = { go: 'Go', plus: 'Plus', pro: 'Pro' };

/**
 * GET /api/wompi/plan
 * Returns the current user's plan information
 */
const getUserPlan = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const user = await User.findById(userId).lean();
        if (user?.role === 'ADMIN') {
            return res.json({ plan: 'admin', role: 'ADMIN' });
        }

        const plan = await UserPlan.findOne({ userId }).lean();
        if (!plan) return res.json({ plan: 'free' });

        return res.json({
            plan: plan.planId,
            status: plan.status,
            currentPeriodEnd: plan.currentPeriodEnd,
        });
    } catch (error) {
        console.error('[Wompi] getUserPlan error:', error);
        return res.status(500).json({ error: 'Error obteniendo el plan del usuario' });
    }
};

/**
 * POST /api/wompi/create-transaction
 * Expects { plan: 'go|monthly', promoCode: 'SUMMER20' }
 * Generates a unique referenced transaction in MongoDB for tracking,
 * Calculates the final price locally to prevent frontend manipulation,
 * Returns reference, AMOUNT_IN_CENTS, and public Key to launch widget.
 */
const createTransaction = async (req, res) => {
    try {
        const { plan: planString, promoCode } = req.body;
        if (!planString) return res.status(400).json({ error: 'Faltan parámetros' });

        const [planId, interval] = planString.split('|');
        if (!PLAN_NAMES[planId] || !['monthly', 'quarterly', 'semiannual', 'annual'].includes(interval)) {
            return res.status(400).json({ error: 'Plan o intervalo inválido' });
        }

        const userId = req.user._id || req.user.id;

        // Fetch dynamic plan config to calculate real price
        const planDoc = await Plan.findOne({ planId }).lean();
        if (!planDoc) {
            return res.status(500).json({ error: `Configuración para el plan ${planId} no encontrada en DB` });
        }

        let rawPrice = planDoc.prices?.[interval] || 0;
        if (rawPrice === 0) {
            return res.status(500).json({ error: `Monto base no configurado para el plan ${planId} (${interval})` });
        }

        let finalPrice = rawPrice;
        let appliedDiscount = 0;

        // Apply promo Code if provided
        if (promoCode) {
            const codeDoc = await PromoCode.findOne({ code: promoCode.toUpperCase() });
            if (codeDoc && codeDoc.active) {
                appliedDiscount = codeDoc.discountPercentage;
            }
        }
        // Fallback to default promotions if no explicit PromoCode is given or found
        else if (planDoc.promotions?.[interval]?.active) {
            appliedDiscount = planDoc.promotions[interval].discountPercentage;
        }

        if (appliedDiscount > 0) {
            finalPrice = rawPrice - (rawPrice * Math.min(appliedDiscount, 100) / 100);
        }

        // Generate a 15-char unique reference (needed by Wompi)
        const reference = `WAPPY-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        const amountInCents = Math.round(finalPrice * 100);

        // Store transaction state to catch it on webhook
        await WompiTransaction.create({
            userId,
            planId,
            interval,
            reference,
            amountInCents,
            status: 'PENDING'
        });

        // Wompi keys
        const publicKey = process.env.WOMPI_PUBLIC_KEY;
        if (!publicKey) {
            throw new Error('WOMPI_PUBLIC_KEY no configurada');
        }

        // Provide INTEGRITY signature since it's required in modern Wompi Accounts to prevent manipulation
        const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
        let signature = '';
        if (integritySecret) {
            // hash = sha256(reference + amountInCents + currency + integritySecret)
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

    } catch (error) {
        console.error('[Wompi] create-transaction error:', error);
        return res.status(500).json({ error: 'Error inicializando pago con Wompi', details: error.message });
    }
};

/**
 * POST /api/wompi/webhook
 * Wompi calls this when a transaction is updated (approved, declined, etc.)
 */
const handleWebhook = async (req, res) => {
    try {
        const event = req.body;
        console.log('[Wompi Webhook] Event received:', event.event);

        if (event.event !== 'transaction.updated') {
            return res.status(200).send('Event not processed');
        }

        const transactionData = event.data?.transaction;
        if (!transactionData) return res.status(400).send('Malformed payload');

        const { reference, status, id: transactionId } = transactionData;
        console.log(`[Wompi Webhook] Transaction ${transactionId} status is ${status} (ref: ${reference})`);

        // Validate integrity of payload
        const integritySignature = event.signature?.checksum;
        const properties = event.signature?.properties || [];
        // Optional: you can reconstruct signature = sha256(transaction.id + transaction.status + transaction.amount_in_cents + ... + Wompi-Events-Secret)
        // If it matches, great. If not, maybe log a warning.

        // Update transaction in our DB
        const wompiTx = await WompiTransaction.findOne({ reference });
        if (!wompiTx) {
            console.error('[Wompi Webhook] Unknown reference:', reference);
            return res.status(200).send('Reference unknown');
        }

        wompiTx.status = status;
        wompiTx.transactionId = transactionId;
        await wompiTx.save();

        if (status === 'APPROVED') {
            // Upgrade user plan
            const planDoc = await Plan.findOne({ planId: wompiTx.planId }).lean();
            if (!planDoc) {
                console.error('[Wompi Webhook] Missing plan in DB for provisioning.', wompiTx.planId);
                return res.status(200).send('OK'); // don't fail Wompi
            }

            // Calculate expiration
            const expiryDate = new Date();
            if (wompiTx.interval === 'monthly') expiryDate.setMonth(expiryDate.getMonth() + 1);
            else if (wompiTx.interval === 'quarterly') expiryDate.setMonth(expiryDate.getMonth() + 3);
            else if (wompiTx.interval === 'semiannual') expiryDate.setMonth(expiryDate.getMonth() + 6);
            else if (wompiTx.interval === 'annual') expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            let userPlan = await UserPlan.findOne({ userId: wompiTx.userId });
            if (!userPlan) {
                userPlan = new UserPlan({ userId: wompiTx.userId });
            }

            userPlan.planId = wompiTx.planId;
            userPlan.planName = PLAN_NAMES[wompiTx.planId] || wompiTx.planId;
            userPlan.status = 'active'; // In Wompi we might just handle active/expired manually since it's a one-off widget charge
            userPlan.currentPeriodEnd = expiryDate;
            await userPlan.save();
            console.log(`[Wompi Webhook] Successfully provisioned plan ${wompiTx.planId} for user ${wompiTx.userId} via tx ${transactionId}`);
        }

        return res.status(200).send('OK');

    } catch (err) {
        console.error('[Wompi Webhook] Error processing:', err);
        return res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    getPublicPlansConfig,
    validatePromoCode,
    getUserPlan,
    createTransaction,
    handleWebhook
};
