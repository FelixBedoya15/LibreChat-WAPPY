const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('../middleware');
const { getMessages, sendMessage } = require('../controllers/ChatSSTController');

const requireAdminOrTestUser = (req, res, next) => {
  try {
    const isAllowedUser = req.user?.email === 'felix.bedoya15@gmail.com';
    const isAdmin = req.user?.role === 'ADMIN';

    if (isAdmin || isAllowedUser) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden: Acceso restringido para pruebas.' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Restringido a administradores y felix.bedoya15@gmail.com para pruebas
router.get('/messages', requireJwtAuth, requireAdminOrTestUser, getMessages);
router.post('/send', requireJwtAuth, requireAdminOrTestUser, sendMessage);

module.exports = router;
