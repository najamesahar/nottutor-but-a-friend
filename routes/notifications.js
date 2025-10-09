const express = require('express');
const router = express.Router();
const { sendNotification, sendBulkNotification, sendExpiryNotification, getNotifications, markRead, deleteNotification, getAnalytics, streamNotifications } = require('../controllers/notificationController');

router.post('/send', sendNotification);
router.post('/send/bulk', sendBulkNotification);
router.post('/send/with-expiry', sendExpiryNotification);
router.get('/:type/:id', getNotifications);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);
router.get('/analytics/:type/:id', getAnalytics);
router.get('/stream/:type/:id', streamNotifications);

module.exports = router;