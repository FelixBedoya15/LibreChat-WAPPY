const express = require('express');
const router = express.Router();
const {
    getAds,
    getAllAds,
    createAd,
    updateAd,
    deleteAd,
} = require('~/server/controllers/AdController');
const { requireJwtAuth } = require('~/server/middleware');
const { requireAdmin } = require('~/server/middleware/roles/admin');

// Public route to fetch active ads (optional: might want to require auth too, but usually ads are public)
// Let's require JWT for fetching to match general app security if needed, or leave open. 
// Assuming logged in users view ads.
router.get('/', requireJwtAuth, getAds);

// Admin routes
router.get('/admin', requireJwtAuth, requireAdmin, getAllAds);
router.post('/', requireJwtAuth, requireAdmin, createAd);
router.put('/:id', requireJwtAuth, requireAdmin, updateAd);
router.delete('/:id', requireJwtAuth, requireAdmin, deleteAd);

module.exports = router;
