const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { requireAdmin } = require('~/server/middleware/roles/admin');
const { getAllUsers, createUser, updateUser, deleteUser, bulkUpdateUsers, getUserConversations, getConversationDetails } = require('~/server/controllers/AdminController');
const { getPlans, updatePlan } = require('~/server/controllers/AdminPlansController');
const { getPromoCodes, createPromoCode, deletePromoCode, togglePromoCode } = require('~/server/controllers/AdminPromoCodeController');

router.get('/users', requireJwtAuth, requireAdmin, getAllUsers);
router.post('/users/create', requireJwtAuth, requireAdmin, createUser);
router.post('/users/update', requireJwtAuth, requireAdmin, updateUser);
router.post('/users/delete', requireJwtAuth, requireAdmin, deleteUser);
router.post('/users/bulk-update', requireJwtAuth, requireAdmin, bulkUpdateUsers);
router.get('/users/:userId/conversations', requireJwtAuth, requireAdmin, getUserConversations);
router.get('/users/:userId/conversations/:conversationId', requireJwtAuth, requireAdmin, getConversationDetails);

router.get('/plans', requireJwtAuth, requireAdmin, getPlans);
router.put('/plans/:planId', requireJwtAuth, requireAdmin, updatePlan);

router.get('/promocodes', requireJwtAuth, requireAdmin, getPromoCodes);
router.post('/promocodes', requireJwtAuth, requireAdmin, createPromoCode);
router.delete('/promocodes/:id', requireJwtAuth, requireAdmin, deletePromoCode);
router.patch('/promocodes/:id/toggle', requireJwtAuth, requireAdmin, togglePromoCode);

module.exports = router;
