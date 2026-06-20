/**
 * planExpirationJob.js
 * ────────────────────
 * Background job that runs every 6 hours to automatically downgrade
 * users whose plan has expired (planExpiresAt <= now).
 *
 * Downgrade rules (per business requirements):
 *
 *   interval === 'annual' | 'semiannual'   → Wappy Vital (plan: 'ipevar', role: USER_IPEVAR)
 *   interval === 'monthly' | 'quarterly'   → Invitado    (plan: 'free',   role: USER)
 *   interval === 'referral' (free trial)   → Invitado    (plan: 'free',   role: USER)
 *   Any other / null interval              → Invitado    (plan: 'free',   role: USER) [safe default]
 *
 * Note: Plans like 'go', 'plus' are currently inactive so in practice only
 *       'pro' plans need handling, but the job is generic for all plan types.
 *
 * The job intentionally ignores:
 *   - Users with planExpiresAt === null (lifetime / no expiry, e.g. Wappy Vital)
 *   - Users with plan === 'free' (already at free tier)
 *   - Users with plan === 'admin' (admins never expire)
 */

const mongoose = require('mongoose');

const JOB_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

let expirationTimer = null;

/**
 * Determine which plan/role to assign after expiry based on the interval
 * that was originally purchased.
 *
 * @param {string|null} planInterval - The interval stored in UserPlan.planInterval
 * @returns {{ plan: string, role: string }}
 */
const getDowngradeTarget = (planInterval) => {
    if (planInterval === 'annual' || planInterval === 'semiannual') {
        // Paid long-term subscribers → reward with Wappy Vital (IPEVAR)
        return { plan: 'ipevar', role: 'USER_IPEVAR' };
    }
    // monthly, quarterly, referral trial, or unknown → Invitado (free)
    return { plan: 'free', role: 'USER' };
};

const runExpirationCycle = async () => {
    try {
        const UserPlan = require('~/db/models/UserPlan');
        const User = mongoose.model('User');

        const now = new Date();

        // Find all active non-free plans whose expiry has passed
        // planExpiresAt: null means lifetime/no expiry → skip those
        const expiredPlans = await UserPlan.find({
            plan: { $nin: ['free', 'admin'] },
            planExpiresAt: { $lte: now, $ne: null },
        }).lean();

        if (expiredPlans.length === 0) {
            return; // Nothing to do
        }

        console.log(`[PlanExpirationJob] Processing ${expiredPlans.length} expired plan(s)...`);

        let downgradedToVital = 0;
        let downgradedToFree = 0;
        let errors = 0;

        for (const userPlan of expiredPlans) {
            try {
                const { plan, role } = getDowngradeTarget(userPlan.planInterval);

                // Update UserPlan — clear expiry and interval
                await UserPlan.updateOne(
                    { _id: userPlan._id },
                    {
                        $set: {
                            plan,
                            planInterval: null,
                            cancelAtPeriodEnd: false,
                            planExpiresAt: null,
                            customTools: [],
                            customInterval: null,
                        },
                    }
                );

                // Update User role and clear inactiveAt
                await User.updateOne(
                    { _id: userPlan.userId },
                    {
                        $set: {
                            role,
                            accountStatus: 'active',
                            inactiveAt: null,
                        },
                    }
                );

                if (plan === 'ipevar') {
                    downgradedToVital++;
                    console.log(
                        `[PlanExpirationJob] ✅ User ${userPlan.userId} (was: ${userPlan.plan}/${userPlan.planInterval}) → Wappy Vital (USER_IPEVAR)`
                    );
                } else {
                    downgradedToFree++;
                    console.log(
                        `[PlanExpirationJob] ✅ User ${userPlan.userId} (was: ${userPlan.plan}/${userPlan.planInterval || 'unknown'}) → Invitado (USER)`
                    );
                }
            } catch (userErr) {
                errors++;
                console.error(`[PlanExpirationJob] ❌ Error processing userId ${userPlan.userId}:`, userErr.message);
            }
        }

        console.log(
            `[PlanExpirationJob] Cycle complete. ` +
            `→ Wappy Vital: ${downgradedToVital}, → Invitado: ${downgradedToFree}, Errors: ${errors}`
        );

    } catch (err) {
        console.error('[PlanExpirationJob] Cycle error:', err.message);
    }
};

/**
 * Start the plan expiration job. Called once from server startup (index.js).
 * Runs immediately on startup (15s delay to let DB connect), then every 6 hours.
 */
const startPlanExpirationJob = () => {
    if (expirationTimer) return; // Already running

    console.log(`[PlanExpirationJob] Started. Will check expired plans every ${JOB_INTERVAL_MS / 3600000} hours.`);

    // Run after a small delay to let the DB fully connect
    setTimeout(runExpirationCycle, 15_000);

    // Repeat every 6 hours
    expirationTimer = setInterval(runExpirationCycle, JOB_INTERVAL_MS);
};

const stopPlanExpirationJob = () => {
    if (expirationTimer) {
        clearInterval(expirationTimer);
        expirationTimer = null;
        console.log('[PlanExpirationJob] Stopped.');
    }
};

module.exports = { startPlanExpirationJob, stopPlanExpirationJob, runExpirationCycle };
