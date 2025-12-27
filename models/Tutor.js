const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    default: 'tutor'
  },
  bio: {
    type: String,
    default: 'Experienced tutor',
    trim: true
  },
  expertise: [{
    type: String,
    trim: true
  }],
  subjects: [{
    type: String,
    trim: true
  }],
  hourlyRate: {
    type: Number,
    default: 25,
    min: [0, 'Hourly rate cannot be negative']
  },
  rating: {
    type: Number,
    default: 4.8,
    min: 0,
    max: 5
  },
  verified: {
    type: Boolean,
    default: false
  },
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String, // e.g., "09:00"
      required: true
    },
    endTime: {
      type: String, // e.g., "17:00"
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update updatedAt
tutorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Tutor', tutorSchema);