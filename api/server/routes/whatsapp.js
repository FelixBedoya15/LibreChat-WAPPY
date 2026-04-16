const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const whatsappManager = require('../whatsapp/WhatsAppManager');

const router = express.Router();

/**
 * @route GET /api/whatsapp/status
 * @desc  Get the current status of the WhatsApp client for the authenticated user
 * @access Private
 */
router.get('/status', requireJwtAuth, (req, res) => {
  const userId = req.user.id;
  const statusObject = whatsappManager.getStatus(userId);
  res.json(statusObject);
});

/**
 * @route POST /api/whatsapp/start
 * @desc  Start the WhatsApp Puppeteer client for the authenticated user and generate QR
 * @access Private
 */
router.post('/start', requireJwtAuth, async (req, res) => {
  const userId = req.user.id;
  const statusObject = whatsappManager.getStatus(userId);
  
  if (statusObject.status === 'OFFLINE') {
    // Start async without blocking response
    whatsappManager.startClientForUser(userId);
    res.json({ message: 'Conectando servicio...', status: 'STARTING' });
  } else {
    res.json({ message: 'El servicio ya está inicializándose o activo.', status: statusObject.status });
  }
});

/**
 * @route POST /api/whatsapp/logout
 * @desc  Disconnect and destroy the WhatsApp link
 * @access Private
 */
router.post('/logout', requireJwtAuth, async (req, res) => {
  const userId = req.user.id;
  await whatsappManager.destroyClientForUser(userId);
  res.json({ message: 'Sesión de WhatsApp cerrada exitosamente.' });
});

module.exports = router;
