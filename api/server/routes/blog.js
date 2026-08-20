const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireJwtAuth, checkJwtAuth } = require('../middleware');
const { getAppConfig } = require('../../server/services/Config');
const {
    getBlogPosts,
    getBlogPostById,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    generateBlogPost,
    setFeaturedPost
} = require('../controllers/BlogController');

const router = express.Router();

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            const appConfig = await getAppConfig();
            const baseUploads = appConfig?.paths?.uploads || path.resolve(__dirname, '../../../uploads');
            const dir = path.join(baseUploads, 'blog');
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

// Download endpoint
router.get('/download/:filename', async (req, res) => {
    try {
        const appConfig = await getAppConfig();
        const baseUploads = appConfig?.paths?.uploads || path.resolve(__dirname, '../../../uploads');
        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.resolve(baseUploads, 'blog', filename);
        const safeDir = path.resolve(baseUploads, 'blog');

        if (!filePath.startsWith(safeDir) || !fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'El archivo solicitado no existe.' });
        }

        const originalName = filename.includes('-') ? filename.substring(filename.indexOf('-') + 1) : filename;
        return res.download(filePath, originalName);
    } catch (err) {
        console.error('[BlogRouter] Download error:', err);
        return res.status(500).json({ error: 'Error interno al descargar el archivo.' });
    }
});

// Public routes (or authenticated only, up to user)
router.get('/', checkJwtAuth, getBlogPosts);
router.get('/:id', getBlogPostById);

// Admin / Write routes
router.post('/upload', requireJwtAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        const filename = req.file.filename;
        const originalName = req.file.originalname;
        const size = req.file.size;
        const fileType = path.extname(originalName).replace('.', '').toLowerCase();
        const url = `/api/blog/download/${encodeURIComponent(filename)}`;

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
        console.error('[BlogRouter] Upload error:', err);
        return res.status(500).json({ error: 'Error al subir el archivo.' });
    }
});

router.post('/admin/upload', requireJwtAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo.' });
        }

        const filename = req.file.filename;
        const originalName = req.file.originalname;
        const size = req.file.size;
        const fileType = path.extname(originalName).replace('.', '').toLowerCase();
        const url = `/api/blog/download/${encodeURIComponent(filename)}`;

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
        console.error('[BlogRouter] Upload error:', err);
        return res.status(500).json({ error: 'Error al subir el archivo.' });
    }
});

router.post('/admin/generate', requireJwtAuth, generateBlogPost);
router.post('/create', requireJwtAuth, createBlogPost);
router.put('/:id', requireJwtAuth, updateBlogPost);
router.delete('/:id', requireJwtAuth, deleteBlogPost);
router.put('/admin/:id/featured', requireJwtAuth, setFeaturedPost);

module.exports = router;

