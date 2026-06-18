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

// ── Web Push Setup ──────────────────────────────────────────────────────────
const webpush = require('web-push');
const { User } = require('~/db/models');

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BMK6k5UeEvAIz_tb9HLjTPkB1mf7M_EFvxr9DlZAHMCqQOu3dm8TIrT-N_FJZ27-3iilV5uSM0GpDNOAAoJzLXU',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'ln0eeUodJQ7NCpur01_V1KOdW_3qVqao99rPm-NYAsU'
};

webpush.setVapidDetails(
  'mailto:soporte@wappy.club',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

logger.info(`[Notifications] VAPID Public Key initialized: ${vapidKeys.publicKey}`);

// GET /api/notifications/vapid-public-key - Fetch VAPID Public Key for client subscription
router.get('/vapid-public-key', requireJwtAuth, (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// POST /api/notifications/subscribe - Save a new push subscription for the logged-in user
router.post('/subscribe', requireJwtAuth, async (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize array if undefined
    if (!user.pushSubscriptions) {
      user.pushSubscriptions = [];
    }

    // Check if subscription already exists to avoid duplicates
    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push(subscription);
      // Mark field as modified since it is a mixed array type
      user.markModified('pushSubscriptions');
      await user.save();
    }

    res.status(201).json({ success: true });
  } catch (error) {
    logger.error('[Notifications] Error subscribing to push notifications:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// POST /api/notifications/unsubscribe - Remove a push subscription
router.post('/unsubscribe', requireJwtAuth, async (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    const user = await User.findById(req.user.id);
    if (user && user.pushSubscriptions) {
      user.pushSubscriptions = user.pushSubscriptions.filter(sub => sub.endpoint !== subscription.endpoint);
      user.markModified('pushSubscriptions');
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[Notifications] Error unsubscribing from push notifications:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// POST /api/notifications/test-push - Send a test push notification to all subscriptions of the current user
router.post('/test-push', requireJwtAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(400).json({ error: 'No active push subscriptions found for this user.' });
    }

    const payload = JSON.stringify({
      title: 'Notificación de Prueba',
      body: '¡Hola! Las notificaciones Push de Wappy están configuradas correctamente.',
      url: '/'
    });

    const failedEndpoints = [];
    let errorOccurred = null;

    const sendPromises = user.pushSubscriptions.map(sub => 
      webpush.sendNotification(sub, payload).catch(async (err) => {
        errorOccurred = err.message || String(err);
        // If subscription is expired, invalid, or belongs to old VAPID keys (403), mark for removal
        if (err.statusCode === 410 || err.statusCode === 404 || err.statusCode === 403) {
          failedEndpoints.push(sub.endpoint);
        }
        logger.error(`[Notifications] Push failed for endpoint: ${sub.endpoint}. StatusCode: ${err.statusCode}, Body: ${err.body}`, err);
      })
    );

    await Promise.all(sendPromises);

    // Batch update database once
    if (failedEndpoints.length > 0) {
      user.pushSubscriptions = user.pushSubscriptions.filter(s => !failedEndpoints.includes(s.endpoint));
      user.markModified('pushSubscriptions');
      await user.save();
    }

    if (errorOccurred && user.pushSubscriptions.length === 0) {
      return res.status(500).json({ error: `Push failed: ${errorOccurred}` });
    }

    res.json({ success: true, message: 'Test notification sent.' });
  } catch (error) {
    logger.error('[Notifications] Error sending test push notification:', error);
    res.status(500).json({ error: 'Failed to send test push' });
  }
});

// POST /api/notifications/admin-push - Send a push notification to all administrators
router.post('/admin-push', requireJwtAuth, async (req, res) => {
  try {
    // Check if the current user is an admin before allowing this broadcast
    if (req.user.role !== 'ADMIN' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can broadcast notifications.' });
    }

    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required for push notification.' });
    }

    // Find all admin users
    const admins = await User.find({ role: { $in: ['ADMIN', 'admin'] } });
    
    let totalSent = 0;
    const sendPromises = [];
    const adminFailedEndpointsMap = new Map(); // adminId -> Array of failed endpoints

    const payload = JSON.stringify({
      title: title,
      body: body,
      url: '/'
    });

    for (const admin of admins) {
      if (admin.pushSubscriptions && admin.pushSubscriptions.length > 0) {
        for (const sub of admin.pushSubscriptions) {
          sendPromises.push(
            webpush.sendNotification(sub, payload)
              .then(() => {
                totalSent++;
              })
              .catch((err) => {
                // If subscription is expired, invalid, or belongs to old VAPID keys (403), mark for removal
                if (err.statusCode === 410 || err.statusCode === 404 || err.statusCode === 403) {
                  if (!adminFailedEndpointsMap.has(admin.id)) {
                    adminFailedEndpointsMap.set(admin.id, []);
                  }
                  adminFailedEndpointsMap.get(admin.id).push(sub.endpoint);
                }
                logger.error(`[Notifications] Push failed for admin: ${admin.email}. StatusCode: ${err.statusCode}, Body: ${err.body}`, err);
              })
          );
        }
      }
    }

    await Promise.all(sendPromises);

    // Batch update database for each admin once
    for (const admin of admins) {
      const failedEndpoints = adminFailedEndpointsMap.get(admin.id);
      if (failedEndpoints && failedEndpoints.length > 0) {
        admin.pushSubscriptions = admin.pushSubscriptions.filter(s => !failedEndpoints.includes(s.endpoint));
        admin.markModified('pushSubscriptions');
        await admin.save().catch(saveErr => {
          logger.error(`[Notifications] Failed to save updated subscriptions for admin: ${admin.email}`, saveErr);
        });
      }
    }

    res.json({ success: true, message: `Notification broadcasted to ${totalSent} administrator devices.` });
  } catch (error) {
    logger.error('[Notifications] Error broadcasting admin push notification:', error);
    res.status(500).json({ error: 'Failed to broadcast notifications' });
  }
});

module.exports = router;
