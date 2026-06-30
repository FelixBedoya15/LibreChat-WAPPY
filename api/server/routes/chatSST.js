const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('../middleware');
const { requireAdmin } = require('../middleware/roles/admin');
const { getMessages, sendMessage, updateMessage, deleteMessage, regenerateMessage } = require('../controllers/ChatSSTController');

// Rutas accesibles para todos los usuarios autenticados (Comunidad Pro, Vital, etc.)
router.get('/messages', requireJwtAuth, getMessages);
router.post('/send', requireJwtAuth, sendMessage);
router.put('/messages/:id', requireJwtAuth, updateMessage);
router.delete('/messages/:id', requireJwtAuth, deleteMessage);

// Regeneración de respuestas reservada para Administradores
router.post('/messages/:id/regenerate', requireJwtAuth, requireAdmin, regenerateMessage);

module.exports = router;
