const CheckoutEvent = require('~/models/CheckoutEvent');

// ─── Public: record a single funnel event ───────────────────────────────────
const recordEvent = async (req, res) => {
    try {
        const { sessionId, event, planId, interval, amountInCents, email } = req.body;

        if (!sessionId || !event) {
            return res.status(400).json({ error: 'sessionId and event are required' });
        }

        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        const userId = req.user?._id || req.user?.id || null;

        await CheckoutEvent.create({
            sessionId,
            event,
            planId: planId || null,
            interval: interval || null,
            amountInCents: amountInCents || 0,
            userId,
            email: email || null,
            ip,
            userAgent,
        });

        return res.status(201).json({ ok: true });
    } catch (error) {
        console.error('[CheckoutAnalytics] recordEvent error:', error);
        return res.status(500).json({ error: 'Error registrando evento' });
    }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getDateRange = (period) => {
    const now = new Date();
    const start = new Date();
    if (period === 'today') {
        start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    } else {
        // all time
        return {};
    }
    return { createdAt: { $gte: start, $lte: now } };
};

// ─── Admin: aggregated summary ───────────────────────────────────────────────
const getSummary = async (req, res) => {
    try {
        const period = req.query.period || 'month'; // today | week | month | all
        const dateFilter = getDateRange(period);

        // Funnel counts
        const funnelAgg = await CheckoutEvent.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$event', count: { $sum: 1 } } },
        ]);

        const funnel = {
            page_view: 0,
            plan_selected: 0,
            payment_started: 0,
            payment_approved: 0,
            payment_failed: 0,
            payment_cancelled: 0,
        };
        funnelAgg.forEach(({ _id, count }) => { if (_id in funnel) funnel[_id] = count; });

        // Revenue: sum of approved payments
        const revenueAgg = await CheckoutEvent.aggregate([
            { $match: { ...dateFilter, event: 'payment_approved' } },
            { $group: { _id: null, totalCents: { $sum: '$amountInCents' } } },
        ]);
        const totalRevenueCents = revenueAgg[0]?.totalCents || 0;

        // Revenue by plan
        const revenueByPlan = await CheckoutEvent.aggregate([
            { $match: { ...dateFilter, event: 'payment_approved' } },
            { $group: { _id: '$planId', totalCents: { $sum: '$amountInCents' }, count: { $sum: 1 } } },
            { $sort: { totalCents: -1 } },
        ]);

        // Unique sessions
        const uniqueSessionsAgg = await CheckoutEvent.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$sessionId' } },
            { $count: 'total' },
        ]);
        const uniqueSessions = uniqueSessionsAgg[0]?.total || 0;

        // Daily revenue for chart (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const dailyRevenue = await CheckoutEvent.aggregate([
            { $match: { event: 'payment_approved', createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                    },
                    totalCents: { $sum: '$amountInCents' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]);

        const conversionRate = funnel.page_view > 0
            ? ((funnel.payment_approved / funnel.page_view) * 100).toFixed(1)
            : '0.0';

        return res.json({
            period,
            funnel,
            totalRevenueCents,
            totalRevenueCOP: Math.round(totalRevenueCents / 100),
            uniqueSessions,
            conversionRate,
            revenueByPlan,
            dailyRevenue,
        });
    } catch (error) {
        console.error('[CheckoutAnalytics] getSummary error:', error);
        return res.status(500).json({ error: 'Error obteniendo analítica' });
    }
};

// ─── Admin: recent events list ────────────────────────────────────────────────
const getRecentEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;

        const events = await CheckoutEvent.find({ event: { $in: ['payment_approved', 'payment_failed', 'payment_cancelled'] } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await CheckoutEvent.countDocuments({ event: { $in: ['payment_approved', 'payment_failed', 'payment_cancelled'] } });

        return res.json({ events, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('[CheckoutAnalytics] getRecentEvents error:', error);
        return res.status(500).json({ error: 'Error obteniendo eventos' });
    }
};

module.exports = { recordEvent, getSummary, getRecentEvents };
