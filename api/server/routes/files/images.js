const path = require('path');
const fs = require('fs').promises;
const express = require('express');
const { logger } = require('@librechat/data-schemas');
const { isAgentsEndpoint } = require('librechat-data-provider');
const {
  filterFile,
  processImageFile,
  processAgentFileUpload,
} = require('~/server/services/Files/process');
const { countUserFilesToday } = require('~/models/File');

const router = express.Router();

router.post('/', async (req, res) => {
  if (req.user && req.user.role === 'USER') {
    const count = await countUserFilesToday(req.user.id);
    if (count >= 3) {
      return res.status(403).json({
        error: 'upload_limit_reached',
        message: 'Has alcanzado el límite de 3 archivos diarios del plan Gratis. Adquiere el plan Wappy Vital para subidas ilimitadas.',
      });
    }
  }

  const metadata = req.body;
  const appConfig = req.config;

  try {
    filterFile({ req, image: true });

    metadata.temp_file_id = metadata.file_id;
    metadata.file_id = req.file_id;

    if (isAgentsEndpoint(metadata.endpoint) && metadata.tool_resource != null) {
      return await processAgentFileUpload({ req, res, metadata });
    }

    await processImageFile({ req, res, metadata });
  } catch (error) {
    // TODO: delete remote file if it exists
    logger.error('[/files/images] Error processing file:', error);

    let message = 'Error processing file';

    if (
      error.message?.includes('Invalid file format') ||
      error.message?.includes('No OCR result') ||
      error.message?.includes('exceeds token limit')
    ) {
      message = error.message;
    }

    try {
      const filepath = path.join(
        appConfig.paths.imageOutput,
        req.user.id,
        path.basename(req.file.filename),
      );
      await fs.unlink(filepath);
    } catch (error) {
      logger.error('[/files/images] Error deleting file:', error);
    }
    res.status(500).json({ message });
  } finally {
    try {
      await fs.unlink(req.file.path);
      logger.debug('[/files/images] Temp. image upload file deleted');
    } catch {
      logger.debug('[/files/images] Temp. image upload file already deleted');
    }
  }
});

module.exports = router;
