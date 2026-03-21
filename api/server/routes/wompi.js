const express = require('express');
const router = express.Router();
const wompiController = require('../controllers/WompiController');
const { requireJwtAuth } = require('../middleware');
const path = require('path');
const fs = require('fs');

// Public endpoints (no auth needed)
router.get('/configured-plans', wompiController.getPublicPlansConfig);
router.get('/promocode/:code', wompiController.validatePromoCode);

// Webhook for Wompi transactions
router.post('/webhook', express.json(), wompiController.handleWebhook);

const { createMulterInstance } = require('../routes/files/multer');

const configMiddleware = require('../middleware/config/app');

// Protected endpoints (require user to be logged in)
router.use(requireJwtAuth);
router.use(configMiddleware);

// Create multer instance for receipt upload
createMulterInstance().then(upload => {
  router.post('/manual-receipt', upload.single('receipt'), wompiController.createManualTransaction);
}).catch(err => console.error('Error init multer for manual receipt:', err));

router.get('/plan', wompiController.getUserPlan);
router.post('/create-transaction', wompiController.createTransaction);
router.post('/verify-transaction', wompiController.verifyTransaction);
router.post('/register-pending', wompiController.registerPendingTransaction);

// Serve receipt images (for admin ticket view)
router.get('/receipt/:userId/:filename', async (req, res) => {
  try {
    const { getAppConfig } = require('~/server/services/Config');
    const appConfig = await getAppConfig();
    const uploadsDir = appConfig.paths.uploads;
    const filename = decodeURIComponent(req.params.filename);
    // First try the permanent receipts folder, then fall back to temp
    const receiptPath = path.resolve(uploadsDir, 'receipts', req.params.userId, filename);
    const tempPath = path.resolve(uploadsDir, 'temp', req.params.userId, filename);
    console.log('[Wompi Receipt] uploads:', uploadsDir, '| receipt:', receiptPath, '| temp:', tempPath);
    const filePath = fs.existsSync(receiptPath) ? receiptPath : tempPath;
    console.log('[Wompi Receipt] serving:', filePath, '| exists:', fs.existsSync(filePath));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    // Set content-type based on extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.set('Content-Type', contentType);
    return res.sendFile(filePath);
  } catch (err) {
    console.error('[Wompi] Error serving receipt:', err);
    return res.status(500).json({ error: 'Error al servir el archivo' });
  }
});

module.exports = router;
