const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireJwtAuth, checkJwtAuth } = require('../middleware');
const { getAppConfig } = require('../../server/services/Config');
const { getCourses, getCourseById, markLessonComplete } = require('../controllers/TrainingController');
const {
    getAllCoursesAdmin,
    createCourse,
    updateCourse,
    deleteCourse,
    addLesson,
    updateLesson,
    deleteLesson,
    generateTrainingContent,
    setFeaturedCourse
} = require('../controllers/AdminTrainingController');

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            const appConfig = await getAppConfig();
            const baseUploads = appConfig?.paths?.uploads || path.resolve(__dirname, '../../../uploads');
            const dir = path.join(baseUploads, 'training');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        } catch (err) {
            cb(err);
        }
    },
    filename: function (req, file, cb) {
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const finalName = `${Date.now()}-${cleanName}`;
        cb(null, finalName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// All endpoints require authentication / public download
router.get('/download/:filename', async (req, res) => {
    try {
        const appConfig = await getAppConfig();
        const baseUploads = appConfig?.paths?.uploads || path.resolve(__dirname, '../../../uploads');
        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.resolve(baseUploads, 'training', filename);
        const safeDir = path.resolve(baseUploads, 'training');

        if (!filePath.startsWith(safeDir) || !fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'El archivo solicitado no existe.' });
        }

        const originalName = filename.includes('-') ? filename.substring(filename.indexOf('-') + 1) : filename;
        return res.download(filePath, originalName);
    } catch (err) {
        console.error('[TrainingRouter] Download error:', err);
        return res.status(500).json({ error: 'Error interno al descargar el archivo.' });
    }
});

router.get('/courses', checkJwtAuth, getCourses);
router.get('/courses/:id', checkJwtAuth, getCourseById);
router.post('/progress', requireJwtAuth, markLessonComplete);

// --- Admin Endpoints (Role checks handled in controller) ---
router.post('/admin/upload', requireJwtAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        const filename = req.file.filename;
        const originalName = req.file.originalname;
        const size = req.file.size;
        const fileType = path.extname(originalName).replace('.', '').toLowerCase();
        const url = `/api/training/download/${encodeURIComponent(filename)}`;

        return res.json({
            success: true,
            file: {
                name: originalName,
                url,
                filename,
                size,
                fileType
            }
        });
    } catch (err) {
        console.error('[TrainingRouter] Upload error:', err);
        return res.status(500).json({ error: 'Error al subir el archivo.' });
    }
});

router.get('/admin/courses', requireJwtAuth, getAllCoursesAdmin);
router.post('/admin/courses', requireJwtAuth, createCourse);
router.put('/admin/courses/:id', requireJwtAuth, updateCourse);
router.delete('/admin/courses/:id', requireJwtAuth, deleteCourse);

router.post('/admin/courses/:courseId/lessons', requireJwtAuth, addLesson);
router.put('/admin/courses/:courseId/lessons/:lessonId', requireJwtAuth, updateLesson);
router.delete('/admin/courses/:courseId/lessons/:lessonId', requireJwtAuth, deleteLesson);

router.post('/admin/generate', requireJwtAuth, generateTrainingContent);
router.put('/admin/courses/:id/featured', requireJwtAuth, setFeaturedCourse);

module.exports = router;

