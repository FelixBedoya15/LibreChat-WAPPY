const express = require('express');
const router = express.Router();
const requireJwtAuth = require('../middleware/requireJwtAuth');
const { getCourses, getCourseById, markLessonComplete } = require('../controllers/TrainingController');

// All endpoints require authentication
router.get('/courses', requireJwtAuth, getCourses);
router.get('/courses/:id', requireJwtAuth, getCourseById);
router.post('/progress', requireJwtAuth, markLessonComplete);

module.exports = router;
