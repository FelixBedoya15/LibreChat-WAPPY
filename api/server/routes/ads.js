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
router.get('/admin', requireAdmin, getAllAds);
router.post('/', requireAdmin, createAd);
router.put('/:id', requireAdmin, updateAd);
router.delete('/:id', requireAdmin, deleteAd);

module.exports = router;
