const mongoose = require('mongoose');
const crypto = require('crypto');
const UserPlan = require('~/db/models/UserPlan');
const Plan = require('~/models/Plan');
const PromoCode = require('~/models/PromoCode');
const WompiTransaction = require('~/models/WompiTransaction');
const { getAppConfig } = require('~/server/services/Config');
// Removed User import since role is available in req.user

// We use crypto to safely create checksums for integrity if required,
// but for standard Wompi widget, reference generation is sufficient until verification.

// ─── Helpers for Plan Interval ─────────────────────────────────────────────
const getIntervalDays = (interval) => {
    if (interval === 'quarterly') return 90;
    if (interval === 'semiannual') return 180;
    if (interval === 'annual') return 365;
    return 30; // monthly default
};

/**
 * Calculates the expiry date using the "Time Compensation" algorithm (Option 2):
 * 
 * - Same plan renewal → time is simply stacked (e.g. Plus + 3 months = existing expiry + 3 months)
 * - Different plan tier (upgrade/downgrade) → old unused monetary value is converted to days
 *   of the new plan and added on top of the new plan duration.
 *
 * Example: User has 20 days left of Plus Monthly ($57.800/30 = $1.927/day).
 *   Unused value = 20 × $1.927 = $38.533
 *   New plan: Pro Annual ($795.600/365 = $2.179/day)
 *   Bonus days = $38.533 / $2.179 ≈ 17.7 days
 *   Total expiry = today + 365 days + 17 days
 */
const calculateProratedExpiry = async (planId, interval, userPlan) => {
    const now = new Date();
    const newIntervalDays = getIntervalDays(interval);

    // No active plan or already expired → fresh start
    if (!userPlan || !userPlan.planExpiresAt || userPlan.planExpiresAt <= now) {
        return new Date(now.getTime() + newIntervalDays * 24 * 60 * 60 * 1000);
    }

    // Same tier renewal → stack time 1:1 from current expiry
    if (userPlan.plan === planId) {
        return new Date(userPlan.planExpiresAt.getTime() + newIntervalDays * 24 * 60 * 60 * 1000);
    }

    // Different tier → prorate by monetary value
    const [oldPlanDb, newPlanDb] = await Promise.all([
        Plan.findOne({ planId: userPlan.plan }).lean(),
        Plan.findOne({ planId }).lean(),
    ]);

    if (!oldPlanDb || !newPlanDb) {
        // Fallback: just add new time from today
        return new Date(now.getTime() + newIntervalDays * 24 * 60 * 60 * 1000);
    }

    // Old daily value uses the monthly rate for fairness (most granular price)
    const oldDailyValue = (oldPlanDb.prices?.monthly || 0) / 30;

    // New daily value uses the actual interval chosen (e.g. annual rate / 365)
    const newTotalPrice = newPlanDb.prices?.[interval] || newPlanDb.prices?.monthly || 1;
    const newDailyValue = newTotalPrice / newIntervalDays;

    const remainingDaysOld = Math.max(0, (userPlan.planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const remainingMonetaryValue = remainingDaysOld * oldDailyValue;
    const compensatedExtraDays = newDailyValue > 0 ? remainingMonetaryValue / newDailyValue : 0;

    const totalDaysToGrant = newIntervalDays + compensatedExtraDays;
    console.log(`[Wompi Proration] Old plan: ${userPlan.plan}, ${remainingDaysOld.toFixed(1)} days remaining at $${oldDailyValue.toFixed(0)}/day = $${remainingMonetaryValue.toFixed(0)} unused.`);
    console.log(`[Wompi Proration] New plan: ${planId} (${interval}) at $${newDailyValue.toFixed(0)}/day → +${compensatedExtraDays.toFixed(1)} bonus days. Total: ${totalDaysToGrant.toFixed(1)} days.`);

    return new Date(now.getTime() + totalDaysToGrant * 24 * 60 * 60 * 1000);
};

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
const PLAN_NAMES = { go: 'Go', plus: 'Plus', pro: 'Pro', ipevar: 'Plan IPEVAR' };

/**
 * GET /api/wompi/plan
 * Returns the current user's plan information
 */
const getUserPlan = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const userPlan = await UserPlan.findOne({ userId }).lean();

        let plan = userPlan?.plan;

        if (!plan || plan === 'free') {
            const role = req.user.role;
            if (role === 'ADMIN') plan = 'admin';
            else if (role === 'USER_PRO') plan = 'pro';
            else if (role === 'USER_PLUS') plan = 'plus';
            else if (role === 'USER_GO') plan = 'go';
            else plan = 'free';
        }

        return res.json({
            plan: plan,
            status: 'active', // Derived for UI
            currentPeriodEnd: userPlan?.planExpiresAt || null,
        });
    } catch (error) {
        console.error('[Wompi] getUserPlan error:', error);
        return res.status(500).json({ error: 'Error obteniendo el plan del usuario' });
    }
};

