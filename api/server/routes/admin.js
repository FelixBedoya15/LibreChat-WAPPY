const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { requireAdmin } = require('~/server/middleware/roles/admin');
const { getPendingUsers, approveUser } = require('~/server/controllers/AdminController');

router.get('/users/pending', requireJwtAuth, requireAdmin, getPendingUsers);
router.post('/users/approve', requireJwtAuth, requireAdmin, approveUser);

module.exports = router;
