const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireJwtAuth } = require('../middleware');
const { logger } = require('@librechat/data-schemas');

const UserPlan = require('~/db/models/UserPlan');
const Partner = require('~/models/Partner');
const PartnerCommission = require('~/models/PartnerCommission');
const ReferralRecord = require('~/models/ReferralRecord');
const PointTransaction = require('~/models/PointTransaction');
const PayoutRequest = require('~/models/PayoutRequest');

// All endpoints in this router are authenticated
router.use(requireJwtAuth);

/**
 * Helper to calculate a user's current points balance
 */
const getPointsBalance = async (userId) => {
    const result = await PointTransaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, balance: { $sum: '$points' } } }
    ]);
    return result.length > 0 ? result[0].balance : 0;
};

/**
 * GET /api/referrals/stats
 * Returns the user's referral link, points balance, and referred friends
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const origin = process.env.DOMAIN_CLIENT || `https://wappy.pe`;

        // Fetch fresh user from DB to get real username and name
        const User = mongoose.model('User');
        const dbUser = await User.findById(userId, 'username name').lean();
        
        let refIdentifier = userId;
        if (dbUser && dbUser.username && !dbUser.username.includes('@')) {
            refIdentifier = dbUser.username;
        } else if (dbUser && dbUser.name) {
            // Fallback to slugified display name to keep it pretty and secure
            const slugifyName = (str) => {
                return str.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                    .replace(/[^a-z0-9\s-]/g, '') // Keep alphanumeric, spaces and hyphens
                    .trim()
                    .replace(/\s+/g, '-') // Replace spaces with hyphens
                    .replace(/-+/g, '-'); // Remove double hyphens
            };
            const slug = slugifyName(dbUser.name);
            if (slug && slug.length > 2) {
                refIdentifier = slug;
            }
        }

        const referralLink = `${origin}/?ref=${refIdentifier}`;

        // Calculate points
        const pointsBalance = await getPointsBalance(userId);

        // Calculate lifetime earned points (sum of positive points)
        const lifetimeResult = await PointTransaction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), points: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$points' } } }
        ]);
        const totalEarned = lifetimeResult.length > 0 ? lifetimeResult[0].total : 0;

        // Get referred friends
        const referredRecords = await ReferralRecord.find({ referredByUser: userId })
            .sort({ createdAt: -1 })
            .lean();

        const referredFriends = await Promise.all(
            referredRecords.map(async (rec) => {
                const friend = await User.findById(rec.referredUserId, 'name email createdAt').lean();
                return {
                    id: rec._id,
                    name: friend?.name || 'Usuario Wappy',
                    email: friend?.email ? `${friend.email.slice(0, 3)}***@${friend.email.split('@')[1]}` : 'N/A', // Mask email for privacy
                    registrationDate: rec.createdAt,
                    status: rec.status // 'registered' or 'subscribed'
                };
            })
        );

        // Get points history
        const pointsHistory = await PointTransaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        // Check if this user was referred by a Wappy Embajador
        let embajadorSupport = null;
        const myReferral = await ReferralRecord.findOne({ referredUserId: userId }).lean();
        if (myReferral && myReferral.referredByPartner) {
            const partner = await Partner.findById(myReferral.referredByPartner).lean();
            if (partner && partner.type === 'embajador' && partner.status === 'approved') {
                const partnerUser = await User.findById(partner.userId, 'name email').lean();
                embajadorSupport = {
                    name: partnerUser?.name || partner.slug,
                    email: partnerUser?.email || '',
                    slug: partner.slug,
                    supportContact: partner.supportContact || ''
                };
            }
        }

        return res.json({
            referralLink,
            pointsBalance,
            totalEarned,
            referredFriends,
            pointsHistory,
            embajadorSupport
        });
    } catch (err) {
        logger.error('[ReferralsStats] Error:', err);
        return res.status(500).json({ error: 'Error al obtener estadísticas de referidos' });
    }
});

/**
 * POST /api/referrals/redeem
 * Exchange points for free subscription time of Plan PRO
 */
