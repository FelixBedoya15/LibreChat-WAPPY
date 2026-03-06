const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const { logger } = require('@librechat/data-schemas');
const { uploadVectors } = require('./Files/VectorDB');

/**
 * Syncs educational or administrative content to the RAG Vector DB
 * @param {Object} params
 * @param {ServerRequest} params.req
 * @param {string} params.type - 'blog', 'course', 'ticket', 'feedback'
 * @param {string} params.id - Unique ID for the document
 * @param {string} params.content - Text content to index
 * @param {string} [params.title] - Optional title for the document
 */
async function syncToRag({ req, type, id, content, title }) {
    if (!process.env.RAG_API_URL) {
        logger.debug('[RAG Sync] Skipped: RAG_API_URL not set');
        return;
    }

    try {
        const fullContent = title ? `${title.toUpperCase()}\n\n${content}` : content;
        const filename = `${type}_${id}.txt`;
        const tempPath = path.join(os.tmpdir(), filename);

        fs.writeFileSync(tempPath, fullContent);

        await uploadVectors({
            req,
            file: {
                path: tempPath,
                originalname: filename,
                size: fullContent.length,
                mimetype: 'text/plain'
            },
            file_id: `${type}_${id}`,
            // Common entity_id for Tenshi to query everything at once
            entity_id: 'tenshi_knowledge_base'
        });

        fs.unlinkSync(tempPath);
        logger.debug(`[RAG Sync] Content synced: ${type}/${id}`);
    } catch (err) {
        logger.error(`[RAG Sync] Failed syncing ${type}/${id}:`, err.message);
    }
}

module.exports = { syncToRag };
