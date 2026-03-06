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
            .limit(100);
        res.json(notifications);
    } catch (error) {
        logger.error('[Notifications] Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', requireJwtAuth, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user.id, read: false });
        res.json({ count });
    } catch (error) {
        logger.error('[Notifications] Error fetching unread count:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', requireJwtAuth, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        logger.error('[Notifications] Error marking all as read:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// DELETE /api/notifications/all - Delete all notifications for the user
router.delete('/all', requireJwtAuth, async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user.id });
        res.json({ message: 'All notifications deleted' });
    } catch (error) {
        logger.error('[Notifications] Error deleting all notifications:', error);
        res.status(500).json({ error: 'Failed to delete notifications' });
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
        if (!notification) return res.status(404).json({ error: 'Notification not found' });
        res.json(notification);
    } catch (error) {
        logger.error('[Notifications] Error marking as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// PUT /api/notifications/:id/unread - Mark a single notification as unread
router.put('/:id/unread', requireJwtAuth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { read: false },
            { new: true }
        );
        if (!notification) return res.status(404).json({ error: 'Notification not found' });
        res.json(notification);
    } catch (error) {
        logger.error('[Notifications] Error marking as unread:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// DELETE /api/notifications/:id - Delete a single notification
router.delete('/:id', requireJwtAuth, async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        logger.error('[Notifications] Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// PUT /api/notifications/mark-read/ticket/:ticketId - Mark all notifications for a specific ticket as read
router.put('/mark-read/ticket/:ticketId', requireJwtAuth, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, ticketId: req.params.ticketId, read: false },
            { read: true }
        );
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        logger.error('[Notifications] Error marking ticket notifications as read:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

module.exports = router;
