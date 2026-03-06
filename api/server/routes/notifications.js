const express = require('express');
const router = express.Router();
const Notification = require('../../models/Notification');
const { requireJwtAuth } = require('../middleware');
const { logger } = require('~/config');

// GET /api/notifications - Get all notifications for the logged-in user
router.get('/', requireJwtAuth, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        logger.error('[Notifications] Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// GET /api/notifications/unread-count - Get unread count for the logged-in user
router.get('/unread-count', requireJwtAuth, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user.id, read: false });
        res.json({ count });
    } catch (error) {
        logger.error('[Notifications] Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// PUT /api/notifications/:id/read - Mark a single notification as read
router.put('/:id/read', requireJwtAuth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { read: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        logger.error('[Notifications] Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// PUT /api/notifications/read-all - Mark all notifications as read for the logged-in user
router.put('/read-all', requireJwtAuth, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        logger.error('[Notifications] Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

module.exports = router;
