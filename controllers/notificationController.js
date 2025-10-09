const Notification = require('../models/Notification');
const { sendEmail, sendBulkEmail, sendExpiryEmail } = require('../utils/email');
const sse = require('../utils/sse');

exports.sendNotification = async (req, res) => {
  const { recipientId, message } = req.body;
  await sendEmail(recipientId, message);
  const notification = new Notification({ recipient: recipientId, message });
  await notification.save();
  sse.send(recipientId, notification);
  res.status(201).json(notification);
};

exports.sendBulkNotification = async (req, res) => {
  const { recipientIds, message } = req.body;
  await sendBulkEmail(recipientIds, message);
  const notifications = recipientIds.map(id => new Notification({ recipient: id, message }));
  await Notification.insertMany(notifications);
  notifications.forEach(n => sse.send(n.recipient, n));
  res.status(201).json(notifications);
};

exports.sendExpiryNotification = async (req, res) => {
  const { recipientId, message, expiryDate } = req.body;
  await sendExpiryEmail(recipientId, message, expiryDate);
  const notification = new Notification({ recipient: recipientId, message, expiryDate });
  await notification.save();
  sse.send(recipientId, notification);
  res.status(201).json(notification);
};

exports.getNotifications = async (req, res) => {
  const { type, id } = req.params;
  const query = { recipient: id };
  if (type === 'unread') query.read = false;
  const notifications = await Notification.find(query).limit(10).sort({ date: -1 });
  res.json(notifications);
};

exports.markRead = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
  res.json(notification);
};

exports.deleteNotification = async (req, res) => {
  const { id } = req.params;
  await Notification.findByIdAndDelete(id);
  res.status(204).send();
};

exports.getAnalytics = async (req, res) => {
  const { type, id } = req.params;
  const total = await Notification.countDocuments({ recipient: id });
  const unread = await Notification.countDocuments({ recipient: id, read: false });
  res.json({ total, unread });
};

exports.streamNotifications = (req, res) => {
  const { type, id } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  sse.addClient(id, res);
  req.on('close', () => sse.removeClient(id, res));
};