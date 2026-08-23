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

/**
 * GET /api/referrals/public/ambassador-info/:slug
 * Public endpoint to fetch ambassador information for the landing/registration welcome banner
 */
router.get('/public/ambassador-info/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        if (!slug) {
            return res.status(400).json({ error: 'Slug requerido' });
        }
        const cleanSlug = slug.toLowerCase().trim();
        const Partner = mongoose.model('Partner');
        const User = mongoose.model('User');

        let partner = await Partner.findOne({ slug: cleanSlug }).lean();
        if (!partner) {
            const user = await User.findOne({ username: new RegExp(`^${cleanSlug}$`, 'i') }).lean();
            if (user) {
                partner = await Partner.findOne({ userId: user._id }).lean() || {
                    name: user.name,
                    slug: user.username,
                    email: user.email,
                    phone: user.phoneNumber || user.phone || '',
                    type: 'embajador'
                };
            }
        }

        if (!partner) {
            return res.status(404).json({ error: 'Embajador no encontrado' });
        }

        let phoneClean = (partner.phone || '').replace(/[^0-9]/g, '');
        if (phoneClean.length === 10 && phoneClean.startsWith('3')) {
            phoneClean = `57${phoneClean}`;
        }

        return res.json({
            name: partner.name || 'Asesor Comercial WAPPY',
            slug: partner.slug || cleanSlug,
            email: partner.email || '',
            phone: partner.phone || '',
            phoneClean,
            type: partner.type || 'embajador'
        });
    } catch (error) {
        logger.error('[PublicAmbassadorInfo] Error:', error);
        return res.status(500).json({ error: 'Error del servidor' });
    }
});

// All following endpoints in this router require authentication
router.use(requireJwtAuth);

// Helper to check if a user is an administrator
const checkIsAdmin = (user) => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    const email = (user.email || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    return role === 'ADMIN' || 
           role === 'ADMINISTRADOR' || 
           email === 'felix.bedoya15@gmail.com' || 
           email === 'wappyinteractivo@gmail.com' || 
           email === 'wappysst@gmail.com' || 
           email.includes('felix') || 
           username.includes('felix');
};

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

