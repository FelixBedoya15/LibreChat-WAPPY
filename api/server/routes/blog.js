const express = require('express');
const { requireJwtAuth } = require('../middleware');
const {
    getBlogPosts,
    getBlogPostById,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    generateBlogPost
} = require('../controllers/BlogController');

const router = express.Router();

// Public routes (or authenticated only, up to user)
router.get('/', requireJwtAuth, getBlogPosts);
router.get('/:id', requireJwtAuth, getBlogPostById);

// Admin / Write routes
router.post('/admin/generate', requireJwtAuth, generateBlogPost);
router.post('/create', requireJwtAuth, createBlogPost);
router.put('/:id', requireJwtAuth, updateBlogPost);
router.delete('/:id', requireJwtAuth, deleteBlogPost);

module.exports = router;
