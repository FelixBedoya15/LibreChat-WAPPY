const Stripe = require('stripe');
const UserPlan = require('~/db/models/UserPlan');
const Plan = require('~/models/Plan');

/** Lazy Stripe instance — only created on first API call, not at module load time.
 *  This prevents the server from crashing on startup when STRIPE_SECRET_KEY is not yet set. */
let _stripe = null;
const getStripe = () => {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY no está configurada en las variables de entorno');
        }
        _stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
    }
    return _stripe;
};

/** Map plan name → Stripe Price ID from environment variables (fallback) */
const PLAN_PRICE_MAP = {
    go: process.env.STRIPE_PRICE_GO,
    plus: process.env.STRIPE_PRICE_PLUS,
    pro: process.env.STRIPE_PRICE_PRO,
};

/**
 * GET /api/stripe/configured-plans
 * Returns the configured plans from the database (for frontend UI)
 */
const getPublicPlansConfig = async (req, res) => {
    try {
        const plans = await Plan.find().lean();
        return res.json(plans);
    } catch (error) {
        console.error('[Stripe] getPublicPlansConfig error:', error);
        return res.status(500).json({ error: 'Error obteniendo planes configurados' });
    }
};

/** Plan display names */
const PLAN_NAMES = { go: 'Go', plus: 'Plus', pro: 'Pro' };

/**
 * GET /api/stripe/plan
 * Returns the current user's plan information
 */
const getUserPlan = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const userPlan = await UserPlan.findOne({ userId });
        return res.json({
            plan: userPlan?.plan ?? 'free',
            cancelAtPeriodEnd: userPlan?.cancelAtPeriodEnd ?? false,
            planExpiresAt: userPlan?.planExpiresAt ?? null,
        });
    } catch (error) {
        console.error('[Stripe] getUserPlan error:', error);
        return res.status(500).json({ error: 'Error obteniendo el plan' });
    }
};

/**
 * POST /api/stripe/create-checkout-session
 * Body: { plan: 'go|monthly' | 'plus|annual' | 'pro' }
 * Returns: { url } — Stripe Checkout hosted URL
 */
const createCheckoutSession = async (req, res) => {
    try {
        const reqPlan = req.body.plan;
        const [planId, interval = 'monthly'] = reqPlan.split('|');
        const userId = req.user._id || req.user.id;
        const email = req.user.email;

        // Fetch dynamic plan config
        const planDoc = await Plan.findOne({ planId }).lean();

        // Fallback to old behavior if no DB config
        let priceId = null;
        if (planDoc && planDoc.stripePriceIds?.[interval]) {
            priceId = planDoc.stripePriceIds[interval];
        } else if (interval === 'monthly' && PLAN_PRICE_MAP[planId]) {
            priceId = PLAN_PRICE_MAP[planId];
        }

        if (!priceId) {
            return res.status(500).json({ error: `ID de Precio no configurado para el plan ${planId} (${interval})` });
        }

        // Get or create Stripe Customer
        let userPlan = await UserPlan.findOne({ userId });
        let customerId = userPlan?.stripeCustomerId;

        if (!customerId) {
            const customer = await getStripe().customers.create({
                email,
                metadata: { userId: userId.toString() },
            });
            customerId = customer.id;
        }

        const origin = process.env.DOMAIN_CLIENT || `https://ia.wappy-ia.com`;

        const session = await getStripe().checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
            success_url: `${origin}/planes?success=1&plan=${planId}`,
            cancel_url: `${origin}/planes?cancelled=1`,
            metadata: { userId: userId.toString(), plan: planId, interval },
            subscription_data: {
                metadata: { userId: userId.toString(), plan: planId, interval },
            },
        });

        return res.json({ url: session.url });
    } catch (error) {
        console.error('[Stripe] createCheckoutSession error:', error);
        return res.status(500).json({ error: 'Error creando sesión de pago' });
    }
};

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session for the current user
 */
const createPortalSession = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const userPlan = await UserPlan.findOne({ userId });

        if (!userPlan?.stripeCustomerId) {
            return res.status(400).json({ error: 'No tienes una suscripción activa' });
        }

        const origin = process.env.DOMAIN_CLIENT || `https://ia.wappy-ia.com`;

        const session = await getStripe().billingPortal.sessions.create({
            customer: userPlan.stripeCustomerId,
            return_url: `${origin}/planes`,
        });

        return res.json({ url: session.url });
    } catch (error) {
        console.error('[Stripe] createPortalSession error:', error);
        return res.status(500).json({ error: 'Error abriendo portal de facturación' });
    }
};

/**
 * POST /api/stripe/webhook
 * Raw body required — Stripe sends raw bytes for signature validation
 */
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('[Stripe] Webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.mode !== 'subscription') break;

                const userId = session.metadata?.userId;
                const plan = session.metadata?.plan;
                const customerId = session.customer;
                const subscriptionId = session.subscription;

                if (!userId || !plan) break;

                await UserPlan.findOneAndUpdate(
                    { userId },
                    {
                        plan,
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: subscriptionId,
                        stripePriceId: PLAN_PRICE_MAP[plan],
                        cancelAtPeriodEnd: false,
                    },
                    { upsert: true, new: true },
                );
                console.log(`[Stripe] ✅ Plan updated: user=${userId} plan=${plan}`);
                break;
            }

            case 'invoice.paid': {
                // Subscription renewed — ensure plan is still active
                const invoice = event.data.object;
                const subscriptionId = invoice.subscription;
                if (!subscriptionId) break;

                const sub = await getStripe().subscriptions.retrieve(subscriptionId);
                const userId = sub.metadata?.userId;
                const plan = sub.metadata?.plan;

                if (userId && plan) {
                    const periodEnd = new Date(sub.current_period_end * 1000);
                    await UserPlan.findOneAndUpdate(
                        { userId },
                        { plan, planExpiresAt: periodEnd, cancelAtPeriodEnd: false },
                        { upsert: true },
                    );
                    console.log(`[Stripe] 🔄 Subscription renewed: user=${userId} plan=${plan}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object;
                const userId = sub.metadata?.userId;
                if (!userId) break;

                const cancelAtPeriodEnd = sub.cancel_at_period_end;
                const periodEnd = new Date(sub.current_period_end * 1000);
                await UserPlan.findOneAndUpdate(
                    { userId },
                    { cancelAtPeriodEnd, planExpiresAt: periodEnd },
                    { upsert: true },
                );
                break;
            }

            case 'customer.subscription.deleted': {
                // Subscription cancelled/expired — downgrade to free
                const sub = event.data.object;
                const userId = sub.metadata?.userId;
                if (!userId) break;

                await UserPlan.findOneAndUpdate(
                    { userId },
                    { plan: 'free', stripeSubscriptionId: null, stripePriceId: null, cancelAtPeriodEnd: false, planExpiresAt: null },
                    { upsert: true },
                );
                console.log(`[Stripe] ❌ Subscription deleted: user=${userId} → downgraded to free`);
                break;
            }

            default:
                break;
        }
    } catch (err) {
        console.error('[Stripe] Webhook processing error:', err);
        return res.status(500).send('Internal error');
    }

    return res.json({ received: true });
};

module.exports = {
    getUserPlan,
    createCheckoutSession,
    createPortalSession,
    handleWebhook,
    getPublicPlansConfig,
};
