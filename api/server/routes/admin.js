const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { requireAdmin } = require('~/server/middleware/roles/admin');
const { getAllUsers, createUser, updateUser, deleteUser, bulkUpdateUsers } = require('~/server/controllers/AdminController');

router.get('/users', requireJwtAuth, requireAdmin, getAllUsers);
router.post('/users/create', requireJwtAuth, requireAdmin, createUser);
router.post('/users/update', requireJwtAuth, requireAdmin, updateUser);
router.post('/users/delete', requireJwtAuth, requireAdmin, deleteUser);
router.post('/users/bulk-update', requireJwtAuth, requireAdmin, bulkUpdateUsers);

module.exports = router;