/**
 * Helper: Notify admins when a payment happens (manual QR or automatic)
 */
const notifyAdminsOfPayment = async (wompiTx, user, isManual) => {
    try {
        const User = mongoose.model('User');
        const admins = await User.find({ role: 'ADMIN' }).select('_id').lean();
        if (admins.length === 0) return;

        const Notification = require('~/models/Notification');

        if (isManual) {
            const Ticket = require('~/models/Ticket');
            const newTicket = await Ticket.create({
                name: user?.name || user?.username || 'Usuario',
                email: user?.email || 'N/A',
                phone: user?.phoneNumber || 'N/A',
                type: 'Revisión de Pago',
                description: `Se ha registrado un pago manual por QR Nequi.\nPlan: ${wompiTx.planId} (${wompiTx.interval})\nMonto: $${(wompiTx.amountInCents / 100).toLocaleString('es-CO')}`,
                user: wompiTx.userId,
                attachments: wompiTx.receiptUrl ? [wompiTx.receiptUrl] : [],
                status: 'pending'
            });

            const notifs = admins.map(a => ({
                user: a._id,
                type: 'ticket_created',
                title: 'Revisión de Pago Nequi QR',
                body: `Se ha recibido un comprobante de pago de ${user?.name || 'un usuario'}. Revísalo en tus tickets.`,
                ticketId: newTicket._id
            }));
            await Notification.insertMany(notifs);
        } else {
            const notifs = admins.map(a => ({
                user: a._id,
                type: 'payment_received',
                title: 'Pago automático exitoso',
                body: `Se ha procesado exitosamente el pago del plan ${wompiTx.planId} (${wompiTx.interval}) para ${user?.name || user?.username || 'un usuario'}.`
            }));
            await Notification.insertMany(notifs);
        }
    } catch (e) {
        console.error('[WompiController] Error notifying admins of payment:', e);
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
        let planDoc = await Plan.findOne({ planId }).lean();
        
        if (!planDoc && planId === 'ipevar') {
            // Auto-seed ipevar if missing
            await Plan.create({ planId: 'ipevar', name: 'IPEVAR', prices: { monthly: 0, quarterly: 0, semiannual: 0, annual: 250000 } });
            planDoc = await Plan.findOne({ planId }).lean();
        }

        if (!planDoc) {
            return res.status(500).json({ error: `Configuración para el plan ${planId} no encontrada en DB` });
        }

        let rawPrice = planDoc.prices?.[interval] || 0;
        if (rawPrice === 0) {
            return res.status(500).json({ error: `Monto base no configurado para el plan ${planId} (${interval})` });
        }

        let finalPrice = rawPrice;
        let appliedDiscount = 0;

        // Apply promo Code if provided — NOT allowed for IPEVAR plan
        if (promoCode && planId !== 'ipevar') {
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

        // Validate integrity of payload (Security)
        const receivedChecksum = event.signature?.checksum;
        const properties = event.signature?.properties || [];
        const timestamp = event.timestamp;
        const eventsSecret = process.env.WOMPI_EVENTS_SECRET;

        if (receivedChecksum && eventsSecret && timestamp) {
            let concatenatedString = '';
            for (const propPath of properties) {
                const keys = propPath.split('.');
                let value = event.data;
                for (const key of keys) {
                    value = value?.[key];
                }
                concatenatedString += value;
            }
            concatenatedString += timestamp;
            concatenatedString += eventsSecret;

            const computedChecksum = crypto.createHash('sha256').update(concatenatedString, 'utf-8').digest('hex');

            if (computedChecksum !== receivedChecksum) {
                console.error('[Wompi Webhook] ⚠️ INVALID CHECKSUM. Potential tampering or misconfiguration.');
                return res.status(401).send('Invalid signature');
            }
            console.log('[Wompi Webhook] ✅ Signature verified successfully.');
        } else {
            console.warn('[Wompi Webhook] ⚠️ No signature, secret or timestamp found for verification. Skipping security check.');
        }

        // Update transaction in our DB
        const wompiTx = await WompiTransaction.findOne({ reference });
        if (!wompiTx) {
            console.error('[Wompi Webhook] Unknown reference:', reference);
            return res.status(200).send('Reference unknown');
        }

        const wasAlreadyApproved = wompiTx.status === 'APPROVED';
        wompiTx.status = status;
        wompiTx.transactionId = transactionId;
        await wompiTx.save();

        if (status === 'APPROVED' && !wasAlreadyApproved) {
            // Verify plan exists in DB
            const planDoc = await Plan.findOne({ planId: wompiTx.planId }).lean();
            if (!planDoc) {
                console.error('[Wompi Webhook] Missing plan in DB for provisioning.', wompiTx.planId);
                return res.status(200).send('OK'); // don't fail Wompi
            }

            let userPlan = await UserPlan.findOne({ userId: wompiTx.userId });

            // ── Option 2: Time Compensation Proration ──────────────────────
            // Same tier → stack 1:1. Different tier → convert unused $ to days of new plan.
            const expiryDate = await calculateProratedExpiry(wompiTx.planId, wompiTx.interval, userPlan);

            if (!userPlan) {
                userPlan = new UserPlan({ userId: wompiTx.userId });
            }

            userPlan.plan = wompiTx.planId;
            userPlan.planExpiresAt = expiryDate;
            await userPlan.save();

            // Also update User role for full platform compatibility
            const User = mongoose.model('User');
            let newRole = 'USER';
            if (wompiTx.planId === 'go' || wompiTx.planId === 'ipevar') newRole = 'USER_GO';
            else if (wompiTx.planId === 'plus') newRole = 'USER_PLUS';
            else if (wompiTx.planId === 'pro') newRole = 'USER_PRO';

            await User.updateOne(
                { _id: wompiTx.userId },
                {
                    $set: {
                        role: newRole,
                        activeAt: new Date(),
                        inactiveAt: expiryDate
                    }
                }
            );

            console.log(`[Wompi Webhook] Provisioned plan ${wompiTx.planId} (${wompiTx.interval}), role ${newRole}, expiry ${expiryDate.toISOString()} for user ${wompiTx.userId} via tx ${transactionId}`);
            
            // Notify admins
            try {
                const userDoc = await User.findById(wompiTx.userId).lean();
                await notifyAdminsOfPayment(wompiTx, userDoc, false);
            } catch (e) {
                console.error('[Wompi Webhook] Error fetching user for notification', e);
            }
        }

        return res.status(200).send('OK');

    } catch (err) {
        console.error('[Wompi Webhook] Error processing:', err);
        return res.status(500).send('Internal Server Error');
    }
};

/**
 * POST /api/wompi/verify-transaction
 * Frontend calls this synchronously when Wompi Checkout completes.
 * Directly asks Wompi API for the transaction status, then provisions plan if APPROVED,
 * ensuring no race condition with webhooks.
 */
const verifyTransaction = async (req, res) => {
    try {
        const { transactionId } = req.body;
        if (!transactionId) return res.status(400).json({ error: 'Falta ID de transacción' });

        const isSandbox = process.env.WOMPI_PUBLIC_KEY?.startsWith('pub_test_');
        const wompiDomain = isSandbox ? 'sandbox.wompi.co' : 'production.wompi.co';
        
        // Fetch real transaction info from Wompi
        const response = await fetch(`https://${wompiDomain}/v1/transactions/${transactionId}`);
        const result = await response.json();
        const txData = result.data;
        if (!txData) return res.status(404).json({ error: 'Transacción no encontrada en Wompi' });

        if (txData.status !== 'APPROVED') {
            return res.json({ status: txData.status });
        }

        const wompiTx = await WompiTransaction.findOne({ reference: txData.reference });
        if (!wompiTx) return res.json({ status: 'UNKNOWN_REFERENCE' });

        // If it's already approved by webhook, great. If not, we provision right now.
        if (wompiTx.status !== 'APPROVED') {
            wompiTx.status = 'APPROVED';
            wompiTx.transactionId = transactionId;
            await wompiTx.save();

            const planDoc = await Plan.findOne({ planId: wompiTx.planId }).lean();
            if (planDoc) {
                let userPlan = await UserPlan.findOne({ userId: wompiTx.userId });

                // ── Option 2: Time Compensation Proration ──────────────────────
                const expiryDate = await calculateProratedExpiry(wompiTx.planId, wompiTx.interval, userPlan);

                if (!userPlan) {
                    userPlan = new UserPlan({ userId: wompiTx.userId });
                }
                userPlan.plan = wompiTx.planId;
                userPlan.planExpiresAt = expiryDate;
                await userPlan.save();

                const User = mongoose.model('User');
                let newRole = 'USER';
                if (wompiTx.planId === 'go' || wompiTx.planId === 'ipevar') newRole = 'USER_GO';
                else if (wompiTx.planId === 'plus') newRole = 'USER_PLUS';
                else if (wompiTx.planId === 'pro') newRole = 'USER_PRO';

                await User.updateOne(
                    { _id: wompiTx.userId },
                    { $set: { role: newRole, activeAt: new Date(), inactiveAt: expiryDate } }
                );
                console.log(`[Wompi VerifyTransaction] Provisioned plan ${wompiTx.planId} (${wompiTx.interval}), expiry ${expiryDate.toISOString()} for user ${wompiTx.userId}`);
                
                try {
                    const userDoc = await User.findById(wompiTx.userId).lean();
                    await notifyAdminsOfPayment(wompiTx, userDoc, false);
                } catch (e) {
                    console.error('[Wompi VerifyTransaction] Error fetching user for notification', e);
                }
            }
        }

        return res.json({ success: true, status: 'APPROVED' });
    } catch (err) {
        console.error('[Wompi VerifyTransaction] error:', err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/wompi/register-pending
 * Called by the frontend when the Wompi widget returns PENDING (e.g. Compra y Paga Después).
 * Stores the real Wompi transactionId on the WompiTransaction record so the poller can query it.
 */
const registerPendingTransaction = async (req, res) => {
    try {
        const { reference, transactionId } = req.body;
        if (!reference || !transactionId) {
            return res.status(400).json({ error: 'Faltan referencia o ID de transacción' });
        }

        const updated = await WompiTransaction.findOneAndUpdate(
            { reference, userId: req.user._id || req.user.id },
            { $set: { transactionId, status: 'PENDING' } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        console.log(`[Wompi] Registered pending transactionId ${transactionId} for reference ${reference}`);
        return res.json({ success: true });
    } catch (err) {
        console.error('[Wompi] registerPendingTransaction error:', err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/wompi/manual-receipt
 * Handles Nequi QR payment submissions. 5% discount applies.
 */
const createManualTransaction = async (req, res) => {
    try {
        const { plan: planString, promoCode } = req.body;
        if (!planString || !req.file) {
            return res.status(400).json({ error: 'Faltan parámetros o el comprobante de pago' });
        }

        const [planId, interval] = planString.split('|');
        if (!PLAN_NAMES[planId] || !['monthly', 'quarterly', 'semiannual', 'annual'].includes(interval)) {
            return res.status(400).json({ error: 'Plan o intervalo inválido' });
        }

        const userId = req.user._id || req.user.id;
        let planDoc = await Plan.findOne({ planId }).lean();
        
        if (!planDoc && planId === 'ipevar') {
            // Auto-seed ipevar if missing
            await Plan.create({ planId: 'ipevar', name: 'IPEVAR', prices: { monthly: 0, quarterly: 0, semiannual: 0, annual: 250000 } });
            planDoc = await Plan.findOne({ planId }).lean();
        }

        if (!planDoc) {
            return res.status(500).json({ error: `Configuración para el plan ${planId} no encontrada` });
        }

        let rawPrice = planDoc.prices?.[interval] || 0;
        if (rawPrice === 0) {
            return res.status(500).json({ error: `Monto base no configurado` });
        }

        let finalPrice = rawPrice;
        let appliedDiscount = 0;

        // Promo codes are NOT allowed for IPEVAR plan
        if (promoCode && planId !== 'ipevar') {
            const codeDoc = await PromoCode.findOne({ code: promoCode.toUpperCase() });
            if (codeDoc && codeDoc.active) {
                appliedDiscount = codeDoc.discountPercentage;
            }
        } else if (planDoc.promotions?.[interval]?.active) {
            appliedDiscount = planDoc.promotions[interval].discountPercentage;
        }

        if (appliedDiscount > 0) {
            finalPrice = rawPrice - (rawPrice * Math.min(appliedDiscount, 100) / 100);
        }

        // Apply 5% discount for Nequi QR
        finalPrice = finalPrice * 0.95;

        const reference = `WAPPY-NQ-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        const amountInCents = Math.round(finalPrice * 100);

        // Move the file from temp to a permanent receipts folder
        const fs = require('fs');
        const path = require('path');
        const appConfig = await getAppConfig();
        const uploadsDir = appConfig.paths.uploads;
        const receiptsDir = path.join(uploadsDir, 'receipts', userId.toString());
        
        console.log('[Wompi Manual] Moving file:', req.file.path, '->', receiptsDir);
        
        if (!fs.existsSync(receiptsDir)) {
            fs.mkdirSync(receiptsDir, { recursive: true });
        }
        
        const permanentPath = path.join(receiptsDir, req.file.filename);
        try { 
            fs.renameSync(req.file.path, permanentPath); 
        } catch(e) { 
            console.error('[Wompi Manual] Could not move file:', e.message); 
            // Fallback for cross-partition moves
            try {
                fs.copyFileSync(req.file.path, permanentPath);
                fs.unlinkSync(req.file.path);
            } catch(copyErr) {
                console.error('[Wompi Manual] Cross-partition copy failed:', copyErr.message);
            }
        }

        // Store a web-accessible API URL, not the raw filesystem path
        const receiptUrl = `/api/wompi/receipt/${userId}/${encodeURIComponent(req.file.filename)}`;

        const wompiTx = await WompiTransaction.create({
            userId,
            planId,
            interval,
            reference,
            amountInCents,
            status: 'PENDING_MANUAL_REVIEW',
            paymentMethod: 'NEQUI_QR',
            receiptUrl
        });

        // Notify admins about the manual payment so they can review
        const userDoc = req.user || await mongoose.model('User').findById(userId).lean();
        await notifyAdminsOfPayment(wompiTx, userDoc, true);

        return res.json({ success: true, reference, message: 'Pago manual registrado exitosamente.' });

    } catch (error) {
        console.error('[Wompi Manual] createManualTransaction error:', error);
        return res.status(500).json({ error: 'Error procesando pago manual', details: error.message });
    }
};

/**
 * POST /api/wompi/guest-checkout  (NO auth required)
 * Registers a new user (or finds existing) + creates a Wompi transaction in one step.
 * Returns transaction data + a short-lived guestToken for post-payment verification.
 */
const guestCheckout = async (req, res) => {
    try {
        const jwt = require('jsonwebtoken');
        const bcrypt = require('bcryptjs');
        const { name, email, password, plan: planString, promoCode } = req.body;

        if (!name || !email || !password || !planString) {
            return res.status(400).json({ error: 'Faltan campos: name, email, password, plan' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const [planId, interval] = planString.split('|');
        if (!PLAN_NAMES[planId] || !['monthly', 'quarterly', 'semiannual', 'annual'].includes(interval)) {
            return res.status(400).json({ error: 'Plan o intervalo inválido' });
        }

        // ── 1. Find or create user ────────────────────────────────────────
        const User = mongoose.model('User');
        let user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 12);
            const baseUser = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 18);
            const username = baseUser + Math.floor(Math.random() * 9000 + 1000);
            user = new User({
                name,
                username,
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: 'USER',
            });
            await user.save();
            console.log(`[GuestCheckout] Created new user ${user._id} for ${email}`);
        } else {
            console.log(`[GuestCheckout] Found existing user ${user._id} for ${email}`);
        }

        // ── 2. Calculate price (same logic as createTransaction) ──────────
        let planDoc = await Plan.findOne({ planId }).lean();
        if (!planDoc && planId === 'ipevar') {
            await Plan.create({ planId: 'ipevar', name: 'IPEVAR', prices: { monthly: 0, quarterly: 0, semiannual: 0, annual: 250000 } });
            planDoc = await Plan.findOne({ planId }).lean();
        }
        if (!planDoc) return res.status(500).json({ error: `Plan ${planId} no configurado en DB` });

        let rawPrice = planDoc.prices?.[interval] || 0;
        if (rawPrice === 0) return res.status(500).json({ error: 'Monto base no configurado' });

        let finalPrice = rawPrice;
        let appliedDiscount = 0;

        if (promoCode && planId !== 'ipevar') {
            const codeDoc = await PromoCode.findOne({ code: promoCode.toUpperCase() });
            if (codeDoc && codeDoc.active) appliedDiscount = codeDoc.discountPercentage;
        } else if (planDoc.promotions?.[interval]?.active) {
            appliedDiscount = planDoc.promotions[interval].discountPercentage;
        }

        if (appliedDiscount > 0) {
            finalPrice = rawPrice - (rawPrice * Math.min(appliedDiscount, 100) / 100);
        }

        // ── 3. Create transaction record ──────────────────────────────────
        const reference = `WAPPY-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        const amountInCents = Math.round(finalPrice * 100);

        await WompiTransaction.create({
            userId: user._id,
            planId,
            interval,
            reference,
            amountInCents,
            status: 'PENDING',
        });

        // ── 4. Wompi integrity signature ──────────────────────────────────
        const publicKey = process.env.WOMPI_PUBLIC_KEY;
        if (!publicKey) return res.status(500).json({ error: 'WOMPI_PUBLIC_KEY no configurada' });

        const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
        let signature = '';
        if (integritySecret) {
            const stringToSign = `${reference}${amountInCents}COP${integritySecret}`;
            signature = crypto.createHash('sha256').update(stringToSign, 'utf-8').digest('hex');
        }

        // ── 5. Short-lived JWT for post-payment verification ──────────────
        const jwtSecret = process.env.JWT_SECRET;
        const guestToken = jwt.sign({ id: user._id.toString(), role: user.role }, jwtSecret, { expiresIn: '2h' });

        console.log(`[GuestCheckout] Transaction ${reference} created for user ${user._id}, plan ${planId}|${interval}`);

        return res.json({ publicKey, reference, amountInCents, currency: 'COP', signature, guestToken });
    } catch (error) {
        console.error('[Wompi] guestCheckout error:', error);
        return res.status(500).json({ error: 'Error en guest checkout', details: error.message });
    }
};

/**
 * POST /api/wompi/guest-verify  (NO auth required)
 * Verifies a Wompi transaction using a guestToken issued by guestCheckout.
 */
const guestVerifyTransaction = async (req, res) => {
    try {
        const jwt = require('jsonwebtoken');
        const { transactionId, guestToken } = req.body;
        if (!transactionId || !guestToken) {
            return res.status(400).json({ error: 'Faltan transactionId o guestToken' });
        }

        // Validate guest token
        let decoded;
        try {
            decoded = jwt.verify(guestToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ error: 'guestToken inválido o expirado' });
        }

        // Use same logic as verifyTransaction but with userId from token
        const isSandbox = process.env.WOMPI_PUBLIC_KEY?.startsWith('pub_test_');
        const wompiDomain = isSandbox ? 'sandbox.wompi.co' : 'production.wompi.co';
        const response = await fetch(`https://${wompiDomain}/v1/transactions/${transactionId}`);
        const result = await response.json();
        const txData = result.data;
        if (!txData) return res.status(404).json({ error: 'Transacción no encontrada en Wompi' });

        if (txData.status !== 'APPROVED') {
            return res.json({ status: txData.status });
        }

        const wompiTx = await WompiTransaction.findOne({ reference: txData.reference });
        if (!wompiTx) return res.json({ status: 'UNKNOWN_REFERENCE' });

        if (wompiTx.status !== 'APPROVED') {
            wompiTx.status = 'APPROVED';
            wompiTx.transactionId = transactionId;
            await wompiTx.save();

            const planDoc = await Plan.findOne({ planId: wompiTx.planId }).lean();
            if (planDoc) {
                let userPlan = await UserPlan.findOne({ userId: wompiTx.userId });
                const expiryDate = await calculateProratedExpiry(wompiTx.planId, wompiTx.interval, userPlan);

                if (!userPlan) userPlan = new UserPlan({ userId: wompiTx.userId });
                userPlan.plan = wompiTx.planId;
                userPlan.planExpiresAt = expiryDate;
                await userPlan.save();

                const User = mongoose.model('User');
                let newRole = 'USER';
                if (wompiTx.planId === 'go' || wompiTx.planId === 'ipevar') newRole = 'USER_GO';
                else if (wompiTx.planId === 'plus') newRole = 'USER_PLUS';
                else if (wompiTx.planId === 'pro') newRole = 'USER_PRO';

                await User.updateOne(
                    { _id: wompiTx.userId },
                    { $set: { role: newRole, activeAt: new Date(), inactiveAt: expiryDate } }
                );
                console.log(`[GuestVerify] Plan ${wompiTx.planId} activated for user ${wompiTx.userId}`);
            }
        }

        return res.json({ success: true, status: 'APPROVED' });
    } catch (err) {
        console.error('[Wompi] guestVerifyTransaction error:', err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getPublicPlansConfig,
    validatePromoCode,
    getUserPlan,
    createTransaction,
    handleWebhook,
    verifyTransaction,
    registerPendingTransaction,
    createManualTransaction,
    guestCheckout,
    guestVerifyTransaction,
};
