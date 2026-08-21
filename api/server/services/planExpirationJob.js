/**
 * planExpirationJob.js
 * ────────────────────
 * Background job and on-the-fly helper to automatically downgrade
 * users whose plan or trial has expired (planExpiresAt <= now or inactiveAt <= now).
 *
 * Downgrade rules (per business requirements):
 *
 *   interval === 'annual' | 'semiannual'   → Wappy Vital (plan: 'ipevar', role: USER_IPEVAR)
 *   interval === 'monthly' | 'quarterly'   → Invitado    (plan: 'free',   role: USER)
 *   interval === 'referral' (free trial)   → Invitado    (plan: 'free',   role: USER)
 *   Any other / null interval              → Invitado    (plan: 'free',   role: USER) [safe default]
 *
 * The job intentionally ignores:
 *   - Users with planExpiresAt === null and inactiveAt === null (lifetime / no expiry)
 *   - Users with plan === 'free' and role === 'USER' (already at free tier)
 *   - Users with role === 'ADMIN' (admins never expire)
 */

const mongoose = require('mongoose');

const JOB_INTERVAL_MS = 60 * 60 * 1000; // Run every 1 hour (faster cleanup)

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

/**
 * Downgrades a single user immediately if expired.
 * Can be called on-the-fly during login, middleware, or referrals dashboard.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{ downgraded: boolean, plan: string, role: string }>}
 */
const downgradeUserIfExpired = async (userId) => {
    try {
        const UserPlan = require('~/db/models/UserPlan');
        const User = mongoose.model('User');
        const now = new Date();

        const [user, userPlan] = await Promise.all([
            User.findById(userId),
            UserPlan.findOne({ userId }),
        ]);

        if (!user) return { downgraded: false };

        const freeRoles = ['USER', 'ADMIN', 'USER_IPEVAR', 'IPEVAR'];
        const isUserExpired = user.inactiveAt && new Date(user.inactiveAt) <= now;
        const isPlanExpired = userPlan && userPlan.planExpiresAt && new Date(userPlan.planExpiresAt) <= now && userPlan.plan !== 'free';

        if ((isUserExpired && !freeRoles.includes(user.role)) || isPlanExpired) {
            const { plan, role } = getDowngradeTarget(userPlan?.planInterval || null);

            await Promise.all([
                UserPlan.updateOne(
                    { userId: user._id },
                    {
                        $set: {
                            plan,
                            planInterval: null,
                            cancelAtPeriodEnd: false,
                            planExpiresAt: null,
                            customTools: [],
                            customInterval: null,
                        },
                    },
                    { upsert: true }
                ),
                User.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            role,
                            accountStatus: 'active',
                            inactiveAt: null,
                        },
                    }
                ),
            ]);

            console.log(`[PlanExpiration] ✅ User ${user.email || user._id} automatically downgraded to ${role} (${plan})`);
            return { downgraded: true, plan, role };
        }

        return { downgraded: false };
    } catch (err) {
        console.error(`[PlanExpiration] Error checking/downgrading user ${userId}:`, err.message);
        return { downgraded: false };
    }
};

const runExpirationCycle = async () => {
    try {
        const UserPlan = require('~/db/models/UserPlan');
        const User = mongoose.model('User');
        const now = new Date();

        // 1. Find all expired plans in UserPlan
        const expiredPlans = await UserPlan.find({
            plan: { $nin: ['free', 'admin'] },
            planExpiresAt: { $lte: now, $ne: null },
        }).lean();

        // 2. Find all users in User whose inactiveAt has passed and are still non-free roles
        const expiredUsers = await User.find({
            role: { $nin: ['USER', 'ADMIN', 'USER_IPEVAR', 'IPEVAR'] },
            inactiveAt: { $lte: now, $ne: null },
        }).lean();

        const userIdsToProcess = new Set([
            ...expiredPlans.map(p => p.userId?.toString()).filter(Boolean),
            ...expiredUsers.map(u => u._id?.toString()).filter(Boolean),
        ]);

        if (userIdsToProcess.size === 0) {
            return; // Nothing to do
        }

        console.log(`[PlanExpirationJob] Processing ${userIdsToProcess.size} expired user(s)/trial(s)...`);

        let downgradedCount = 0;
        let errors = 0;

        for (const userId of userIdsToProcess) {
            try {
                const res = await downgradeUserIfExpired(userId);
                if (res.downgraded) downgradedCount++;
            } catch (userErr) {
                errors++;
                console.error(`[PlanExpirationJob] ❌ Error processing userId ${userId}:`, userErr.message);
            }
        }

        console.log(
            `[PlanExpirationJob] Cycle complete. Downgraded to Free/Vital: ${downgradedCount}, Errors: ${errors}`
        );

    } catch (err) {
        console.error('[PlanExpirationJob] Cycle error:', err.message);
    }
};

/**
 * Start the plan expiration job. Called once from server startup (index.js).
 * Runs immediately on startup (10s delay to let DB connect), then every 1 hour.
 */
const startPlanExpirationJob = () => {
    if (expirationTimer) return; // Already running

    console.log(`[PlanExpirationJob] Started. Will check expired plans every ${JOB_INTERVAL_MS / 3600000} hour(s).`);

    // Run after a small delay to let the DB fully connect
    setTimeout(runExpirationCycle, 10_000);

    // Repeat every hour
    expirationTimer = setInterval(runExpirationCycle, JOB_INTERVAL_MS);
};

const stopPlanExpirationJob = () => {
    if (expirationTimer) {
        clearInterval(expirationTimer);
        expirationTimer = null;
        console.log('[PlanExpirationJob] Stopped.');
    }
};

module.exports = { startPlanExpirationJob, stopPlanExpirationJob, runExpirationCycle, downgradeUserIfExpired };

