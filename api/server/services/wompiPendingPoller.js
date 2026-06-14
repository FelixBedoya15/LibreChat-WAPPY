/**
 * wompiPendingPoller.js
 * ─────────────────────
 * Background job that polls Wompi's API every 30 minutes for
 * PENDING transactions. This is necessary for asynchronous payment
 * methods like "Compra y Paga Después" (Bancolombia Buy Now Pay Later),
 * where Bancolombia evaluates the customer's credit limit and may take
 * up to 72 hours to approve/decline. The Wompi widget returns PENDING
 * to the frontend, so we cannot rely solely on the frontend callback.
 *
 * Flow:
 *  1. Every 30 min, find all WompiTransactions with status = 'PENDING'
 *     that are less than 72 hours old (after that Wompi auto-expires them).
 *  2. For each, call GET /v1/transactions/{transactionId} on Wompi API.
 *  3. If APPROVED → provision plan via calculateProratedExpiry (same logic as webhook).
 *  4. If DECLINED/VOIDED/ERROR → mark as such so we stop polling.
 *  5. If still PENDING → do nothing, will retry on next cycle.
 */

const mongoose = require('mongoose');

const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_AGE_HOURS = 72; // Wompi expires PENDING txs after 72h

let pollerTimer = null;

const runPollCycle = async () => {
    try {
        const WompiTransaction = require('~/models/WompiTransaction');
        const UserPlan = require('~/db/models/UserPlan');
        const Plan = require('~/models/Plan');

        const isSandbox = process.env.WOMPI_PUBLIC_KEY?.startsWith('pub_test_');
        const wompiDomain = isSandbox ? 'sandbox.wompi.co' : 'production.wompi.co';

        // Only poll transactions younger than 72 hours
        const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

        const pendingTxs = await WompiTransaction.find({
            status: 'PENDING',
            createdAt: { $gte: cutoff },
            transactionId: { $exists: true, $ne: null }, // must have a transactionId to query
        }).lean();

        if (pendingTxs.length === 0) {
            return; // nothing to do
        }

        console.log(`[WompiPoller] Checking ${pendingTxs.length} pending transaction(s)...`);

        // ── Inline proration helper (same logic as WompiController) ──────────────
        const getIntervalDays = (interval) => {
            if (interval === 'daily') return 1;
            if (interval === 'weekly') return 7;
            if (interval === 'quarterly') return 90;
            if (interval === 'semiannual') return 180;
            if (interval === 'annual') return 365;
            if (interval === 'lifetime') return 36500;
            return 30;
        };

        const calculateProratedExpiry = async (planId, interval, userPlan) => {
            const now = new Date();
            const newIntervalDays = getIntervalDays(interval);

            if (!userPlan || !userPlan.planExpiresAt || userPlan.planExpiresAt <= now) {
                return new Date(now.getTime() + newIntervalDays * 24 * 60 * 60 * 1000);
            }

            if (userPlan.plan === planId) {
                return new Date(userPlan.planExpiresAt.getTime() + newIntervalDays * 24 * 60 * 60 * 1000);
            }

            const [oldPlanDb, newPlanDb] = await Promise.all([
                Plan.findOne({ planId: userPlan.plan }).lean(),
                Plan.findOne({ planId }).lean(),
            ]);

            if (!oldPlanDb || !newPlanDb) {
                return new Date(now.getTime() + newIntervalDays * 24 * 60 * 60 * 1000);
            }

            const oldDailyValue = (oldPlanDb.prices?.monthly || 0) / 30;
            const newTotalPrice = newPlanDb.prices?.[interval] || newPlanDb.prices?.monthly || 1;
            const newDailyValue = newTotalPrice / newIntervalDays;
            const remainingDaysOld = Math.max(0, (userPlan.planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const compensatedExtraDays = newDailyValue > 0 ? (remainingDaysOld * oldDailyValue) / newDailyValue : 0;

            return new Date(now.getTime() + (newIntervalDays + compensatedExtraDays) * 24 * 60 * 60 * 1000);
        };

        // ── Poll each pending transaction ─────────────────────────────────────────
        for (const tx of pendingTxs) {
            try {
                if (!tx.transactionId) continue;

                const response = await fetch(`https://${wompiDomain}/v1/transactions/${tx.transactionId}`);
                if (!response.ok) continue;

                const result = await response.json();
                const txData = result?.data;
                if (!txData) continue;

                const newStatus = txData.status; // APPROVED, DECLINED, VOIDED, ERROR, PENDING

                if (newStatus === 'PENDING') continue; // Still waiting

                // Update the stored transaction status
                await WompiTransaction.updateOne(
                    { _id: tx._id },
                    { $set: { status: newStatus } }
                );

                if (newStatus === 'APPROVED') {
                    const User = mongoose.model('User');

                    let userId = tx.userId;
                    if (!userId && tx.guestEmail) {
                        const normEmail = tx.guestEmail.toLowerCase().trim();
                        let user = await User.findOne({ email: normEmail });
                        if (!user) {
                            const { createUser } = require('~/models');
                            const { getAppConfig } = require('~/server/services/Config');
                            const appConfig = await getAppConfig();
                            const bcrypt = require('bcryptjs');

                            let username = normEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
                            let userWithUsername = await User.findOne({ username });
                            if (userWithUsername) {
                                username = `${username}${Math.floor(1000 + Math.random() * 9000)}`;
                            }

                            const newUserData = {
                                provider: 'local',
                                email: normEmail,
                                username,
                                name: tx.guestName.trim(),
                                phoneNumber: tx.guestPhone ? tx.guestPhone.trim() : '',
                                avatar: null,
                                role: 'USER',
                                accountStatus: 'active',
                                password: tx.guestPassword, // already hashed
                            };

                            user = await createUser(newUserData, appConfig?.balance, true, true);
                            console.log(`[WompiPoller] Auto-created user ${user._id} (${normEmail}) for guest checkout after payment approval`);
                        }
                        userId = user._id;
                        await WompiTransaction.updateOne(
                            { _id: tx._id },
                            { $set: { userId } }
                        );
                    }

                    let userPlan = await UserPlan.findOne({ userId });
                    const expiryDate = await calculateProratedExpiry(tx.planId, tx.interval, userPlan);

                    if (!userPlan) {
                        userPlan = new UserPlan({ userId });
                    }
                    userPlan.plan = tx.planId;
                    userPlan.planExpiresAt = expiryDate;
                    await userPlan.save();

                    let newRole = 'USER';
                    if (tx.planId === 'custom') newRole = 'USER_CUSTOM';
                    else if (tx.planId === 'ipevar') newRole = 'USER_IPEVAR';
                    else if (tx.planId === 'go') newRole = 'USER_GO';
                    else if (tx.planId === 'plus') newRole = 'USER_PLUS';
                    else if (tx.planId === 'pro') newRole = 'USER_PRO';

                    await User.updateOne(
                        { _id: userId },
                        { $set: { role: newRole, activeAt: new Date(), inactiveAt: expiryDate } }
                    );

                    // If custom plan, store tools
                    if (tx.planId === 'custom' && tx.customTools?.length > 0) {
                        await UserPlan.updateOne(
                            { userId },
                            { $set: { customTools: tx.customTools, customInterval: tx.interval } }
                        );
                    }

                    console.log(`[WompiPoller] ✅ APPROVED (async): plan ${tx.planId} provisioned for user ${userId}. Expiry: ${expiryDate.toISOString()}`);

                    // Trigger referral/affiliate commission & points processing
                    try {
                        const { processSuccessfulPurchase } = require('~/server/services/ReferralService');
                        await processSuccessfulPurchase({
                            userId: tx.userId,
                            transactionId: tx.transactionId,
                            planId: tx.planId,
                            interval: tx.interval,
                            amountInCents: tx.amountInCents
                        });
                    } catch (refErr) {
                        console.error('[WompiPoller] Error triggering processSuccessfulPurchase:', refErr);
                    }
                } else {
                    console.log(`[WompiPoller] ❌ Transaction ${tx.transactionId} ended with status ${newStatus} for user ${tx.userId}. No plan provisioned.`);
                }

            } catch (txErr) {
                console.error(`[WompiPoller] Error processing tx ${tx._id}:`, txErr.message);
            }
        }

    } catch (err) {
        console.error('[WompiPoller] Cycle error:', err.message);
    }
};

/**
 * Start the poller. Called once from server startup (index.js).
 * Runs immediately on start, then repeats every POLL_INTERVAL_MS.
 */
const startWompiPoller = () => {
    if (pollerTimer) return; // Already running

    console.log(`[WompiPoller] Started. Will check pending transactions every ${POLL_INTERVAL_MS / 60000} minutes.`);

    // Run immediately on startup (small delay to let DB connect)
    setTimeout(runPollCycle, 10_000);

    // Then every 30 minutes
    pollerTimer = setInterval(runPollCycle, POLL_INTERVAL_MS);
};

const stopWompiPoller = () => {
    if (pollerTimer) {
        clearInterval(pollerTimer);
        pollerTimer = null;
        console.log('[WompiPoller] Stopped.');
    }
};

module.exports = { startWompiPoller, stopWompiPoller };
