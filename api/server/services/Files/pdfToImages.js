const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { FileContext } = require('librechat-data-provider');
const { logger } = require('@librechat/data-schemas');
const { createFile } = require('~/models/File');
const { getStrategyFunctions } = require('~/server/services/Files/strategies');
const { getFileStrategy } = require('~/server/utils/getFileStrategy');

/**
 * Converts the first N pages of an uploaded PDF into PNG images
 * and registers them as linked files in the database and storage.
 *
 * @param {Object} params
 * @param {ServerRequest} params.req - Express request
 * @param {Express.Multer.File} params.file - The uploaded PDF file
 * @param {string} params.parentFileId - File ID of the parent PDF
 * @param {string} params.userId - User ID who uploaded the file
 * @returns {Promise<void>}
 */
async function convertPdfToImages({ req, file, parentFileId, userId }) {
  try {
    const { pdfToPng } = require('pdf-to-png-converter');

    // Determine the image storage strategy configured on the server
    const appConfig = req.config;
    const source = getFileStrategy(appConfig, { isImage: true });
    const { saveBuffer } = getStrategyFunctions(source);

    if (!saveBuffer) {
      logger.warn(`[pdfToImages] saveBuffer strategy not found for strategy: ${source}`);
      return;
    }

    logger.debug(
      `[pdfToImages] Starting PDF conversion for file: ${file.originalname} (${parentFileId})`,
    );

    // Convert PDF pages to image buffers (each page is converted to PNG)
    const outputImages = await pdfToPng(file.path, {
      viewportScale: 1.5, // High quality scale for reading text/charts
    });

    if (!outputImages || outputImages.length === 0) {
      logger.warn(`[pdfToImages] No pages were converted for file: ${file.originalname}`);
      return;
    }

    // Process up to 10 pages to avoid excessive token and storage consumption
    const MAX_PAGES = 10;
    const pagesToConvert = Math.min(outputImages.length, MAX_PAGES);
    logger.debug(
      `[pdfToImages] Converting ${pagesToConvert} of ${outputImages.length} pages to PNG...`,
    );

    const pagePromises = [];

    for (let i = 0; i < pagesToConvert; i++) {
      const page = outputImages[i];
      const pageNumber = page.pageNumber;
      const pageBuffer = page.content;
      const pageFileId = uuidv4();
      const baseName = path.basename(file.originalname, path.extname(file.originalname));
      const fileName = `${pageFileId}-${baseName}_page_${pageNumber}.png`;

      pagePromises.push(
        (async () => {
          try {
            // Save buffer using configured strategy (local, S3, Firebase)
            const filepath = await saveBuffer({ userId, fileName, buffer: pageBuffer });

            // Save file metadata to MongoDB with parent_pdf relation
            await createFile(
              {
                user: userId,
                file_id: pageFileId,
                bytes: pageBuffer.length,
                filepath,
                filename: `${baseName}_page_${pageNumber}.png`,
                context: FileContext.message_attachment,
                source,
                type: 'image/png',
                width: page.width,
                height: page.height,
                metadata: {
                  parent_pdf: parentFileId,
                  page: pageNumber,
                },
              },
              true,
            );

            logger.debug(
              `[pdfToImages] Saved page ${pageNumber} of PDF ${parentFileId} as file ${pageFileId}`,
            );
          } catch (pageError) {
            logger.error(
              `[pdfToImages] Failed to save page ${pageNumber} of PDF ${parentFileId}:`,
              pageError,
            );
          }
        })(),
      );
    }

    await Promise.all(pagePromises);
    logger.info(
      `[pdfToImages] Successfully completed conversion of PDF ${parentFileId} (${pagesToConvert} pages)`,
    );
  } catch (error) {
    logger.error(
      `[pdfToImages] Critical error during PDF conversion for parent file ${parentFileId}:`,
      error,
    );
  }
}

module.exports = {
  convertPdfToImages,
};
