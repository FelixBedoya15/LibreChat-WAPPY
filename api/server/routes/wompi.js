const express = require('express');
const router = express.Router();
const wompiController = require('../controllers/WompiController');
const { requireJwtAuth } = require('../middleware');

// Public endpoints (no auth needed)
router.get('/configured-plans', wompiController.getPublicPlansConfig);
router.get('/promocode/:code', wompiController.validatePromoCode);

// Webhook for Wompi transactions
router.post('/webhook', express.json(), wompiController.handleWebhook);

const { createMulterInstance } = require('../routes/files/multer');

// Protected endpoints (require user to be logged in)
router.use(requireJwtAuth);

// Create multer instance for receipt upload
createMulterInstance().then(upload => {
  router.post('/manual-receipt', upload.single('receipt'), wompiController.createManualTransaction);
}).catch(err => console.error('Error init multer for manual receipt:', err));

router.get('/plan', wompiController.getUserPlan);
router.post('/create-transaction', wompiController.createTransaction);
router.post('/verify-transaction', wompiController.verifyTransaction);
router.post('/register-pending', wompiController.registerPendingTransaction);

module.exports = router;
