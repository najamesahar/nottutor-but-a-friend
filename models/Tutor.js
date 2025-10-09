const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  googleId: String,
  email: { type: String, required: true, unique: true },
  name: String,
  bio: String,
  role: { type: String, default: 'tutor' },
  expertise: [String],
  subjects: [String],
  hourlyRate: Number,
  rating: Number,
  resources: [String],
  verified: Boolean,
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  availability: [{ date: Date, time: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tutor', tutorSchema);