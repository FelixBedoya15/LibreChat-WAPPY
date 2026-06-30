const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('../middleware');
const { requireAdmin } = require('../middleware/roles/admin');
const { 
  getMessages, 
  sendMessage, 
  updateMessage, 
  deleteMessage, 
  regenerateMessage,
  getGroups,
  createGroup,
  searchUsers,
  inviteToGroup,
  acceptInvitation,
  rejectInvitation,
  getInvitations
} = require('../controllers/ChatSSTController');

// Rutas de mensajes
router.get('/messages', requireJwtAuth, getMessages);
router.post('/send', requireJwtAuth, sendMessage);
router.put('/messages/:id', requireJwtAuth, updateMessage);
router.delete('/messages/:id', requireJwtAuth, deleteMessage);
router.post('/messages/:id/regenerate', requireJwtAuth, requireAdmin, regenerateMessage);

// Rutas de grupos e invitaciones
router.get('/groups', requireJwtAuth, getGroups);
router.post('/groups', requireJwtAuth, createGroup);
router.get('/users-search', requireJwtAuth, searchUsers);
router.post('/groups/:id/invite', requireJwtAuth, inviteToGroup);
router.get('/invitations', requireJwtAuth, getInvitations);
router.post('/invitations/:id/accept', requireJwtAuth, acceptInvitation);
router.post('/invitations/:id/reject', requireJwtAuth, rejectInvitation);

module.exports = router;
