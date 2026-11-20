const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const paths = require('~/config/paths');
const { requireJwtAuth, checkJwtAuth } = require('../middleware');
const { getAppConfig } = require('../../server/services/Config');
const {
    getBlogPosts,
    getBlogPostById,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    generateBlogPost,
    beautifyBlogContent,
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

const thumbnailStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            const baseImages = paths.imageOutput || path.resolve(__dirname, '../../../client/public/images');
            const dir = path.join(baseImages, 'blog');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        } catch (err) {
            cb(err);
        }
    },
    filename: function (req, file, cb) {
        const baseName = path.basename(file.originalname || 'thumbnail.png');
        const cleanName = baseName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const finalName = `${Date.now()}-${cleanName}`;
        cb(null, finalName);
    }
});

const uploadThumbnail = multer({
    storage: thumbnailStorage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    fileFilter: function (req, file, cb) {
        if (file && typeof file.mimetype === 'string' && file.mimetype.toLowerCase().startsWith('image/')) {
            return cb(null, true);
        }
        const err = new Error('Solo se permiten archivos de imagen (image/*).');
        err.statusCode = 400;
        return cb(err);
    }
});

const handleThumbnailUploadMiddleware = (req, res, next) => {
    uploadThumbnail.fields([
        { name: 'file', maxCount: 1 },
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ])(req, res, (err) => {
        if (err) {
            const isClientError = err instanceof multer.MulterError || err.statusCode === 400;
            const status = isClientError ? 400 : 500;
            const message =
                err.code === 'LIMIT_FILE_SIZE'
                    ? 'La imagen excede el tamaño máximo permitido de 15MB.'
                    : err.message || 'Error al procesar la miniatura.';
            console.error('[BlogRouter] Thumbnail upload middleware error:', err);
            return res.status(status).json({ success: false, error: message });
        }
        return next();
    });
};

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

// Editorial beautify & AI admin routes (declaradas ANTES de /:id)
router.post('/admin/beautify', requireJwtAuth, beautifyBlogContent);
router.post('/admin/generate', requireJwtAuth, generateBlogPost);

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

router.post('/admin/upload-thumbnail', requireJwtAuth, handleThumbnailUploadMiddleware, async (req, res) => {
    try {
        const uploadedFile =
            req.file ||
            req.files?.file?.[0] ||
            req.files?.image?.[0] ||
            req.files?.thumbnail?.[0];

        if (!uploadedFile) {
            return res.status(400).json({ success: false, error: 'No se ha subido ninguna imagen.' });
        }

        const filename = uploadedFile.filename;
        const publicPath = `/images/blog/${filename}`;

        return res.json({
            success: true,
            filepath: publicPath,
            url: publicPath,
            filename
        });
    } catch (err) {
        console.error('[BlogRouter] Thumbnail upload error:', err);
        return res.status(500).json({ success: false, error: 'Error al subir la miniatura.' });
    }
});

router.post('/create', requireJwtAuth, createBlogPost);
router.put('/:id', requireJwtAuth, updateBlogPost);
router.delete('/:id', requireJwtAuth, deleteBlogPost);
router.put('/admin/:id/featured', requireJwtAuth, setFeaturedPost);

module.exports = router;

