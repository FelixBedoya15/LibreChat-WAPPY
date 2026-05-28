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
        const referralLink = `${origin}/?ref=${req.user.username || userId}`;

        // Calculate points
        const pointsBalance = await getPointsBalance(userId);

        // Calculate lifetime earned points (sum of positive points)
        const lifetimeResult = await PointTransaction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), points: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$points' } } }
        ]);
        const totalEarned = lifetimeResult.length > 0 ? lifetimeResult[0].total : 0;

        // Get referred friends
        const User = mongoose.model('User');
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

        return res.json({
            referralLink,
            pointsBalance,
            totalEarned,
            referredFriends,
            pointsHistory
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
 * Returns KPIs and commission table for affiliates/partners
 */
router.get('/partner/stats', async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const partner = await Partner.findOne({ userId }).lean();
        if (!partner) {
            return res.json({ isPartner: false });
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

        const origin = process.env.DOMAIN_CLIENT || `https://wappy.pe`;
        const partnerLink = `${origin}/?ref=${partner.slug}`;

        return res.json({
            isPartner: true,
            partnerLink,
            partner,
            stats,
            commissions
        });
    } catch (err) {
        logger.error('[PartnerStats] Error:', err);
        return res.status(500).json({ error: 'Error al obtener estadísticas del partner' });
    }
});

/**
 * POST /api/referrals/partner/apply
 * Submits payout billing instructions for bank transfer
 */
router.post('/partner/apply', async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { paymentDetails } = req.body;

        if (!paymentDetails || paymentDetails.trim() === '') {
            return res.status(400).json({ error: 'Los datos de facturación no pueden estar vacíos' });
        }

        const partner = await Partner.findOneAndUpdate(
            { userId },
            { $set: { paymentDetails: paymentDetails.trim() } },
            { new: true }
        );

        if (!partner) {
            return res.status(404).json({ error: 'No eres socio partner registrado en el sistema.' });
        }

        return res.json({
            success: true,
            message: 'Tus datos de cobro han sido actualizados con éxito.',
            partner
        });
    } catch (err) {
        logger.error('[PartnerApply] Error:', err);
        return res.status(500).json({ error: 'Error al actualizar datos de cobro' });
    }
});

module.exports = router;