router.post('/redeem', async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { rewardType } = req.body;

        const REWARDS = {
            '1_week_pro': { cost: 250, days: 7, label: '1 Semana de Plan PRO' },
            '2_weeks_pro': { cost: 450, days: 14, label: '2 Semanas de Plan PRO' },
            '1_month_pro': { cost: 800, days: 30, label: '1 Mes de Plan PRO' }
        };

        const selectedReward = REWARDS[rewardType];
        if (!selectedReward) {
            return res.status(400).json({ error: 'Tipo de premio inválido' });
        }

        // Verify points balance
        const currentBalance = await getPointsBalance(userId);
        if (currentBalance < selectedReward.cost) {
            return res.status(400).json({ error: `Puntos insuficientes. Requiere ${selectedReward.cost} puntos, pero tienes ${currentBalance}.` });
        }

        // Deduct points
        await PointTransaction.create({
            userId,
            points: -selectedReward.cost,
            type: 'redemption',
            description: `Canje de Premio: ${selectedReward.label}`
        });

        // Provision plan PRO extension
        let userPlan = await UserPlan.findOne({ userId });
        if (!userPlan) {
            userPlan = new UserPlan({ userId });
        }

        const now = new Date();
        let baseDate = now;

        // If user already has an active PRO plan, stack time onto it
        if (userPlan.plan === 'pro' && userPlan.planExpiresAt && userPlan.planExpiresAt > now) {
            baseDate = userPlan.planExpiresAt;
        }

        const newExpiry = new Date(baseDate.getTime() + selectedReward.days * 24 * 60 * 60 * 1000);

        userPlan.plan = 'pro';
        userPlan.planExpiresAt = newExpiry;
        await userPlan.save();

        // Update User role, accountStatus, and inactiveAt
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(userId, {
            role: 'USER_PRO',
            accountStatus: 'active',
            inactiveAt: newExpiry
        });

        // Fetch updated user to send back
        const updatedUser = await User.findById(userId, '-password').lean();

        logger.info(`[ReferralsRedeem] User ${req.user.email} successfully redeemed ${selectedReward.label}. New expiry: ${newExpiry.toISOString()}`);

        return res.json({
            success: true,
            message: `¡Canje exitoso! Se ha activado ${selectedReward.label} gratis hasta el ${newExpiry.toLocaleDateString()}.`,
            pointsBalance: currentBalance - selectedReward.cost,
            planExpiresAt: newExpiry,
            user: updatedUser
        });
    } catch (err) {
        logger.error('[ReferralsRedeem] Error:', err);
        return res.status(500).json({ error: 'Error al canjear puntos' });
    }
});

/**
 * GET /api/referrals/partner/stats
 * Returns KPIs, commission table, and withdrawal requests for affiliates/partners
 */
