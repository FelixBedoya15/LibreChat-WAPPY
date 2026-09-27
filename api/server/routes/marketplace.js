const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireJwtAuth, checkJwtAuth } = require('../middleware');
const { requireAdmin } = require('../middleware/roles/admin');
const { getAppConfig } = require('~/server/services/Config');
const controller = require('../controllers/MarketplaceController');
const MarketplaceOrder = require('~/models/MarketplaceOrder');

// Multer Storage for receipts and product images
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const appConfig = await getAppConfig();
      const baseUploads = appConfig?.paths?.uploads || path.resolve(__dirname, '../../../uploads');
      const subDir = req.path.includes('manual-receipt') ? 'receipts' : 'products';
      const dir = path.join(baseUploads, 'marketplace', subDir);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const finalName = `${Date.now()}-${cleanName}`;
    cb(null, finalName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

// ── Public Routes ──
router.get('/categories', controller.getCategories);
router.get('/products', controller.getProducts);
router.get('/products/:idOrSlug', controller.getProductBySlugOrId);
router.post('/validate-coupon', controller.validateCoupon);
router.post('/checkout', checkJwtAuth, controller.createCheckout);
router.post('/verify-payment', controller.verifyPayment);
router.post('/webhook', express.json(), controller.handleWebhook);
router.get('/orders/:orderNumber', controller.getOrderDetails);

// Manual receipt upload for guest or user
router.post('/manual-receipt', upload.single('receipt'), async (req, res) => {
  try {
    const { orderNumber } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ error: 'Número de orden requerido.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo de comprobante requerido.' });
    }

    const order = await MarketplaceOrder.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const receiptUrl = `/api/marketplace/receipts/${req.file.filename}`;
    order.manualReceiptUrl = receiptUrl;
    order.paymentMethod = 'MANUAL_TRANSFER';
    order.paymentStatus = 'MANUAL_REVIEW';
    order.serviceTimeline.push({
      status: 'COMPROBANTE_SUBIDO',
      comment: 'Comprobante de pago manual adjuntado por el cliente. En espera de validación.',
      updatedAt: new Date(),
      updatedBy: 'Cliente'
    });

    await order.save();

    return res.json({
      success: true,
      receiptUrl,
      orderNumber: order.orderNumber,
      message: 'Comprobante recibido con éxito. Nuestro equipo validará la transacción.'
    });
  } catch (err) {
    console.error('[Marketplace] Manual receipt upload error:', err);
    return res.status(500).json({ error: 'Error al subir el comprobante.' });
  }
});

// Serve receipt image
router.get('/receipts/:filename', async (req, res) => {
  try {
    const appConfig = await getAppConfig();
    const baseUploads = appConfig?.paths?.uploads || path.resolve(__dirname, '../../../uploads');
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.resolve(baseUploads, 'marketplace', 'receipts', filename);
    const safeDir = path.resolve(baseUploads, 'marketplace', 'receipts');

    if (!filePath.startsWith(safeDir) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Comprobante no encontrado.' });
    }

    return res.sendFile(filePath);
  } catch (err) {
    console.error('[Marketplace] Error serving receipt:', err);
    return res.status(500).json({ error: 'Error al servir el archivo.' });
  }
});

// Serve product uploaded images
router.get('/images/:filename', async (req, res) => {
  try {
    const appConfig = await getAppConfig();
    const baseUploads = appConfig?.paths?.uploads || path.resolve(__dirname, '../../../uploads');
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.resolve(baseUploads, 'marketplace', 'products', filename);
    const safeDir = path.resolve(baseUploads, 'marketplace', 'products');

    if (!filePath.startsWith(safeDir) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Imagen no encontrada.' });
    }

    return res.sendFile(filePath);
  } catch (err) {
    console.error('[Marketplace] Error serving image:', err);
    return res.status(500).json({ error: 'Error al servir la imagen.' });
  }
});

// ── Authenticated User Routes ──
router.get('/my-orders', requireJwtAuth, controller.getMyOrders);

// ── Admin Protected Routes ──
router.get('/admin/orders', requireJwtAuth, requireAdmin, controller.adminGetOrders);
router.put('/admin/orders/:id/status', requireJwtAuth, requireAdmin, controller.adminUpdateOrderStatus);
router.post('/admin/orders/:id/notes', requireJwtAuth, requireAdmin, controller.adminAddOrderNote);

router.post('/admin/products', requireJwtAuth, requireAdmin, controller.adminCreateProduct);
router.put('/admin/products/:id', requireJwtAuth, requireAdmin, controller.adminUpdateProduct);
router.delete('/admin/products/:id', requireJwtAuth, requireAdmin, controller.adminDeleteProduct);

router.get('/admin/coupons', requireJwtAuth, requireAdmin, controller.adminGetCoupons);
router.post('/admin/coupons', requireJwtAuth, requireAdmin, controller.adminCreateCoupon);
router.delete('/admin/coupons/:id', requireJwtAuth, requireAdmin, controller.adminDeleteCoupon);

router.post('/admin/reseed', requireJwtAuth, requireAdmin, controller.adminReseedCatalog);

// Upload product image
router.post('/admin/upload', requireJwtAuth, requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
    }
    const url = `/api/marketplace/images/${encodeURIComponent(req.file.filename)}`;
    return res.json({ success: true, url, filename: req.file.filename });
  } catch (err) {
    console.error('[Marketplace] Admin upload error:', err);
    return res.status(500).json({ error: 'Error al subir la imagen.' });
  }
});

module.exports = router;
