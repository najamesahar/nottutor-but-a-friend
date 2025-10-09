const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Tutor = require('../models/Tutor');
const Class = require('../models/Class');
const Notification = require('../models/Notification');

router.get('/classes/:id', async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id).populate('tutor', 'name email');
    if (!classDoc) return res.status(404).json({ error: 'Class not found' });
    res.json({
      title: classDoc.title,
      tutor: classDoc.tutor,
      bookedBy: classDoc.bookedBy.length,
      maxStudents: classDoc.maxStudents,
      schedule: { startTime: classDoc.schedule.startTime, endTime: classDoc.schedule.endTime },
      description: classDoc.description || 'No description available'
    });
  } catch (err) {
    console.error('Error fetching class details:', err);
    res.status(500).json({ error: 'Failed to fetch class details' });
  }
});

// Unread notifications
router.get('/notifications/unread/:userId', async (req, res) => {
  const UserModel = req.params.userId.includes('@student.mentora.app') ? Student : Tutor;
  const user = await UserModel.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const dbNotifications = await Notification.find({ recipient: user._id, isRead: false }).select('message _id');
  const notifications = [
    ...dbNotifications.map(n => ({ message: n.message, _id: n._id })),
    { message: `Notification for ${user.name}` }
  ];
  res.json(notifications);
});

// Real-time notifications (SSE)
router.get('/notifications/stream/unread/:userId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  console.log('SSE connected for userId:', req.params.userId);
  setInterval(() => {
    res.write(`data: {"message": "New notification for user ${req.params.userId}"}\n\n`);
  }, 5000);
});

// Available classes
router.get('/classes/available', async (req, res) => {
  try {
    const classes = await Class.find().populate('tutor', 'name');
    console.log('Available classes:', classes); // Debug log
    if (!classes || classes.length === 0) {
      return res.status(404).json({ error: 'No classes found' });
    }
    res.json(classes.map(c => ({
      title: c.title || 'No title',
      tutor: c.tutor || { name: 'No tutor' },
      _id: c._id,
      bookedBy: c.bookedBy.length,
      maxStudents: c.maxStudents,
      schedule: { startTime: c.schedule.startTime, endTime: c.schedule.endTime }
    })));
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Search classes by tutor name or title
router.get('/classes/search', async (req, res) => {
  try {
    const query = req.query.q;
    console.log('Search query:', query);
    if (!query) return res.json([]);
    const classes = await Class.aggregate([
      {
        $lookup: {
          from: 'tutors',
          localField: 'tutor',
          foreignField: '_id',
          as: 'tutor'
        }
      },
      { $unwind: '$tutor' },
      {
        $match: {
          $or: [
            { 'title': { $regex: query, $options: 'i' } },
            { 'tutor.name': { $regex: query, $options: 'i' } }
          ]
        }
      },
      {
        $project: {
          title: 1,
          tutor: { name: '$tutor.name' },
          _id: 1,
          bookedBy: 1,
          maxStudents: 1,
          schedule: 1
        }
      }
    ]);
    console.log('Search results:', classes); // Debug log
    if (!classes || classes.length === 0) {
      return res.json([]); // Return empty array for no matches
    }
    res.json(classes.map(c => ({
      title: c.title || 'No title',
      tutor: c.tutor || { name: 'No tutor' },
      _id: c._id,
      bookedBy: c.bookedBy.length,
      maxStudents: c.maxStudents,
      schedule: { startTime: c.schedule.startTime, endTime: c.schedule.endTime }
    })));
  } catch (err) {
    console.error('Error searching classes:', err);
    res.status(500).json({ error: 'Failed to search classes' });
  }
});

// Book a class
router.post('/classes/:id/book', async (req, res) => {
  const classId = req.params.id;
  const studentId = req.body.studentId;
  if (!studentId) return res.status(400).json({ error: 'Student ID is required' });
  const classDoc = await Class.findById(classId);
  if (!classDoc) return res.status(404).json({ error: 'Class not found' });
  if (classDoc.bookedBy.includes(studentId)) return res.status(400).json({ error: 'Already booked' });
  if (classDoc.bookedBy.length >= classDoc.maxStudents) return res.status(400).json({ error: 'Class is full' });
  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const bookedClasses = await Class.find({ bookedBy: studentId });
  for (let bookedClass of bookedClasses) {
    if (bookedClass._id.toString() !== classId) {
      const currentStart = classDoc.schedule.startTime;
      const currentEnd = classDoc.schedule.endTime;
      const bookedStart = bookedClass.schedule.startTime;
      const bookedEnd = bookedClass.schedule.endTime;
      if (currentStart < bookedEnd && currentEnd > bookedStart) {
        return res.status(400).json({ error: 'Scheduling conflict with an existing class' });
      }
    }
  }
  if (bookedClasses.length > 0) {
    return res.status(400).json({ error: 'You can only book one class at a time' });
  }

  classDoc.bookedBy.push(studentId);
  await classDoc.save();
  await Notification.create({
    recipient: classDoc.tutor,
    message: `Student ${student.name || studentId} booked ${classDoc.title}`,
    isRead: false
  });
  res.json({ message: 'Class booked successfully', class: classDoc });
});

// Mark a notification as read
router.put('/notifications/:id/read', async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  notification.isRead = true;
  await notification.save();
  res.json({ message: 'Notification marked as read', notification });
});

// Cancel a class booking
router.delete('/classes/:id/cancel', async (req, res) => {
  const classId = req.params.id;
  const studentId = req.body.studentId;
  if (!studentId) return res.status(400).json({ error: 'Student ID is required' });
  const classDoc = await Class.findById(classId);
  if (!classDoc) return res.status(404).json({ error: 'Class not found' });
  const studentIndex = classDoc.bookedBy.indexOf(studentId);
  if (studentIndex === -1) return res.status(400).json({ error: 'Student not booked in this class' });

  classDoc.bookedBy.splice(studentIndex, 1);
  await classDoc.save();
  await Notification.create({
    recipient: classDoc.tutor,
    message: `Student ${studentId} canceled ${classDoc.title}`,
    isRead: false
  });
  res.json({ message: 'Class booking canceled successfully', class: classDoc });
});

module.exports = router;