/**
 * GET /api/referrals/dashboard
 * Comprehensive metrics dashboard endpoint for Admins and Ambassadors/Partners
 */
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const User = mongoose.model('User');
        const userDoc = await User.findById(userId).lean();
        const isAdmin = checkIsAdmin(req.user) || checkIsAdmin(userDoc);

        const Partner = mongoose.model('Partner');
        const PartnerCommission = mongoose.model('PartnerCommission');
        const ReferralRecord = mongoose.model('ReferralRecord');
        const UserPlan = mongoose.model('UserPlan');

        let partner = await Partner.findOne({ userId }).lean();
        if (!partner && (userDoc?.username || req.user.username)) {
            const uname = (userDoc?.username || req.user.username).toLowerCase();
            partner = await Partner.findOne({ slug: uname }).lean();
        }
        const userRole = (userDoc?.role || req.user.role || '').toUpperCase();
        const isEmbajador = !!partner || userRole === 'EMBAJADOR' || userRole === 'EMBAJADOR_LIDER';
        const isLeader = isAdmin || (partner && partner.type === 'embajador') || userRole === 'EMBAJADOR_LIDER';

        // Check if user has referrals even if not in Partner collection
        const myReferralsCount = await ReferralRecord.countDocuments({
            $or: [
                { referredByUser: userId },
                ...(partner ? [{ referredByPartner: partner._id }] : [])
            ]
        });

        if (!isAdmin && !isEmbajador && myReferralsCount === 0) {
            return res.status(403).json({ error: 'Acceso restringido a Administradores y Embajadores.' });
        }

        const now = new Date();

        // 1. Fetch Referral Records
        let queryFilter = {};
        if (!isAdmin) {
            if (partner) {
                queryFilter = { $or: [{ referredByPartner: partner._id }, { referredByUser: userId }] };
            } else {
                queryFilter = { referredByUser: userId };
            }
        }

        const allReferrals = await ReferralRecord.find(queryFilter).sort({ createdAt: -1 }).lean();
        const referredUserIds = allReferrals.map(r => r.referredUserId);

        // Fetch user data & plans
        const users = await User.find({ _id: { $in: referredUserIds } }, 'name email username phone phoneNumber role accountStatus createdAt updatedAt inactiveAt activeAt departamento ciudad department city').lean();
        const userPlans = await UserPlan.find({ userId: { $in: referredUserIds } }).lean();
        const partnersMap = new Map();

        // Optional phone fallback from purchases
        let purchasePhoneMap = new Map();
        try {
            const ComunidadPurchase = mongoose.models.ComunidadPurchase || (mongoose.modelNames().includes('ComunidadPurchase') ? mongoose.model('ComunidadPurchase') : null);
            if (ComunidadPurchase) {
                const userEmails = users.map(u => u.email).filter(Boolean);
                const purchases = await ComunidadPurchase.find({ email: { $in: userEmails } }, 'email phone').lean();
                purchasePhoneMap = new Map(purchases.filter(p => p.phone).map(p => [(p.email || '').toLowerCase(), p.phone]));
            }
        } catch (err) {
            // safe fallback
        }

        const partnerIdsInRefs = allReferrals.map(r => r.referredByPartner).filter(Boolean);
        if (partnerIdsInRefs.length > 0) {
            const partnerDocs = await Partner.find({ _id: { $in: partnerIdsInRefs } }).populate('userId', 'name email').lean();
            partnerDocs.forEach(p => partnersMap.set(String(p._id), p));
        }

        const usersMap = new Map(users.map(u => [String(u._id), u]));
        const plansMap = new Map(userPlans.map(p => [String(p.userId), p]));

        // Calculate referred users metrics & traffic lights
        let activeProCount = 0;
        let expiringSoonCount = 0;
        let missingPhoneCount = 0;
        let inactiveCount = 0;

        const referredUsersList = allReferrals.map(rec => {
            const u = usersMap.get(String(rec.referredUserId)) || {};
            const plan = plansMap.get(String(rec.referredUserId));
            const partnerDoc = rec.referredByPartner ? partnersMap.get(String(rec.referredByPartner)) : null;

            const regDate = rec.createdAt || u.createdAt || now;
            const lastActivity = u.updatedAt || regDate;
            const daysInactive = Math.max(0, Math.floor((now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)));

            const userEmailNorm = (u.email || '').toLowerCase();
            const resolvedPhone = u.phoneNumber || u.phone || purchasePhoneMap.get(userEmailNorm) || '';

            const userRole = (u.role || '').toUpperCase();
            const rawPlan = plan?.plan;
            const expiresAt = plan?.planExpiresAt ? new Date(plan.planExpiresAt) : (u.inactiveAt ? new Date(u.inactiveAt) : null);
            let daysToExpiry = null;

            if (expiresAt && !isNaN(expiresAt.getTime())) {
                daysToExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            }

            const isExpired = daysToExpiry !== null && daysToExpiry < 0;

            // Trigger auto-downgrade in background if expired and still in non-free role
            if (isExpired && userRole !== 'USER' && userRole !== 'ADMIN' && userRole !== 'USER_IPEVAR') {
                const { downgradeUserIfExpired } = require('../services/planExpirationJob');
                downgradeUserIfExpired(u._id).catch(() => {});
            }

            let isPro = false;
            let planType = 'free';
            let planInterval = null;

            if (!isExpired && (userRole === 'USER_PRO' || userRole === 'PRO' || rawPlan === 'pro')) {
                isPro = true;
                planType = 'pro';
                const rawInt = (plan?.planInterval || plan?.interval || '').toLowerCase();
                if (rawInt === 'referral' || rawInt === 'trial' || rawInt === 'prueba' || rawInt === '15d') {
                    planInterval = 'prueba';
                } else if (plan?.interval && plan.interval !== 'referral') {
                    planInterval = plan.interval;
                } else if (u.inactiveAt) {
                    const start = u.activeAt ? new Date(u.activeAt) : (u.createdAt ? new Date(u.createdAt) : now);
                    const end = new Date(u.inactiveAt);
                    const durationDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    if (durationDays >= 300) {
                        planInterval = 'anual';
                    } else if (durationDays >= 140) {
                        planInterval = 'semestral';
                    } else if (durationDays >= 25) {
                        planInterval = 'mensual';
                    } else {
                        planInterval = 'prueba';
                    }
                } else {
                    planInterval = 'anual';
                }
            } else if (isExpired && (userRole === 'USER_PRO' || rawPlan === 'pro')) {
                // Expired PRO or Trial → Now Free
                planType = 'free';
                const rawInt = (plan?.planInterval || plan?.interval || '').toLowerCase();
                if (rawInt === 'referral' || rawInt === 'trial' || rawInt === 'prueba' || rawInt === '15d' || (u.inactiveAt && Math.round((new Date(u.inactiveAt).getTime() - new Date(u.createdAt || now).getTime()) / (1000 * 60 * 60 * 24)) <= 20)) {
                    planInterval = 'prueba_vencida';
                } else {
                    planInterval = 'vencido';
                }
            } else if (rawPlan === 'vital' || rawPlan === 'vitalicio' || userRole === 'USER_IPEVAR') {
                planType = 'vital';
                planInterval = null;
            }

            const isTrial = planInterval === 'prueba';
            let paymentStatus = 'unpaid';
            if (isPro) {
                if (isTrial) {
                    paymentStatus = 'trial';
                } else {
                    paymentStatus = 'paid';
                }
            } else if (isExpired) {
                paymentStatus = 'expired';
            }

            if (isPro) activeProCount++;
            if (daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 30) expiringSoonCount++;
            if (!resolvedPhone || resolvedPhone.trim() === '') missingPhoneCount++;
            if (daysInactive > 30) inactiveCount++;

            // Traffic light determination
            // 🟢 Verde: Usuario activo, pago al día, actividad reciente (<= 30 días)
            // 🟡 Amarillo: Vencimiento 8-30 días / sin actividad 30-90 días / En Prueba
            // 🔴 Rojo: Vencido / sin actividad > 90 días / pending > 7 días
            // ⚪ Gris: Freemium sin pago registrado
            // 🟣 Morado: Comisión pendiente de pago
            let trafficLight = 'gray';
            if (isPro) {
                if (daysToExpiry !== null && daysToExpiry <= 7) {
                    trafficLight = 'red';
                } else if (daysToExpiry !== null && daysToExpiry <= 30) {
                    trafficLight = 'yellow';
                } else if (isTrial) {
                    trafficLight = 'yellow';
                } else if (daysInactive <= 30) {
                    trafficLight = 'green';
                } else {
                    trafficLight = 'yellow';
                }
            } else if (isExpired) {
                trafficLight = 'red';
            } else if (daysInactive > 90 || u.accountStatus === 'pending') {
                trafficLight = 'red';
            } else if (daysInactive > 30) {
                trafficLight = 'yellow';
            }

            return {
                id: rec._id,
                userId: u._id,
                name: u.name || u.username || 'Usuario Wappy',
                email: u.email || 'Sin correo',
                phone: resolvedPhone,
                role: isExpired && userRole === 'USER_PRO' ? 'USER' : (u.role || 'USER'),
                accountStatus: u.accountStatus || 'active',
                registrationDate: regDate,
                lastActivity,
                daysInactive,
                subscriptionType: planType,
                planInterval,
                paymentStatus,
                planExpiresAt: expiresAt,
                daysToExpiry,
                trafficLight,
                crmStage: rec.crmStage || (isPro ? 'ganado' : isExpired ? 'frio' : 'nuevo'),
                crmNotes: rec.crmNotes || [],
                lastContactedAt: rec.lastContactedAt || null,
                nextFollowUpDate: rec.nextFollowUpDate || null,
                city: u.ciudad || u.city || '',
                department: u.departamento || u.department || '',
                ambassadorName: partnerDoc ? (partnerDoc.userId?.name || partnerDoc.slug) : 'Sin embajador',
                ambassadorSlug: partnerDoc?.slug || null,
                ambassadorId: partnerDoc?._id || null,
            };
        });

        // 2. Fetch Commissions
        let commQuery = {};
        if (!isAdmin && partner) {
            commQuery = { partnerId: partner._id };
        }

        const rawCommissions = await PartnerCommission.find(commQuery).sort({ createdAt: -1 }).lean();
        let totalCommissionsEarned = 0;
        let totalCommissionsPending = 0;
        let totalCommissionsPaid = 0;

        const commissionsList = rawCommissions.map(c => {
            const refUser = usersMap.get(String(c.referredUserId)) || {};
            const refPlan = plansMap.get(String(c.referredUserId));
            const rawPlan = refPlan?.plan;
            const isPro = refUser.role === 'USER_PRO' || rawPlan === 'pro';
            const expiresAt = refPlan?.planExpiresAt ? new Date(refPlan.planExpiresAt) : (refUser.inactiveAt ? new Date(refUser.inactiveAt) : null);
            let daysToExpiry = null;
            if (expiresAt && !isNaN(expiresAt.getTime())) {
                daysToExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            }

            let planType = rawPlan;
            if (!planType || planType === 'freemium' || planType === 'free') {
                if (isPro || c.amount >= 50000000) {
                    planType = 'pro';
                } else if (c.amount > 0) {
                    planType = 'vital';
                } else {
                    planType = 'free';
                }
            }

            let planInterval = null;
            if (planType === 'pro') {
                planInterval = refPlan?.interval || (c.amount >= 50000000 ? 'anual' : c.amount >= 25000000 ? 'semestral' : 'mensual');
            } else if (planType === 'free' || planType === 'freemium' || planType === 'vital' || planType === 'vitalicio') {
                planInterval = null; // Free & Vital plans are lifetime (vitalicio), no monthly/annual intervals
            }

            const lastActivity = refUser.updatedAt || refUser.createdAt || c.createdAt;
            const daysInactive = Math.max(0, Math.floor((now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)));

            const refEmailNorm = (refUser.email || '').toLowerCase();
            const resolvedRefPhone = refUser.phoneNumber || refUser.phone || purchasePhoneMap.get(refEmailNorm) || '';

            if (c.status !== 'cancelled') totalCommissionsEarned += c.commissionAmount || 0;
            if (c.status === 'pending') totalCommissionsPending += c.commissionAmount || 0;
            if (c.status === 'paid') totalCommissionsPaid += c.commissionAmount || 0;

            return {
                id: c._id,
                userId: refUser._id || c.referredUserId,
                referredUserName: refUser.name || refUser.username || 'Usuario',
                referredUserEmail: refUser.email || '',
                phone: resolvedRefPhone,
                role: refUser.role || 'USER',
                accountStatus: refUser.accountStatus || 'active',
                subscriptionType: planType,
                planInterval,
                planExpiresAt: expiresAt,
                daysToExpiry: daysToExpiry,
                lastActivity,
                daysInactive,
                amount: c.amount,
                commissionRate: c.commissionRate,
                commissionAmount: c.commissionAmount,
                status: c.status, // pending, approved, requested, paid, cancelled
                createdAt: c.createdAt,
            };
        });

        // 3. Network Metrics (for Leaders / Admin)
        let networkStats = [];
        let topAmbassador = null;
        let inactiveAmbassadorsCount = 0;

        if (isLeader) {
            const allPartners = await Partner.find({ status: 'approved' }).populate('userId', 'name email username updatedAt').lean();

            networkStats = await Promise.all(allPartners.map(async p => {
                const pRefs = await ReferralRecord.countDocuments({ referredByPartner: p._id });
                const pComms = await PartnerCommission.aggregate([
                    { $match: { partnerId: p._id, status: { $ne: 'cancelled' } } },
                    { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
                ]);
                const totalComm = pComms.length > 0 ? pComms[0].total : 0;

                const lastRef = await ReferralRecord.findOne({ referredByPartner: p._id }).sort({ createdAt: -1 }).lean();
                const daysSinceLastRef = lastRef ? Math.floor((now.getTime() - new Date(lastRef.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 999;

                if (daysSinceLastRef > 30) inactiveAmbassadorsCount++;

                return {
                    partnerId: p._id,
                    name: p.userId?.name || p.userId?.username || p.slug,
                    email: p.userId?.email || '',
                    slug: p.slug,
                    type: p.type || 'partner',
                    commissionRate: p.commissionRate || 0.20,
                    totalReferrals: pRefs,
                    totalCommission: totalComm,
                    daysSinceLastReferral: daysSinceLastRef === 999 ? 'Sin registros' : `${daysSinceLastRef} días`,
                };
            }));

            networkStats.sort((a, b) => b.totalReferrals - a.totalReferrals);
            if (networkStats.length > 0) {
                topAmbassador = networkStats[0];
            }
        }

        // Total system stats overview
        const totalRegisteredUsers = isAdmin ? await User.countDocuments() : referredUsersList.length;
        const totalGrowth7Days = referredUsersList.filter(u => (now.getTime() - new Date(u.registrationDate).getTime()) <= 7 * 24 * 60 * 60 * 1000).length;

        const origin = process.env.DOMAIN_CLIENT || `https://wappy.pe`;
        const myReferralLink = partner ? `${origin}/?ref=${partner.slug}` : `${origin}/?ref=${req.user.username || userId}`;

        return res.json({
            userRole: req.user.role,
            isAdmin,
            isLeader,
            isPartner: !!partner,
            partner,
            myReferralLink,
            kpis: {
                totalRegisteredUsers,
                totalReferred: referredUsersList.length,
                totalGrowth7Days,
                activeProCount,
                expiringSoonCount,
                missingPhoneCount,
                inactiveCount,
                totalCommissionsEarned,
                totalCommissionsPending,
                totalCommissionsPaid,
                inactiveAmbassadorsCount,
                topAmbassadorName: topAmbassador?.name || 'N/A',
            },
            referredUsers: referredUsersList,
            commissions: commissionsList,
            networkStats,
        });

    } catch (err) {
        logger.error('[ReferralsDashboard] Error:', err);
        return res.status(500).json({ error: 'Error al obtener el dashboard de métricas' });
    }
});

/**
 * POST /api/referrals/attribute
 * Assign or update ambassador attribution for a user (Admin only)
 * Optionally generates a retroactive commission for previous purchases
 */
router.post('/attribute', async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Solo los administradores pueden cambiar la atribución de embajadores.' });
        }

        const { 
            targetUserId, 
            partnerId, 
            createCommission, 
            transactionAmount, 
            commissionRate, 
            commissionAmount, 
            commissionStatus = 'pending',
            reassignExistingCommissions = true 
        } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ error: 'El ID de usuario objetivo es requerido.' });
        }

        const ReferralRecord = mongoose.model('ReferralRecord');
        const Partner = mongoose.model('Partner');
        const PartnerCommission = mongoose.model('PartnerCommission');
        const Notification = mongoose.models.Notification ? mongoose.model('Notification') : null;
        const User = mongoose.model('User');

        let partnerObj = null;
        if (partnerId) {
            partnerObj = await Partner.findById(partnerId);
            if (!partnerObj) {
                return res.status(404).json({ error: 'El embajador seleccionado no existe.' });
            }
        }

        let refRecord = await ReferralRecord.findOne({ referredUserId: targetUserId });
        if (!refRecord) {
            refRecord = new ReferralRecord({
                referredUserId: targetUserId,
                referredByPartner: partnerObj ? partnerObj._id : null,
                referredByUser: partnerObj ? partnerObj.userId : null,
                status: createCommission ? 'subscribed' : 'registered'
            });
        } else {
            refRecord.referredByPartner = partnerObj ? partnerObj._id : null;
            refRecord.referredByUser = partnerObj ? partnerObj.userId : null;
            if (createCommission) {
                refRecord.status = 'subscribed';
            }
        }

        await refRecord.save();

        let generatedCommission = null;

        // 1. Reassign existing commissions if requested and partnerId exists
        if (partnerObj && reassignExistingCommissions) {
            await PartnerCommission.updateMany(
                { referredUserId: targetUserId },
                { $set: { partnerId: partnerObj._id } }
            );
        }

        // 2. Create retroactive commission if selected
        if (partnerObj && createCommission) {
            const rawTxAmount = Number(transactionAmount) || 600000;
            const rate = Number(commissionRate) || (partnerObj.type === 'embajador' ? 0.30 : 0.20);
            const calculatedComm = Number(commissionAmount) || Math.round(rawTxAmount * rate);
            const status = ['pending', 'paid', 'approved'].includes(commissionStatus) ? commissionStatus : 'pending';

            const targetUser = await User.findById(targetUserId, 'name email').lean();

            generatedCommission = await PartnerCommission.create({
                partnerId: partnerObj._id,
                referredUserId: targetUserId,
                transactionId: `MANUAL_ATTR_${Date.now()}`,
                amount: rawTxAmount,
                commissionRate: rate,
                commissionAmount: calculatedComm,
                status: status,
                payoutDate: status === 'paid' ? new Date() : null
            });

            logger.info(`[ReferralsAttribute] Created retroactive commission of $${calculatedComm} COP for partner ${partnerObj.slug} on user ${targetUserId}`);

            if (Notification && partnerObj.userId) {
                try {
                    await Notification.create({
                        user: partnerObj.userId,
                        type: 'partner_commission_pending',
                        title: 'Comisión Asignada por Administrador',
                        body: `Se ha registrado una comisión de $${calculatedComm.toLocaleString('es-CO')} COP por la vinculación comercial del usuario ${targetUser?.name || 'Cliente'}.`,
                    });
                } catch (notifErr) {
                    // non-fatal
                }
            }
        }

        logger.info(`[ReferralsAttribute] Admin ${req.user.email} assigned User ${targetUserId} to Partner ${partnerObj ? partnerObj.slug : 'None'}`);

        return res.json({
            success: true,
            message: createCommission 
                ? 'Atribución actualizada y comisión retroactiva registrada correctamente.' 
                : 'Atribución de embajador actualizada correctamente.',
            refRecord,
            generatedCommission
        });
    } catch (err) {
        logger.error('[ReferralsAttribute] Error:', err);
        return res.status(500).json({ error: 'Error al actualizar la atribución del usuario' });
    }
});

