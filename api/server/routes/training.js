const express = require('express');
const router = express.Router();
const requireJwtAuth = require('../middleware/requireJwtAuth');
const { getCourses, getCourseById, markLessonComplete } = require('../controllers/TrainingController');
const {
    getAllCoursesAdmin,
    createCourse,
    updateCourse,
    deleteCourse,
    addLesson,
    updateLesson,
    deleteLesson,
    generateTrainingContent
} = require('../controllers/AdminTrainingController');

// All endpoints require authentication
router.get('/courses', requireJwtAuth, getCourses);
router.get('/courses/:id', requireJwtAuth, getCourseById);
router.post('/progress', requireJwtAuth, markLessonComplete);

// --- Admin Endpoints (Role checks handled in controller) ---
router.get('/admin/courses', requireJwtAuth, getAllCoursesAdmin);
router.post('/admin/courses', requireJwtAuth, createCourse);
router.put('/admin/courses/:id', requireJwtAuth, updateCourse);
router.delete('/admin/courses/:id', requireJwtAuth, deleteCourse);

router.post('/admin/courses/:courseId/lessons', requireJwtAuth, addLesson);
router.put('/admin/courses/:courseId/lessons/:lessonId', requireJwtAuth, updateLesson);
router.delete('/admin/courses/:courseId/lessons/:lessonId', requireJwtAuth, deleteLesson);

router.post('/admin/generate', requireJwtAuth, generateTrainingContent);

module.exports = router;
