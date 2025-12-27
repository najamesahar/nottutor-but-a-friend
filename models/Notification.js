const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: [true, 'Recipient is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 // Default 7 days expiry
  }
});

// Index for efficient querying of unread notifications
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Optional: Auto-remove expired notifications (can be used with a cron job)
notificationSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);