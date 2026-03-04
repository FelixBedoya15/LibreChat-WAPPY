const express = require('express');
const router = express.Router();
const wompiController = require('../controllers/WompiController');
const { requireJwtAuth } = require('../middleware');

// Public endpoints (no auth needed)
router.get('/configured-plans', wompiController.getPublicPlansConfig);
router.get('/promocode/:code', wompiController.validatePromoCode);

// Webhook for Wompi transactions
router.post('/webhook', express.json(), wompiController.handleWebhook);

// Protected endpoints (require user to be logged in)
router.use(requireJwtAuth);
router.get('/plan', wompiController.getUserPlan);
router.post('/create-transaction', wompiController.createTransaction);

module.exports = router;
