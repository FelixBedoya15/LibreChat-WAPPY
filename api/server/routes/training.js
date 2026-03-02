const express = require('express');
const router = express.Router();
const checkBalance = require('../middleware/checkBalance');
const { getCourses, getCourseById, markLessonComplete } = require('../controllers/TrainingController');

// All endpoints require authentication (assumed handled by parent router)
router.get('/courses', checkBalance, getCourses);
router.get('/courses/:id', checkBalance, getCourseById);
router.post('/progress', checkBalance, markLessonComplete);

module.exports = router;
