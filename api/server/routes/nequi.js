const express = require('express');
const router = express.Router();
const nequiController = require('../controllers/NequiController');
const { requireJwtAuth } = require('@librechat/api');

router.post('/link', requireJwtAuth, nequiController.linkAccount);
router.post('/verify-and-charge', requireJwtAuth, nequiController.verifyAndCharge);

module.exports = router;