// --- Campaign Email & WhatsApp Generation with AI ---
router.post('/email/generate', requireJwtAuth, async (req, res) => {
    const { 
        prompt, 
        model, 
        targetUserName, 
        targetUserPlan, 
        daysInactive = 0, 
        daysToExpiry = null, 
        subscriptionType = 'free', 
        planInterval = null,
        channel = 'email' 
    } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'La instrucción o prompt es requerido.' });
    }

    try {
        const { getSystemGoogleKey } = require('~/server/controllers/AdminMarketingController');
        const { GoogleGenerativeAI } = require('@google/generative-ai');

        const apiKey = await getSystemGoogleKey();
        if (!apiKey) {
            return res.status(400).json({ message: 'No hay claves API de Google / Gemini configuradas en el servidor.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const chosenModel = model || 'gemini-3.1-flash-lite';
        const modelInstance = genAI.getGenerativeModel({
            model: chosenModel,
            systemInstruction: `Eres un consultor comercial y especialista de éxito del cliente en WAPPY IA (wappy.club), la plataforma SaaS líder en Colombia para la automatización de la Seguridad y Salud en el Trabajo (SG-SST) con Inteligencia Artificial.
Tu objetivo es redactar un mensaje ${channel === 'whatsapp' ? 'de WhatsApp cercano, empático, altamente persuasivo y con emojis adecuados' : 'de correo electrónico profesional, claro, personalizado y con alto impacto'} dirigido a un usuario específico (${targetUserName || 'Usuario'}).

Contexto del usuario en la plataforma:
- Nombre: ${targetUserName || 'Usuario'}
- Plan / Rol: ${targetUserPlan || 'Free / Invitado'}
- Tipo de Suscripción: ${subscriptionType} (${planInterval || 'Estándar'})
- Inactividad en plataforma: ${daysInactive === 0 ? 'Activo hoy' : `Hace ${daysInactive} días sin actividad`}
- Estado de vigencia / vencimiento: ${daysToExpiry === null ? 'Vitalicio / Sin vencimiento' : daysToExpiry < 0 ? `Vencido hace ${Math.abs(daysToExpiry)} días` : `Quedan ${daysToExpiry} días de vigencia`}

Pautas clave según la intención:
1. Si el usuario tuvo 15 días de prueba gratis y vencieron (pero estuvo activo): Pregúntale cómo le fue automatizando sus matrices y evaluaciones SST, destaca el tiempo que ahorró e invítalo a continuar con Wappy Pro mes a mes o anual.
2. Si el usuario se registró pero nunca utilizó la plataforma o tiene muchos días inactivo: Sé empático, pregúntale si tuvo dudas técnicas o falta de tiempo, y ofrécele una breve asesoría/demo para apoyarlo a crear su primera matriz IPEVAR o PESV.
3. Si el usuario ya adquirió un plan: Dale una bienvenida cálida, ofrécele soporte prioritario y enséñale las mejores prácticas para sacarle el 100% de provecho a los agentes SST.
4. Si es aviso de novedades: Destaca las últimas innovaciones disponibles en Wappy (ej: Matrices IPEVAR interactivas, Coordinador PESV Res. 40595, Ingeniero Químico SGA, Auditorías en Vivo y Aula de Estudio LMS).
5. Si es aviso de vencimiento: Recuérdale con sentido de urgencia y cortesía los días restantes para que no interrumpa sus matrices y auditorías normativas.

${channel === 'whatsapp' ? `
Devuelve un JSON válido con la estructura:
{
  "whatsappText": "Texto completo del mensaje de WhatsApp para enviar al usuario, usando emojis adecuados, saludo cordial, preguntas abiertas y tono humano y profesional."
}
` : `
Devuelve un JSON válido con la estructura:
{
  "subject": "Asunto atractivo, claro y no genérico para el correo",
  "bodyHtml": "Cuerpo en formato HTML seguro (<p>, <strong>, <ul>, <li>, <br>, <h2>). NO incluyas <html> ni <body> tags.",
  "buttonText": "Texto sugerido para el botón CTA (ej: Renovar mi Plan PRO, Probar Nuevos Agentes)",
  "buttonUrl": "https://wappy.club/planes"
}
`}
Asegúrate de retornar únicamente el JSON parseable sin bloques de código markdown fuera del JSON.`,
        });

        const promptText = `Instrucción: "${prompt}". Canal: ${channel}. Usuario: ${targetUserName || 'Usuario'}. Estado: ${targetUserPlan}. Días Inactivo: ${daysInactive}. Días a Expirar: ${daysToExpiry}.`;
        const result = await modelInstance.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: {
                responseMimeType: 'application/json',
            }
        });

        const responseText = result.response.text();
        const parsedData = JSON.parse(responseText);

        return res.status(200).json(parsedData);
    } catch (error) {
        logger.error('[ReferralEmailGenerate] Error generating message with Gemini:', error);
        return res.status(500).json({ message: `Error al generar contenido con la IA: ${error.message}` });
    }
});

