const Class = require('../models/Class');
const Tutor = require('../models/Tutor');

exports.createClass = async (req, res) => {
  const { title, description, subject, schedule, maxStudents, resources } = req.body;
  const classObj = new Class({ title, description, subject, schedule, maxStudents, resources, tutor: req.user._id });
  await classObj.save();
  res.status(201).json(classObj);
};

exports.getAllClasses = async (req, res) => {
  const classes = await Class.find().populate('tutor');
  res.json(classes);
};

exports.searchClasses = async (req, res) => {
  const { tutorId, date } = req.query;
  const query = {};
  if (tutorId) query.tutor = tutorId;
  if (date) query.schedule = date;
  const classes = await Class.find(query).populate('tutor');
  res.json(classes);
};

exports.getAvailableClasses = async (req, res) => {
  const classes = await Class.find({ students: { $size: 0 } }).populate('tutor');
  res.json(classes);
};

exports.bookClass = async (req, res) => {
  const { classId } = req.params;
  const classObj = await Class.findById(classId);
  if (classObj.students.length >= classObj.maxStudents) return res.status(400).json({ error: 'Class full' });
  classObj.students.push(req.user._id);
  await classObj.save();
  res.json(classObj);
};

exports.updateClass = async (req, res) => {
  const { id } = req.params;
  const updatedClass = await Class.findByIdAndUpdate(id, req.body, { new: true });
  res.json(updatedClass);
};

exports.deleteClass = async (req, res) => {
  const { id } = req.params;
  await Class.findByIdAndDelete(id);
  res.status(204).send();
};