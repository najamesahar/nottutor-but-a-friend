const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Class title is required'],
    trim: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: [true, 'Tutor is required']
  },
  bookedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  maxStudents: {
    type: Number,
    default: 10,
    min: [1, 'Max students must be at least 1']
  },
  schedule: {
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    }
  },
  description: {
    type: String,
    default: 'No description available',
    trim: true
  },
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
classSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for booked count (optional convenience)
classSchema.virtual('bookedCount').get(function() {
  return this.bookedBy.length;
});

module.exports = mongoose.model('Class', classSchema);