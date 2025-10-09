const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendEmail = async (recipientId, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'recipient@example.com', // Replace with dynamic lookup
    subject: 'Mentora Notification',
    text: message
  };
  await transporter.sendMail(mailOptions);
};

exports.sendBulkEmail = async (recipientIds, message) => {
  for (const id of recipientIds) {
    await this.sendEmail(id, message);
  }
};

exports.sendExpiryEmail = async (recipientId, message, expiryDate) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'recipient@example.com', // Replace with dynamic lookup
    subject: 'Mentora Notification with Expiry',
    text: `${message}\nExpires: ${expiryDate}`
  };
  await transporter.sendMail(mailOptions);
};

exports.cleanupExpiredNotifications = async () => {
  const Notification = require('../models/Notification');
  const now = new Date();
  await Notification.deleteMany({ expiryDate: { $lt: now }, read: false });
};
