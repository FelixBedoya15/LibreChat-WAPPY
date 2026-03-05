const axios = require('axios');
const mongoose = require('mongoose');
const UserPlan = require('~/db/models/UserPlan');
const Plan = require('~/models/Plan');
const PromoCode = require('~/models/PromoCode');

// Nequi Conecta Auth
const getAccessToken = async () => {
    try {
        const auth = Buffer.from(`${process.env.NEQUI_CLIENT_ID}:${process.env.NEQUI_CLIENT_SECRET}`).toString('base64');
        const response = await axios.post('https://api.nequi.com/oauth2/token', 'grant_type=client_credentials', {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('[Nequi] Token error:', error.response?.data || error.message);
        throw new Error('Error de autenticación con Nequi');
    }
};

/**
 * POST /api/nequi/link
 * Inicia el proceso de vinculación de cuenta Nequi
 */
const linkAccount = async (req, res) => {
    try {
        const { phoneNumber, plan: planString, promoCode } = req.body;
        if (!phoneNumber || !planString) {
            return res.status(400).json({ error: 'Número de celular y plan son requeridos' });
        }

        const userId = req.user._id || req.user.id;
        const [planId, interval] = planString.split('|');

        // Get access token
        const token = await getAccessToken();

        // Prepare request to Nequi
        const nequiPayload = {
            RequestMessage: {
                RequestHeader: {
                    Channel: 'PNP04-C001',
                    RequestDate: new Date().toISOString(),
                    MessageID: `WAPPY-${userId}-${Date.now()}`,
                    ClientID: process.env.NEQUI_CLIENT_ID,
                    Destination: {
                        ServiceName: 'SubscriptionService',
                        ServiceOperation: 'newSubscription',
                        ServiceRegion: 'C001',
                        ServiceVersion: '1.2.0'
                    }
                },
                RequestBody: {
                    any: {
                        newSubscriptionRQ: {
                            phoneNumber: phoneNumber,
                            code: process.env.NEQUI_SUBSCRIPTION_NAME || 'WAPPY_IA',
                            name: 'WAPPY IA Suscripción',
                            value: '0' // Link process usually doesn't charge immediately or can be 0 for auth
                        }
                    }
                }
            }
        };

        const response = await axios.post('https://api.nequi.com/shasta/v1/payments/subscription', nequiPayload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-api-key': process.env.NEQUI_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const respBody = response.data?.ResponseMessage?.ResponseBody?.any?.newSubscriptionRS;
        if (respBody?.status?.code === '0') {
            // Pending authorization
            const subscriptionToken = respBody.token;
            // Store this in user plan or a temporary transaction model
            // For simplicity, let's keep it in a session or temp meta

            return res.json({
                success: true,
                message: 'Por favor, autoriza la suscripción en tu app Nequi',
                subscriptionToken
            });
        } else {
            return res.status(400).json({
                error: respBody?.status?.description || 'Error al iniciar suscripción'
            });
        }

    } catch (error) {
        console.error('[Nequi] Link error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Error procesando solicitud con Nequi' });
    }
};

/**
 * POST /api/nequi/verify-and-charge
 * Verifica si la suscripción fue aceptada y realiza el cobro
 */
const verifyAndCharge = async (req, res) => {
    try {
        const { subscriptionToken, phoneNumber, plan: planString, promoCode } = req.body;
        const userId = req.user._id || req.user.id;

        const [planId, interval] = planString.split('|');
        const token = await getAccessToken();

        // 1. Check subscription status
        // In a real scenario, Nequi might notify via webhook, but here we can poll or verification request
        // For this implementation, we'll try to execute the first payment immediately.

        // Calculate price (shared logic with Wompi)
        const planDoc = await Plan.findOne({ planId }).lean();
        let rawPrice = planDoc.prices?.[interval] || 0;
        let finalPrice = rawPrice;
        if (promoCode) {
            const codeDoc = await PromoCode.findOne({ code: promoCode.toUpperCase() });
            if (codeDoc && codeDoc.active) finalPrice = rawPrice - (rawPrice * codeDoc.discountPercentage / 100);
        }

        const amount = Math.round(finalPrice).toString();

        const paymentPayload = {
            RequestMessage: {
                RequestHeader: {
                    Channel: 'PNP04-C001',
                    RequestDate: new Date().toISOString(),
                    MessageID: `PMT-${userId}-${Date.now()}`,
                    ClientID: process.env.NEQUI_CLIENT_ID,
                    Destination: {
                        ServiceName: 'SubscriptionService',
                        ServiceOperation: 'paymentSubscription',
                        ServiceRegion: 'C001',
                        ServiceVersion: '1.2.0'
                    }
                },
                RequestBody: {
                    any: {
                        paymentSubscriptionRQ: {
                            phoneNumber: phoneNumber,
                            code: process.env.NEQUI_SUBSCRIPTION_NAME || 'WAPPY_IA',
                            value: amount
                        }
                    }
                }
            }
        };

        const response = await axios.post('https://api.nequi.com/shasta/v1/payments/subscription/payment', paymentPayload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-api-key': process.env.NEQUI_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const respBody = response.data?.ResponseMessage?.ResponseBody?.any?.paymentSubscriptionRS;
        if (respBody?.status?.code === '0') {
            // Success! Provision plan
            const expiryDate = new Date();
            if (interval === 'monthly') expiryDate.setMonth(expiryDate.getMonth() + 1);
            else if (interval === 'annual') expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            let userPlan = await UserPlan.findOne({ userId });
            if (!userPlan) userPlan = new UserPlan({ userId });

            userPlan.plan = planId;
            userPlan.planExpiresAt = expiryDate;
            // Store Nequi info
            userPlan.nequiPhoneNumber = phoneNumber;
            userPlan.nequiToken = subscriptionToken;
            await userPlan.save();

            return res.json({ success: true, message: '¡Pago exitoso! Tu plan ha sido actualizado.' });
        } else {
            return res.status(400).json({
                error: respBody?.status?.description || 'El pago no pudo ser procesado. ¿Aceptaste la suscripción?'
            });
        }

    } catch (error) {
        console.error('[Nequi] Charge error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Error al procesar el pago con Nequi' });
    }
};

module.exports = {
    linkAccount,
    verifyAndCharge
};
