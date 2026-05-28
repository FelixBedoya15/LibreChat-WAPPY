const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');

/**
 * Centralized service to handle referrals and affiliate commissions
 * when a user purchases a plan successfully.
 */
const processSuccessfulPurchase = async ({ userId, transactionId, planId, interval, amountInCents }) => {
    try {
        const ReferralRecord = require('~/models/ReferralRecord');
        const Partner = require('~/models/Partner');
        const PartnerCommission = require('~/models/PartnerCommission');
        const PointTransaction = require('~/models/PointTransaction');
        const Notification = require('~/models/Notification');
        const User = mongoose.model('User');

        logger.info(`[ReferralService] Processing purchase for user ${userId}, plan ${planId}|${interval}, tx: ${transactionId}`);

        // Find if this user was referred by someone and is still in 'registered' status
        const referral = await ReferralRecord.findOne({ referredUserId: userId, status: 'registered' });
        if (!referral) {
            logger.info(`[ReferralService] No pending referral record found for user ${userId}. Skipping referral actions.`);
            return;
        }

        // Update status to subscribed
        referral.status = 'subscribed';
        await referral.save();

        // 1. Process Partner Affiliate Commission
        if (referral.referredByPartner) {
            const partner = await Partner.findById(referral.referredByPartner);
            if (partner && partner.active) {
                // Default rates: 30% for embajador, 20% for partner
                const defaultRate = partner.type === 'embajador' ? 0.30 : 0.20;
                const commissionRate = partner.commissionRate !== undefined ? partner.commissionRate : defaultRate;
                const commissionAmount = Math.round(amountInCents * commissionRate);

                await PartnerCommission.create({
                    partnerId: partner._id,
                    referredUserId: userId,
                    transactionId: transactionId,
                    amount: amountInCents,
                    commissionRate: commissionRate,
                    commissionAmount: commissionAmount,
                    status: 'pending'
                });

                const partnerTierName = partner.type === 'embajador' ? 'Wappy Embajador' : 'Wappy Partner';
                logger.info(`[ReferralService] Generated pending commission for ${partnerTierName} ${partner.slug}: ${commissionAmount} cents (Tx: ${transactionId})`);

                // Notify the partner user in-app
                try {
                    await Notification.create({
                        user: partner.userId,
                        type: 'partner_commission_pending',
                        title: `Comisión de ${partnerTierName} Registrada (Pendiente)`,
                        body: `¡Felicidades! Un usuario referido por ti se ha suscrito. Tienes una nueva comisión acumulada de $${(commissionAmount / 100).toLocaleString('es-CO')} en revisión.${partner.type === 'embajador' ? ' ¡Gracias por brindar tu excelente soporte!' : ''}`
                    });
                } catch (notifErr) {
                    logger.error('[ReferralService] Error creating partner notification:', notifErr);
                }
            }
        }

        // 2. Process User Referral Points Earning
        if (referral.referredByUser) {
            const referrer = await User.findById(referral.referredByUser);
            if (referrer) {
                // Determine points dynamically based on the plan's interval
                let pointsToAward = 250; // Default (monthly)
                if (interval === 'quarterly') pointsToAward = 450;
                else if (interval === 'semiannual') pointsToAward = 600;
                else if (interval === 'annual') pointsToAward = 800; // Annual awards 1 month of free PRO (800 points)

                await PointTransaction.create({
                    userId: referrer._id,
                    points: pointsToAward,
                    type: 'referral_purchase',
                    description: `Tu amigo se suscribió al plan PRO (${interval === 'annual' ? 'Anual' : interval === 'semiannual' ? 'Semestral' : interval === 'quarterly' ? 'Trimestral' : 'Mensual'})`,
                    metadata: { referredUserId: userId, planId, interval }
                });

                logger.info(`[ReferralService] Awarded ${pointsToAward} referral points to user ${referrer.email} for purchase by ${userId}`);

                // Notify the referrer user in-app
                try {
                    await Notification.create({
                        user: referrer._id,
                        type: 'referral_points_earned',
                        title: '¡Has Ganado Puntos de Regalo! 🎁',
                        body: `¡Tu amigo se ha suscrito con éxito! Has recibido ${pointsToAward} Puntos Wappy. Canjea tus puntos por semanas o meses de Plan PRO gratis en tu Cuenta.`
                    });
                } catch (notifErr) {
                    logger.error('[ReferralService] Error creating referrer notification:', notifErr);
                }
            }
        }

    } catch (err) {
        logger.error('[ReferralService] Error processing successful purchase:', err);
    }
};

module.exports = {
    processSuccessfulPurchase
};
