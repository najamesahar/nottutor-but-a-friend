const express = require('express');
const router = express.Router();
const { createClass, getAllClasses, searchClasses, getAvailableClasses, bookClass, updateClass, deleteClass } = require('../controllers/classController');

router.post('/create', createClass);
router.get('/all', getAllClasses);
router.get('/search', searchClasses);
router.get('/available', getAvailableClasses);
router.post('/book/:classId', bookClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

module.exports = router;