// --- Send Campaign Email to Referred User ---
router.post('/email/send', requireJwtAuth, async (req, res) => {
    const { targetUserId, targetEmail, subject, bodyHtml, buttonText, buttonUrl, theme = 'slate' } = req.body;

    if (!subject || !bodyHtml) {
        return res.status(400).json({ message: 'El asunto y el cuerpo del correo son requeridos.' });
    }
    if (!targetEmail) {
        return res.status(400).json({ message: 'El correo electrónico destinatario es requerido.' });
    }

    try {
        const User = mongoose.model('User');
        const ReferralRecord = mongoose.model('ReferralRecord');
        const Partner = mongoose.model('Partner');
        const sendEmail = require('~/server/utils/sendEmail');
        const { THEMES } = require('~/server/controllers/AdminMarketingController');

        const userId = req.user.id;
        const userDoc = await User.findById(userId).lean();
        const isAdmin = checkIsAdmin(req.user) || checkIsAdmin(userDoc);

        // Check permission: If not admin, verify target user belongs to this partner
        if (!isAdmin) {
            const partner = await Partner.findOne({ userId });
            if (!partner) {
                return res.status(403).json({ message: 'No tienes permisos de embajador comercial para enviar correos.' });
            }

            if (targetUserId) {
                const isReferred = await ReferralRecord.findOne({
                    referredUserId: targetUserId,
                    referredByPartner: partner._id,
                });
                if (!isReferred) {
                    return res.status(403).json({ message: 'Solo puedes enviar correos a tus propios usuarios referidos.' });
                }
            }
        }

        const recipientUser = targetUserId ? await User.findById(targetUserId).lean() : await User.findOne({ email: targetEmail }).lean();
        const recipientName = recipientUser?.name || recipientUser?.username || 'Usuario';

        const partner = await Partner.findOne({ userId }).lean();
        const ambassadorName = req.body.ambassadorName || partner?.name || req.user.name || 'Asesor Comercial WAPPY';
        const ambassadorEmail = partner?.email || req.user.email || 'soporte@wappy.club';
        const ambassadorPhone = req.body.ambassadorPhone || partner?.phone || req.user.phoneNumber || req.user.phone || '';
        let cleanPhone = (ambassadorPhone || '').replace(/[^0-9]/g, '');
        if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
            cleanPhone = `57${cleanPhone}`;
        }
        const refLink = req.body.referralLink || (partner ? `https://wappy-ia.com/?ref=${partner.slug}` : 'https://wappy.club');

        const themeConfig = THEMES[theme] || THEMES.slate;
        const year = new Date().getFullYear();

        await sendEmail({
            email: targetEmail,
            subject: subject,
            template: 'marketingEmail.handlebars',
            payload: {
                name: recipientName,
                title: subject,
                body: bodyHtml,
                buttonText: buttonText || 'Ver más',
                buttonUrl: buttonUrl || '',
                year,
                ambassador: {
                    name: ambassadorName,
                    email: ambassadorEmail,
                    phone: ambassadorPhone,
                    phoneClean: cleanPhone,
                    referralLink: refLink,
                },
                ...themeConfig,
            }
        });

        logger.info(`[ReferralEmailSend] Correo enviado por ${req.user.email} a ${targetEmail} (${recipientName})`);

        // Automatically log interaction in CRM
        if (targetUserId || recipientUser) {
            try {
                const searchUid = targetUserId || recipientUser._id;
                await ReferralRecord.findOneAndUpdate(
                    { referredUserId: searchUid },
                    {
                        $set: { 
                            lastContactedAt: new Date(),
                            crmStage: 'contactado'
                        },
                        $push: {
                            crmNotes: {
                                author: req.user.name || 'Asesor Comercial',
                                text: `📧 Correo de campaña enviado: "${subject}"`,
                                type: 'email',
                                createdAt: new Date()
                            }
                        }
                    }
                );
            } catch (crmErr) {
                logger.warn('[ReferralEmailSend] Non-fatal CRM log error:', crmErr);
            }
        }

        return res.status(200).json({ success: true, message: 'Correo enviado exitosamente.' });
    } catch (error) {
        logger.error('[ReferralEmailSend] Error:', error);
        return res.status(500).json({ message: `Error al enviar correo: ${error.message}` });
    }
});

