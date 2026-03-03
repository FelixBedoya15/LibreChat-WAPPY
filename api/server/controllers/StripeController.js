const Stripe = require('stripe');
const UserPlan = require('~/db/models/UserPlan');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia',
});

/** Map plan name → Stripe Price ID from environment variables */
const PLAN_PRICE_MAP = {
    go: process.env.STRIPE_PRICE_GO,
    plus: process.env.STRIPE_PRICE_PLUS,
    pro: process.env.STRIPE_PRICE_PRO,
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
 * Body: { plan: 'go' | 'plus' | 'pro' }
 * Returns: { url } — Stripe Checkout hosted URL
 */
const createCheckoutSession = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.user._id || req.user.id;
        const email = req.user.email;

        if (!PLAN_PRICE_MAP[plan]) {
            return res.status(400).json({ error: 'Plan inválido' });
        }

        const priceId = PLAN_PRICE_MAP[plan];
        if (!priceId) {
            return res.status(500).json({ error: `Variable STRIPE_PRICE_${plan.toUpperCase()} no configurada` });
        }

        // Get or create Stripe Customer
        let userPlan = await UserPlan.findOne({ userId });
        let customerId = userPlan?.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email,
                metadata: { userId: userId.toString() },
            });
            customerId = customer.id;
        }

        const origin = process.env.DOMAIN_CLIENT || `https://ia.wappy-ia.com`;

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
            success_url: `${origin}/planes?success=1&plan=${plan}`,
            cancel_url: `${origin}/planes?cancelled=1`,
            metadata: { userId: userId.toString(), plan },
            subscription_data: {
                metadata: { userId: userId.toString(), plan },
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

        const session = await stripe.billingPortal.sessions.create({
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
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
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

                const sub = await stripe.subscriptions.retrieve(subscriptionId);
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
};