router.get('/partner/stats', async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const partner = await Partner.findOne({ userId }).lean();
        if (!partner) {
            return res.json({ isPartner: false });
        }

        // Return status detail if pending or rejected
        if (partner.status === 'pending') {
            return res.json({ isPartner: false, isPending: true, partner });
        }
        if (partner.status === 'rejected') {
            return res.json({ isPartner: false, isRejected: true, partner });
        }

        const partnerId = partner._id;

        // Signups and conversions
        const registeredSignups = await ReferralRecord.countDocuments({ referredByPartner: partnerId });
        const paidSubscriptions = await ReferralRecord.countDocuments({ referredByPartner: partnerId, status: 'subscribed' });

        // Commissions sums
        const commissionStats = await PartnerCommission.aggregate([
            { $match: { partnerId: new mongoose.Types.ObjectId(partnerId) } },
            {
                $group: {
                    _id: null,
                    totalEarned: {
                        $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$commissionAmount', 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0] }
                    },
                    approved: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0] }
                    },
                    requested: {
                        $sum: { $cond: [{ $eq: ['$status', 'requested'] }, '$commissionAmount', 0] }
                    },
                    paid: {
                        $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0] }
                    }
                }
            }
        ]);

        const stats = {
            registeredSignups,
            paidSubscriptions,
            totalEarned: commissionStats.length > 0 ? commissionStats[0].totalEarned : 0,
            pendingCommissions: commissionStats.length > 0 ? commissionStats[0].pending : 0,
            approvedCommissions: commissionStats.length > 0 ? commissionStats[0].approved : 0,
            requestedCommissions: commissionStats.length > 0 ? commissionStats[0].requested : 0,
            paidCommissions: commissionStats.length > 0 ? commissionStats[0].paid : 0
        };

        // List of all commissions
        const User = mongoose.model('User');
        const rawCommissions = await PartnerCommission.find({ partnerId })
            .sort({ createdAt: -1 })
            .lean();

        const commissions = await Promise.all(
            rawCommissions.map(async (comm) => {
                const referredUser = await User.findById(comm.referredUserId, 'name email').lean();
                return {
                    id: comm._id,
                    referredUser: {
                        name: referredUser?.name || 'Usuario',
                        email: referredUser?.email ? `${referredUser.email.slice(0, 3)}***@${referredUser.email.split('@')[1]}` : 'N/A'
                    },
                    amount: comm.amount,
                    commissionAmount: comm.commissionAmount,
                    status: comm.status,
                    createdAt: comm.createdAt
                };
            })
        );

        // Fetch Payout Requests history
        const payoutRequests = await PayoutRequest.find({ partnerId })
            .sort({ createdAt: -1 })
            .lean();

        const origin = process.env.DOMAIN_CLIENT || `https://wappy.pe`;
        const partnerLink = `${origin}/?ref=${partner.slug}`;

        return res.json({
            isPartner: true,
            partnerLink,
            partner,
            stats,
            commissions,
            payoutRequests
        });
    } catch (err) {
        logger.error('[PartnerStats] Error:', err);
        return res.status(500).json({ error: 'Error al obtener estadísticas del partner' });
    }
});

/**
 * POST /api/referrals/partner/apply
 * Submits/updates payout billing and customer support configurations for approved partners
 */
router.post('/partner/apply', async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { paymentDetails, supportContact } = req.body;

        const updateData = {};
        if (paymentDetails !== undefined) {
            updateData.paymentDetails = paymentDetails.trim();
        }
        if (supportContact !== undefined) {
            updateData.supportContact = supportContact.trim();
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No se enviaron datos válidos para actualizar.' });
        }

        const partner = await Partner.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true }
        );

        if (!partner) {
            return res.status(404).json({ error: 'No eres socio partner registrado en el sistema o tu solicitud no está aprobada.' });
        }

        return res.json({
            success: true,
            message: 'Tus configuraciones han sido actualizadas con éxito.',
            partner
        });
    } catch (err) {
        logger.error('[PartnerApply] Error:', err);
        return res.status(500).json({ error: 'Error al actualizar configuraciones del socio' });
    }
});

/**
 * POST /api/referrals/partner/apply-new
 * Lets a regular user apply to become a Partner or Embajador.
 */