// --- Send Official Commercial Proposal by Email ---
router.post('/proposal/send-email', requireJwtAuth, async (req, res) => {
    const { clientEmail, proposal } = req.body;

    if (!clientEmail || !clientEmail.trim() || !clientEmail.includes('@')) {
        return res.status(400).json({ message: 'Ingresa un correo electrónico válido para enviar la propuesta comercial.' });
    }
    if (!proposal || !proposal.companyName || !proposal.proposalCode) {
        return res.status(400).json({ message: 'Los datos de la propuesta comercial son incompletos.' });
    }

    try {
        const sendEmail = require('~/server/utils/sendEmail');
        const User = mongoose.model('User');
        const ReferralRecord = mongoose.model('ReferralRecord');
        const year = new Date().getFullYear();

        const formattedPlans = (proposal.investmentPlans || []).map(p => ({
            ...p,
            finalPriceFormatted: (p.finalPrice || 0).toLocaleString('es-CO'),
            pricePerMonthFormatted: (p.pricePerMonth || 0).toLocaleString('es-CO'),
        }));

        const advisorPhone = proposal.ambassadorData?.phone || '';
        let cleanPhone = advisorPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
            cleanPhone = `57${cleanPhone}`;
        }

        const subject = `📄 Propuesta Comercial Oficial WAPPY IA - ${proposal.companyName} (${proposal.proposalCode})`;

        await sendEmail({
            email: clientEmail.trim(),
            subject: subject,
            template: 'commercialProposalEmail.handlebars',
            payload: {
                title: proposal.title || 'Propuesta Comercial: Transformación y Automatización SG-SST',
                proposalCode: proposal.proposalCode,
                companyName: proposal.companyName,
                companyNit: proposal.companyNit || '',
                sector: proposal.sector || 'Servicios / General',
                employeeCount: proposal.employeeCount || '11-50',
                executiveSummary: proposal.executiveSummary || '',
                sectorDiagnosis: proposal.sectorDiagnosis || '',
                includedModules: proposal.includedModules || [],
                investmentPlans: formattedPlans,
                roiAnalysis: proposal.roiAnalysis || null,
                ambassadorName: proposal.ambassadorData?.name || req.user.name || 'Asesor Comercial Wappy',
                ambassadorPhone: advisorPhone,
                ambassadorPhoneClean: cleanPhone,
                ambassadorEmail: proposal.ambassadorData?.email || req.user.email || 'contacto@wappy.club',
                year,
            }
        });

        logger.info(`[ProposalEmailSend] Propuesta ${proposal.proposalCode} enviada a ${clientEmail} por ${req.user.email}`);

        // Automatically record proposal event in CRM if this email is a user or in referrals
        try {
            const clientUser = await User.findOne({ email: clientEmail.trim().toLowerCase() }).lean();
            if (clientUser) {
                await ReferralRecord.findOneAndUpdate(
                    { referredUserId: clientUser._id },
                    {
                        $set: { 
                            lastContactedAt: new Date(),
                            crmStage: 'propuesta'
                        },
                        $push: {
                            crmNotes: {
                                author: req.user.name || 'Asesor Comercial',
                                text: `📄 Propuesta Comercial Oficial (${proposal.proposalCode}) enviada por correo electrónico a ${clientEmail}.`,
                                type: 'proposal',
                                createdAt: new Date()
                            }
                        }
                    }
                );
            }
        } catch (crmErr) {
            logger.warn('[ProposalEmailSend] Non-fatal CRM log error:', crmErr);
        }

        return res.status(200).json({ 
            success: true, 
            message: `Propuesta comercial ${proposal.proposalCode} enviada exitosamente a ${clientEmail}.` 
        });
    } catch (error) {
        logger.error('[ProposalEmailSend] Error sending proposal email:', error);
        return res.status(500).json({ message: `Error al enviar el correo de propuesta: ${error.message}` });
    }
});

