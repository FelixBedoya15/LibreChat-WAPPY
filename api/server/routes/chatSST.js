const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { requireAdmin } = require('~/server/middleware/roles/admin');
const { getMessages, sendMessage } = require('../controllers/ChatSSTController');

// Por el momento, restringido a administradores para pruebas
router.get('/messages', requireJwtAuth, requireAdmin, getMessages);
router.post('/send', requireJwtAuth, requireAdmin, sendMessage);

module.exports = router;
