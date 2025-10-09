const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  googleId: String,
  email: { type: String, required: true, unique: true },
  name: String,
  role: { type: String, default: 'student' }
});

module.exports = mongoose.model('Student', studentSchema);