// --- Commercial Proposal Generation with AI ---
router.post('/proposal/generate', requireJwtAuth, async (req, res) => {
    const { 
        companyName, 
        companyNit, 
        sector = 'Servicios / General', 
        employeeCount = '11-50', 
        proposalScope = 'Implementación y Automatización SG-SST con IA',
        selectedPlans = ['anual'],
        customDiscount = 0,
        customObservations = '',
        ambassadorName,
        ambassadorPhone,
        ambassadorEmail,
        referralLink
    } = req.body;

    if (!companyName || !companyName.trim()) {
        return res.status(400).json({ message: 'El nombre de la empresa cliente es requerido.' });
    }

    try {
        const { getSystemGoogleKey } = require('~/server/controllers/AdminMarketingController');
        const { GoogleGenerativeAI } = require('@google/generative-ai');

        const apiKey = await getSystemGoogleKey();
        if (!apiKey) {
            return res.status(400).json({ message: 'No hay claves API de Google / Gemini configuradas en el servidor.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelInstance = genAI.getGenerativeModel({
            model: 'gemini-3.1-flash-lite',
            systemInstruction: `Eres el Director Comercial Senior y Consultor Líder en SST de WAPPY IA (wappy.club / wappy-ia.com), la plataforma SaaS líder en Colombia y Latinoamérica para la automatización de la Seguridad y Salud en el Trabajo mediante Inteligencia Artificial.
Tu misión es generar una PROPUESTA COMERCIAL EJECUTIVA, ALTAMENTE PERSUASIVA, TÉCNICAMENTE IMPECABLE Y TOTALMENTE PERSONALIZADA para la empresa cliente.

La propuesta debe reflejar estricto cumplimiento normativo en Colombia (Decreto 1072 de 2015, Resolución 0312 de 2019, Ley 1562 de 2012, Resolución 20223040040595 para PESV y Sistema Globalmente Armonizado SGA).

Devuelve EXCLUSIVAMENTE un JSON válido con esta estructura exacta:
{
  "title": "Propuesta Comercial: Transformación y Automatización del SG-SST con Inteligencia Artificial",
  "proposalCode": "WAP-PROP-2026-XXXX",
  "executiveSummary": "Párrafo ejecutivo de alto impacto explicando cómo WAPPY IA revolucionará la gestión SST de la empresa, ahorrando tiempo y garantizando cumplimiento total.",
  "sectorDiagnosis": "Análisis específico para el sector de la empresa, identificando sus desafíos críticos de SST y riesgos principales.",
  "includedModules": [
    {
      "title": "Nombre del Módulo o Agente Especializado (ej: Matriz IPEVAR Live, Coordinador PESV, Ingeniero Químico SGA, Auditor SST)",
      "description": "Descripción clara del alcance y funcionalidad técnica.",
      "benefits": "Beneficio directo y ahorro operativo para la empresa."
    }
  ],
  "roiAnalysis": {
    "timeSavedHoursPerMonth": "45-60 horas/mes",
    "estimatedSavingsCop": "$2.800.000 COP / mes en consultoría y horas operativas",
    "qualitativeBenefits": [
      "Auditorías listas en minutos",
      "Cero sanciones ante visitas del Ministerio del Trabajo",
      "Actualizaciones normativas automáticas en tiempo real"
    ]
  },
  "implementationTimeline": [
    { "phase": "Fase 1: Configuración & Acceso", "time": "Día 1", "description": "Creación de cuentas, perfil de empresa y diagnóstico inicial." },
    { "phase": "Fase 2: Adopción & Matrices", "time": "Semana 1", "description": "Generación y sincronización de IPEVAR, PESV y formatos corporativos." },
    { "phase": "Fase 3: Auditorías & Autonomía", "time": "Semana 2 en adelante", "description": "Acompañamiento continuo y simulacros de auditoría con IA." }
  ],
  "termsAndConditions": [
    "Vigencia de la propuesta: 15 días calendario a partir de la fecha de emisión.",
    "Acceso inmediato a la plataforma 24/7 en la nube tras la confirmación del pago.",
    "Actualizaciones ilimitadas de agentes y modelos de IA incluidos durante el periodo de suscripción.",
    "Soporte comercial y técnico prioritario por parte del embajador asignado."
  ],
  "closingMessage": "Mensaje final persuasivo invitando a la toma de decisión y activación del servicio."
}
Solo entrega el JSON parseable sin explicaciones adicionales.`,
        });

        const promptText = `
Datos de la Empresa Cliente:
- Razón Social: ${companyName}
- NIT: ${companyNit || 'En trámite / No especificado'}
- Sector Económico: ${sector}
- Tamaño / Trabajadores: ${employeeCount}
- Alcance Solicitado: ${proposalScope}
- Planes de Interés: ${selectedPlans.join(', ')}
- Descuento Especial: ${customDiscount}%
- Observaciones Adicionales: ${customObservations || 'Ninguna'}
- Asesor Comercial Wappy: ${ambassadorName || req.user.name || 'Asesor WAPPY'}
- Link de Activación: ${referralLink || 'https://wappy.club'}
`;

        const result = await modelInstance.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: {
                responseMimeType: 'application/json',
            }
        });

        const responseText = result.response.text();
        const parsedData = JSON.parse(responseText);

        // Calculate investment table with prices
        // Calculate investment table with official platform prices
        const PRICING_CATALOG = {
            anual: {
                name: 'Plan Wappy PRO Anual',
                intervalLabel: '12 Meses (Anual)',
                regularPrice: 1200000,
                pricePerMonth: 100000,
                features: [
                    'Acceso total a todos los Agentes y Asistentes SST',
                    'Matrices IPEVAR & PESV Ilimitadas con IA',
                    'Gestión de Sustancias Químicas SGA y RIT',
                    'Auditorías en Vivo con IA y Generación de Formatos',
                    'Aula de Estudio LMS y Certificaciones Oficiales',
                    'Soporte Prioritario VIP y Asesoría Continuada'
                ],
                isRecommended: true
            },
            semestral: {
                name: 'Plan Wappy PRO Semestral',
                intervalLabel: '6 Meses (Semestral)',
                regularPrice: 641960,
                pricePerMonth: 106993,
                features: [
                    'Acceso a todos los Agentes SST',
                    'Matrices IPEVAR & PESV con IA',
                    'SGA Químico y RIT',
                    'Auditorías en Vivo con IA',
                    'Soporte Asignado'
                ],
                isRecommended: false
            },
            trimestral: {
                name: 'Plan Wappy PRO Trimestral',
                intervalLabel: '3 Meses (Trimestral)',
                regularPrice: 331270,
                pricePerMonth: 110423,
                features: [
                    'Acceso a Agentes SST',
                    'Matrices IPEVAR & Formatos',
                    'Auditorías en Vivo con IA',
                    'Soporte Estándar'
                ],
                isRecommended: false
            },
            mensual: {
                name: 'Plan Wappy PRO Mensual',
                intervalLabel: '1 Mes (Mensual)',
                regularPrice: 114330,
                pricePerMonth: 114330,
                features: [
                    'Acceso a Agentes SST',
                    'Generación de Matrices y Formatos',
                    'Soporte Estándar'
                ],
                isRecommended: false
            },
            vital: {
                name: 'Plan Wappy Vital (Acceso de Por Vida)',
                intervalLabel: 'Pago Único Vitalicio',
                regularPrice: 350000,
                pricePerMonth: 0,
                features: [
                    'Pago único de por vida (Sin mensualidades)',
                    'Hasta 20 chats diarios con Agentes SST',
                    'Acceso a Comunidad y Soporte Básico'
                ],
                isRecommended: false
            }
        };

        const discount = Math.min(20, Math.max(0, Number(customDiscount) || 0));
        const investmentPlans = (selectedPlans.length > 0 ? selectedPlans : ['anual']).map(pKey => {
            const p = PRICING_CATALOG[pKey] || PRICING_CATALOG.anual;
            const finalPrice = discount > 0 ? Math.round(p.regularPrice * (1 - (discount / 100))) : p.regularPrice;
            const finalPerMonth = pKey === 'anual' 
                ? Math.round(finalPrice / 12) 
                : pKey === 'semestral' 
                    ? Math.round(finalPrice / 6) 
                    : pKey === 'trimestral' 
                        ? Math.round(finalPrice / 3) 
                        : pKey === 'vital' 
                            ? 0 
                            : finalPrice;
            return {
                key: pKey,
                planName: p.name,
                interval: p.intervalLabel,
                regularPrice: p.regularPrice,
                discountPercentage: discount,
                finalPrice: finalPrice,
                pricePerMonth: finalPerMonth,
                features: p.features,
                isRecommended: p.isRecommended,
                paymentUrl: referralLink || 'https://wappy.club/planes'
            };
        });

        const proposalCode = `WAP-PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        return res.status(200).json({
            ...parsedData,
            proposalCode: parsedData.proposalCode || proposalCode,
            companyName,
            companyNit: companyNit || '',
            sector,
            employeeCount,
            investmentPlans,
            ambassadorData: {
                name: ambassadorName || req.user.name || 'Asesor Comercial Wappy',
                phone: ambassadorPhone || '',
                email: ambassadorEmail || req.user.email || 'contacto@wappy.club',
                referralLink: referralLink || 'https://wappy.club'
            },
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[ReferralProposalGenerate] Error generating commercial proposal:', error);
        return res.status(500).json({ message: `Error al generar la propuesta comercial: ${error.message}` });
    }
});

// --- CRM: Update Stage in Pipeline (Kanban) ---
router.post('/crm/update-stage', requireJwtAuth, async (req, res) => {
    const { targetUserId, newStage, stageLabel } = req.body;

    const validStages = ['nuevo', 'contactado', 'interesado', 'propuesta', 'ganado', 'frio', 'invalido'];
    if (!targetUserId || !validStages.includes(newStage)) {
        return res.status(400).json({ message: 'ID de usuario o etapa inválida.' });
    }

    try {
        const ReferralRecord = mongoose.model('ReferralRecord');
        const STAGE_NAMES = {
            nuevo: 'Sin Contactar',
            contactado: 'Contactado',
            interesado: 'Interesado / En Negociación',
            propuesta: 'Propuesta Enviada',
            ganado: 'Cerrado PRO',
            frio: 'No Interesado / Frío',
            invalido: 'Contacto Inválido'
        };

        const noteText = `🏷️ Etapa cambiada a: "${stageLabel || STAGE_NAMES[newStage] || newStage}"`;

        const updatedRecord = await ReferralRecord.findOneAndUpdate(
            { referredUserId: targetUserId },
            {
                $set: { crmStage: newStage },
                $push: {
                    crmNotes: {
                        author: req.user.name || 'Asesor Comercial',
                        text: noteText,
                        type: 'status_change',
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!updatedRecord) {
            return res.status(404).json({ message: 'Registro de referido no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            crmStage: updatedRecord.crmStage,
            crmNotes: updatedRecord.crmNotes,
            message: `Etapa actualizada a ${STAGE_NAMES[newStage]}.`
        });
    } catch (error) {
        logger.error('[ReferralCrmUpdateStage] Error:', error);
        return res.status(500).json({ message: `Error al actualizar la etapa: ${error.message}` });
    }
});

// --- CRM: Add Follow-up Note / Task ---
router.post('/crm/add-note', requireJwtAuth, async (req, res) => {
    const { targetUserId, text, type = 'note' } = req.body;

    if (!targetUserId || !text || !text.trim()) {
        return res.status(400).json({ message: 'Usuario y texto de la nota son requeridos.' });
    }

    try {
        const ReferralRecord = mongoose.model('ReferralRecord');
        const validTypes = ['whatsapp', 'email', 'call', 'note', 'proposal', 'status_change'];
        const noteType = validTypes.includes(type) ? type : 'note';

        const updatedRecord = await ReferralRecord.findOneAndUpdate(
            { referredUserId: targetUserId },
            {
                $set: { lastContactedAt: new Date() },
                $push: {
                    crmNotes: {
                        author: req.user.name || 'Asesor Comercial',
                        text: text.trim(),
                        type: noteType,
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!updatedRecord) {
            return res.status(404).json({ message: 'Registro de referido no encontrado.' });
        }

        return res.status(200).json({
            success: true,
            crmNotes: updatedRecord.crmNotes,
            lastContactedAt: updatedRecord.lastContactedAt,
            message: 'Nota de seguimiento guardada exitosamente.'
        });
    } catch (error) {
        logger.error('[ReferralCrmAddNote] Error:', error);
        return res.status(500).json({ message: `Error al agregar nota: ${error.message}` });
    }
});

module.exports = router;

