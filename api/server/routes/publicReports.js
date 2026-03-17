const express = require('express');
const { v4: uuidv4 } = require('uuid');
const PublicReport = require('~/models/PublicReport');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');

const router = express.Router();

/**
 * Save a report for public sharing.
 */
router.post('/', requireJwtAuth, async (req, res) => {
  try {
    const { content, fileName, reportType } = req.body;
    const id = uuidv4();
    
    const publicReport = new PublicReport({
      id,
      content,
      fileName,
      reportType,
    });

    await publicReport.save();

    res.json({ id });
  } catch (error) {
    logger.error('[PublicReports] Save error:', error);
    res.status(500).json({ error: 'Error saving public report' });
  }
});

/**
 * Retrieve a public report by ID.
 * This route is public.
 */
router.get('/:id', async (req, res) => {
  try {
    const report = await PublicReport.findOne({ id: req.params.id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    logger.error('[PublicReports] Get error:', error);
    res.status(500).json({ error: 'Error retrieving public report' });
  }
});

module.exports = router;
