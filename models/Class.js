const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  title: String,
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor' },
  bookedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  maxStudents: { type: Number, default: 10 },
  schedule: {
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true }
  },
  description: { type: String, default: 'No description available' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', classSchema);