router.post('/partner/apply-new', async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { slug, type, paymentDetails, supportContact } = req.body;

        if (!slug || slug.trim() === '') {
            return res.status(400).json({ error: 'El código personalizado (slug) es obligatorio.' });
        }

        const normalizedSlug = slug.toLowerCase().trim();
        // Alphanumeric + hyphens only
        if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
            return res.status(400).json({ error: 'El código de recomendación solo puede contener letras, números y guiones.' });
        }

        // Check availability
        const existingSlug = await Partner.findOne({ slug: normalizedSlug });
        if (existingSlug) {
            return res.status(400).json({ error: 'Este código de recomendación ya está siendo usado por otro socio.' });
        }

        // Check if user already has a partner application
        const existingPartner = await Partner.findOne({ userId });
        if (existingPartner) {
            if (existingPartner.status === 'pending') {
                return res.status(400).json({ error: 'Ya tienes una solicitud de socio pendiente de revisión.' });
            }
            if (existingPartner.status === 'approved') {
                return res.status(400).json({ error: 'Tu cuenta ya está activa como socio comercial.' });
            }
            
            // If rejected, let them resubmit
            existingPartner.slug = normalizedSlug;
            existingPartner.type = type === 'embajador' ? 'embajador' : 'partner';
            existingPartner.commissionRate = type === 'embajador' ? 0.30 : 0.20;
            existingPartner.paymentDetails = paymentDetails ? paymentDetails.trim() : '';
            existingPartner.supportContact = supportContact ? supportContact.trim() : '';
            existingPartner.status = 'pending';
            existingPartner.active = false;
            await existingPartner.save();
            return res.json({ success: true, message: 'Tu solicitud ha sido enviada nuevamente para revisión.', partner: existingPartner });
        }

        // Create new Partner record in pending status
        const newPartner = await Partner.create({
            userId,
            slug: normalizedSlug,
            type: type === 'embajador' ? 'embajador' : 'partner',
            commissionRate: type === 'embajador' ? 0.30 : 0.20,
            active: false,
            status: 'pending',
            paymentDetails: paymentDetails ? paymentDetails.trim() : '',
            supportContact: supportContact ? supportContact.trim() : ''
        });

        return res.json({
            success: true,
            message: 'Tu solicitud para ser socio comercial ha sido enviada con éxito. Evaluaremos tu perfil y te notificaremos pronto.',
            partner: newPartner
        });
    } catch (err) {
        logger.error('[PartnerApplyNew] Error:', err);
        return res.status(500).json({ error: 'Error al enviar tu solicitud de socio' });
    }
});

/**
 * POST /api/referrals/partner/withdraw
 * Requests payout/withdrawal of accumulated approved commissions.
 */
router.post('/partner/withdraw', async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        // 1. Get Partner
        const partner = await Partner.findOne({ userId });
        if (!partner || partner.status !== 'approved') {
            return res.status(404).json({ error: 'No eres socio activo en el sistema.' });
        }

        // 2. Check if paymentDetails is configured
        if (!partner.paymentDetails || partner.paymentDetails.trim() === '') {
            return res.status(400).json({ error: 'Debes registrar tus datos bancarios o cuenta de cobro en el formulario de arriba antes de solicitar un retiro.' });
        }

        // 3. Find approved commissions
        const approvedCommissions = await PartnerCommission.find({
            partnerId: partner._id,
            status: 'approved'
        });

        if (approvedCommissions.length === 0) {
            return res.status(400).json({ error: 'No tienes comisiones acumuladas aprobadas (libres de hold) para retirar en este momento.' });
        }

        // 4. Calculate total amount
        const totalAmount = approvedCommissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);

        // 5. Create PayoutRequest
        const commissionIds = approvedCommissions.map(comm => comm._id);
        const payoutRequest = await PayoutRequest.create({
            partnerId: partner._id,
            amount: totalAmount,
            status: 'pending',
            paymentDetails: partner.paymentDetails,
            notes: `Retiro solicitado por el socio. Comisiones incluidas: ${approvedCommissions.length}.`,
            commissionIds
        });

        // 6. Update commissions status to requested
        await PartnerCommission.updateMany(
            { _id: { $in: commissionIds } },
            { $set: { status: 'requested' } }
        );

        logger.info(`[ReferralsWithdraw] Partner ${partner.slug} requested withdrawal of $${(totalAmount / 100).toLocaleString('es-CO')} COP. PayoutRequest: ${payoutRequest._id}`);

        return res.json({
            success: true,
            message: `¡Solicitud de retiro registrada! Se ha enviado la solicitud de retiro por $${(totalAmount / 100).toLocaleString('es-CO')} COP. Tu pago se procesará en un plazo de 3 a 5 días hábiles.`,
            payoutRequest
        });
    } catch (err) {
        logger.error('[PartnerWithdraw] Error:', err);
        return res.status(500).json({ error: 'Error al procesar la solicitud de retiro de comisiones' });
    }
});

module.exports = router;
