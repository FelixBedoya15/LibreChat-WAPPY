/**
 * chatFilesCleanupJob.js
 * ──────────────────────
 * Background job that runs every 24 hours to automatically delete
 * temporary files uploaded to chats (context === 'message_attachment')
 * or created by assistant code runs (context === 'assistants_output')
 * that are older than 60 days.
 *
 * This job does NOT touch files belonging to the SGSST Gestor modules.
 */

const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const { getAppConfig } = require('~/server/services/Config');
const { getStrategyFunctions } = require('~/server/services/Files/strategies');

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_AGE_DAYS = 60;

let cleanupTimer = null;

const runCleanupCycle = async () => {
    try {
        const File = mongoose.models.File || mongoose.model('File');
        const appConfig = await getAppConfig();
        const cutoffDate = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

        logger.info(`[ChatFilesCleanupJob] Checking for files older than ${MAX_AGE_DAYS} days (Cutoff: ${cutoffDate.toISOString()})...`);

        // Find temporary files (chat attachments or assistant output) older than cutoff
        const filesToDelete = await File.find({
            context: { $in: ['message_attachment', 'assistants_output'] },
            createdAt: { $lte: cutoffDate }
        }).lean();

        if (filesToDelete.length === 0) {
            logger.info('[ChatFilesCleanupJob] No expired chat files found.');
            return;
        }

        logger.info(`[ChatFilesCleanupJob] Found ${filesToDelete.length} expired file(s) to clean up.`);

        let deletedCount = 0;
        let bytesFreed = 0;
        let errorsCount = 0;

        for (const file of filesToDelete) {
            try {
                const source = file.source || 'local';
                const { deleteFile } = getStrategyFunctions(source);

                if (!deleteFile) {
                    logger.warn(`[ChatFilesCleanupJob] Delete strategy not implemented for source: ${source}`);
                    continue;
                }

                // Construct a mock request object for the storage strategies
                const mockReq = {
                    user: { id: file.user ? file.user.toString() : '' },
                    config: appConfig,
                    isSystem: true
                };

                // Delete physically
                await deleteFile(mockReq, file);

                // Delete from MongoDB
                await File.deleteOne({ _id: file._id });

                deletedCount++;
                bytesFreed += file.bytes || 0;
            } catch (err) {
                errorsCount++;
                logger.error(`[ChatFilesCleanupJob] Error deleting file ${file.file_id}:`, err);
            }
        }

        const sizeFreedMB = (bytesFreed / (1024 * 1024)).toFixed(2);
        logger.info(`[ChatFilesCleanupJob] Cleanup cycle finished. Successfully deleted ${deletedCount}/${filesToDelete.length} files. Freed ${sizeFreedMB} MB. Errors: ${errorsCount}`);

    } catch (error) {
        logger.error('[ChatFilesCleanupJob] Error running cleanup cycle:', error);
    }
};

const startChatFilesCleanupJob = () => {
    if (cleanupTimer) {
        clearInterval(cleanupTimer);
    }

    logger.info('[ChatFilesCleanupJob] Initializing chat files cleanup job...');
    
    // Run once on startup after 30 seconds delay to not block main thread boot
    setTimeout(() => {
        runCleanupCycle().catch(err => logger.error('[ChatFilesCleanupJob] Initial run error:', err));
    }, 30000);

    // Set interval for daily runs
    cleanupTimer = setInterval(async () => {
        await runCleanupCycle();
    }, CLEANUP_INTERVAL_MS);
};

module.exports = {
    startChatFilesCleanupJob,
    runCleanupCycle
};
