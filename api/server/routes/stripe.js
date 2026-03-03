const express = require('express');
const { requireJwtAuth } = require('../middleware/');
const {
    getUserPlan,
    createCheckoutSession,
    createPortalSession,
    handleWebhook,
} = require('../controllers/StripeController');

const router = express.Router();

/**
 * IMPORTANT: The webhook route must use raw body (before express.json() parses it)
 * This is handled at the top-level index.js by registering stripe webhook BEFORE json middleware.
 */

// Authenticated routes
router.get('/plan', requireJwtAuth, getUserPlan);
router.post('/create-checkout-session', requireJwtAuth, createCheckoutSession);
router.post('/portal', requireJwtAuth, createPortalSession);

// Webhook — raw body (registered with raw middleware, see index.js)
router.post('/webhook', handleWebhook);

module.exports = router;
