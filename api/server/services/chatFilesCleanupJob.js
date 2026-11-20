/**
 * chatFilesCleanupJob.js
 * ──────────────────────
 * Background job that runs every 24 hours to automatically delete
 * temporary files uploaded to chats (context === 'message_attachment')
 * or created by assistant code runs (context === 'assistants_output')
 * that are older than 60 days.
 *
 * This job does NOT touch files belonging to the SGSST Gestor modules
 * nor any image/file referenced by Blog, Courses, Events, Marketplace,
 * Agents, CompanyInfo, Ruta de Aprendizaje or SG-SST collections.
 */

const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const { getAppConfig } = require('~/server/services/Config');
const { getStrategyFunctions } = require('~/server/services/Files/strategies');

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_AGE_DAYS = 60;
const MAX_SCAN_DEPTH = 6;

const IMAGE_PATH_REGEX = /\/images\/[^\s"'<>)]+/gi;
const USER_IMAGE_PATH_REGEX = /^\/images\/([^/]+)\/([^/]+)$/;

const ALWAYS_PROTECTED_PREFIXES = [
    '/images/blog/',
    '/images/cursos/',
    '/images/events/',
    '/images/sgsst',
    '/images/avatars/',
];

const BASE_PROTECTED_COLLECTIONS = [
    'blogposts',
    'courses',
    'events',
    'rutaaprendizajecourses',
    'marketplaceproducts',
    'agents',
    'companyinfos',
    'sgsstdocuments',
    'sgsstphases',
    'ads',
    'livedocuments',
    'liveeditorsessions',
];

const DIRECT_IMAGE_FIELDS = [
    'thumbnail',
    'image',
    'coverImage',
    'featuredImage',
    'modalImage',
    'brochureUrl',
    'imageUrl',
    'logo',
    'logoUrl',
    'banner',
    'photo',
    'foto',
    'filepath',
    'url',
];

let cleanupTimer = null;

const safeDecodeURIComponent = (value) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

/**
 * Normalizes a direct image/upload URL or path into `{ raw, decoded }`.
 * Returns null if the string is not a direct path/URL (e.g. rich HTML/Markdown).
 */
const normalizeMediaPath = (rawValue) => {
    if (typeof rawValue !== 'string') {
        return null;
    }

    let trimmed = rawValue.trim();
    if (!trimmed || trimmed.length > 2048 || trimmed.startsWith('data:')) {
        return null;
    }

    // Reject multi-line or HTML/quoted blobs as direct URLs (regex scanner handles those)
    if (/[<>"'\n\r]/.test(trimmed)) {
        return null;
    }

    // Strip trailing punctuation often adjacent to URLs in Markdown/JSON
    trimmed = trimmed.replace(/[\\`)\],;]+$/g, '');

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            trimmed = new URL(trimmed).pathname;
        } catch {
            const imgIdx = trimmed.indexOf('/images/');
            const uplIdx = trimmed.indexOf('/uploads/');
            if (imgIdx !== -1) {
                trimmed = trimmed.slice(imgIdx);
            } else if (uplIdx !== -1) {
                trimmed = trimmed.slice(uplIdx);
            } else {
                return null;
            }
        }
    }

    const cleanPath = trimmed.split('?')[0].split('#')[0];
    if (!cleanPath) {
        return null;
    }

    let withSlash = cleanPath;
    if (withSlash.startsWith('images/') || withSlash.startsWith('uploads/')) {
        withSlash = `/${withSlash}`;
    }

    if (!withSlash.startsWith('/images/') && !withSlash.startsWith('/uploads/')) {
        return null;
    }

    withSlash = withSlash.replace(/\/{2,}/g, '/');
    const decoded = safeDecodeURIComponent(withSlash).replace(/\/{2,}/g, '/');

    return {
        raw: withSlash,
        decoded,
    };
};

const addNormalizedToSets = (normalized, protectedPaths, protectedBasenames) => {
    if (!normalized) {
        return;
    }

    protectedPaths.add(normalized.decoded);
    protectedPaths.add(normalized.raw);

    const decodedMatch = normalized.decoded.match(USER_IMAGE_PATH_REGEX);
    if (decodedMatch && decodedMatch[2] && decodedMatch[2].length >= 3) {
        protectedBasenames.add(decodedMatch[2]);
    }
    const rawMatch = normalized.raw.match(USER_IMAGE_PATH_REGEX);
    if (rawMatch && rawMatch[2] && rawMatch[2].length >= 3) {
        protectedBasenames.add(rawMatch[2]);
    }
};

const registerProtectedRef = (rawValue, protectedPaths, protectedBasenames) => {
    if (typeof rawValue !== 'string' || !rawValue || rawValue.startsWith('data:')) {
        return;
    }

    const directNorm = normalizeMediaPath(rawValue);
    if (directNorm) {
        addNormalizedToSets(directNorm, protectedPaths, protectedBasenames);
    }

    if (rawValue.includes('/images/')) {
        IMAGE_PATH_REGEX.lastIndex = 0;
        let match;
        while ((match = IMAGE_PATH_REGEX.exec(rawValue)) !== null) {
            const cleanedMatch = match[0].replace(/[\\"'`<>),;\]]+$/g, '');
            const matchNorm = normalizeMediaPath(cleanedMatch);
            addNormalizedToSets(matchNorm, protectedPaths, protectedBasenames);
        }
    }
};

const scanNestedForImageRefs = (value, protectedPaths, protectedBasenames, depth = 0) => {
    if (value == null || depth > MAX_SCAN_DEPTH) {
        return;
    }

    if (typeof value === 'string') {
        if (!value.startsWith('data:') && value.includes('/images/')) {
            registerProtectedRef(value, protectedPaths, protectedBasenames);
        }
        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            scanNestedForImageRefs(item, protectedPaths, protectedBasenames, depth + 1);
        }
        return;
    }

    if (typeof value === 'object') {
        if (
            value instanceof Date ||
            Buffer.isBuffer(value) ||
            value._bsontype === 'ObjectId' ||
            value._bsontype === 'ObjectID' ||
            value._bsontype === 'Binary'
        ) {
            return;
        }
        for (const key of Object.keys(value)) {
            if (key === '_id' || key === '__v') {
                continue;
            }
            scanNestedForImageRefs(value[key], protectedPaths, protectedBasenames, depth + 1);
        }
    }
};

const extractProtectedPathsFromDoc = (doc, protectedPaths, protectedBasenames) => {
    if (!doc || typeof doc !== 'object') {
        return;
    }

    for (const field of DIRECT_IMAGE_FIELDS) {
        if (typeof doc[field] === 'string') {
            registerProtectedRef(doc[field], protectedPaths, protectedBasenames);
        }
    }

    // avatar.filepath (and string avatar / avatar.url)
    if (typeof doc.avatar === 'string') {
        registerProtectedRef(doc.avatar, protectedPaths, protectedBasenames);
    } else if (doc.avatar && typeof doc.avatar === 'object') {
        registerProtectedRef(doc.avatar.filepath, protectedPaths, protectedBasenames);
        registerProtectedRef(doc.avatar.url, protectedPaths, protectedBasenames);
    }

    // images[] and gallery[]
    for (const arrField of ['images', 'gallery']) {
        if (Array.isArray(doc[arrField])) {
            for (const entry of doc[arrField]) {
                if (typeof entry === 'string') {
                    registerProtectedRef(entry, protectedPaths, protectedBasenames);
                } else if (entry && typeof entry === 'object') {
                    registerProtectedRef(entry.filepath, protectedPaths, protectedBasenames);
                    registerProtectedRef(entry.url, protectedPaths, protectedBasenames);
                    registerProtectedRef(entry.thumbnail, protectedPaths, protectedBasenames);
                }
            }
        }
    }

    // attachments[].url / filepath
    if (Array.isArray(doc.attachments)) {
        for (const att of doc.attachments) {
            if (att && typeof att === 'object') {
                registerProtectedRef(att.url, protectedPaths, protectedBasenames);
                registerProtectedRef(att.filepath, protectedPaths, protectedBasenames);
            }
        }
    }

    // content & description HTML/Markdown
    if (typeof doc.content === 'string') {
        registerProtectedRef(doc.content, protectedPaths, protectedBasenames);
    }
    if (typeof doc.description === 'string') {
        registerProtectedRef(doc.description, protectedPaths, protectedBasenames);
    }

    // lessons[] (Courses / Ruta de Aprendizaje)
    if (Array.isArray(doc.lessons)) {
        for (const lesson of doc.lessons) {
            if (!lesson || typeof lesson !== 'object') {
                continue;
            }
            registerProtectedRef(lesson.thumbnail, protectedPaths, protectedBasenames);
            registerProtectedRef(lesson.image, protectedPaths, protectedBasenames);
            registerProtectedRef(lesson.coverImage, protectedPaths, protectedBasenames);
            registerProtectedRef(lesson.content, protectedPaths, protectedBasenames);
            registerProtectedRef(lesson.description, protectedPaths, protectedBasenames);
            if (Array.isArray(lesson.attachments)) {
                for (const att of lesson.attachments) {
                    if (att && typeof att === 'object') {
                        registerProtectedRef(att.url, protectedPaths, protectedBasenames);
                        registerProtectedRef(att.filepath, protectedPaths, protectedBasenames);
                    }
                }
            }
        }
    }

    // Recursive scan to catch nested /images/... references in dynamic SG-SST/Ruta schemas
    scanNestedForImageRefs(doc, protectedPaths, protectedBasenames, 0);
};

/**
 * Scans all content/SG-SST collections in MongoDB and collects referenced image paths
 * so that cleanup never deletes thumbnails, covers or embedded media.
 */
const collectProtectedImagePaths = async () => {
    const db = mongoose.connection?.db;
    if (!db) {
        throw new Error('MongoDB connection db handle is not available for protected reference scan.');
    }

    const protectedPaths = new Set();
    const protectedBasenames = new Set();

    const existingCollections = await db.listCollections({}, { nameOnly: true }).toArray();
    const existingNames = new Set(existingCollections.map((c) => c.name));

    const targetCollectionSet = new Set();
    for (const baseName of BASE_PROTECTED_COLLECTIONS) {
        if (existingNames.has(baseName)) {
            targetCollectionSet.add(baseName);
        }
    }
    for (const colName of existingNames) {
        if (/^(sgsst|ruta)/i.test(colName)) {
            targetCollectionSet.add(colName);
        }
    }

    const scannedCollections = [];
    const failedCollections = [];

    for (const colName of targetCollectionSet) {
        try {
            const cursor = db.collection(colName).find({});
            for await (const doc of cursor) {
                extractProtectedPathsFromDoc(doc, protectedPaths, protectedBasenames);
            }
            scannedCollections.push(colName);
        } catch (colErr) {
            failedCollections.push({ collection: colName, message: colErr.message });
            logger.error(`[ChatFilesCleanupJob] Error scanning protected collection "${colName}":`, colErr);
        }
    }

    return {
        protectedPaths,
        protectedBasenames,
        scannedCollections,
        failedCollections,
    };
};

const isFileProtected = (file, protectedPaths, protectedBasenames) => {
    const rawFilepath = typeof file?.filepath === 'string' ? file.filepath.trim() : '';
    if (!rawFilepath) {
        return false;
    }

    const cleanRaw = rawFilepath.split('?')[0].split('#')[0];
    const normalized = normalizeMediaPath(cleanRaw);
    const candidatePath = normalized ? normalized.decoded : safeDecodeURIComponent(cleanRaw);
    const candidateRaw = normalized ? normalized.raw : cleanRaw;

    // 1. Always protect dedicated permanent image directories
    if (
        ALWAYS_PROTECTED_PREFIXES.some(
            (prefix) => candidatePath.startsWith(prefix) || candidateRaw.startsWith(prefix),
        )
    ) {
        return true;
    }

    // 2. Exact normalized full path match
    if (protectedPaths.has(candidatePath) || protectedPaths.has(candidateRaw)) {
        return true;
    }

    // 3. Basename match when file resides in /images/<userId>/<filename>
    const userImgMatch =
        candidatePath.match(USER_IMAGE_PATH_REGEX) || candidateRaw.match(USER_IMAGE_PATH_REGEX);
    if (userImgMatch && userImgMatch[2]) {
        const basename = userImgMatch[2];
        const decodedBasename = safeDecodeURIComponent(basename);
        if (protectedBasenames.has(basename) || protectedBasenames.has(decodedBasename)) {
            return true;
        }
    }

    return false;
};

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

        // Build protected media registry from live MongoDB collections before deleting anything
        const {
            protectedPaths,
            protectedBasenames,
            scannedCollections,
            failedCollections,
        } = await collectProtectedImagePaths();

        if (failedCollections.length > 0) {
            logger.error(
                `[ChatFilesCleanupJob] Aborting deletion cycle because ${failedCollections.length} protected collection(s) failed to scan: ${failedCollections.map((f) => `${f.collection} (${f.message})`).join(', ')}`,
            );
            return;
        }

        logger.info(
            `[ChatFilesCleanupJob] Found ${filesToDelete.length} expired file(s). Scanned ${scannedCollections.length} protected collection(s); ${protectedPaths.size} protected path(s) and ${protectedBasenames.size} protected basename(s) indexed.`,
        );

        let deletedCount = 0;
        let skippedProtectedCount = 0;
        let bytesFreed = 0;
        let errorsCount = 0;

        for (const file of filesToDelete) {
            try {
                if (isFileProtected(file, protectedPaths, protectedBasenames)) {
                    skippedProtectedCount++;
                    logger.debug(
                        `[ChatFilesCleanupJob] Skipping protected referenced file ${file.file_id} (${file.filepath})`,
                    );
                    continue;
                }

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
        logger.info(
            `[ChatFilesCleanupJob] Cleanup cycle finished. Successfully deleted ${deletedCount}/${filesToDelete.length} files. Skipped protected: ${skippedProtectedCount}. Freed ${sizeFreedMB} MB. Errors: ${errorsCount}`,
        );

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
    runCleanupCycle,
    collectProtectedImagePaths,
    isFileProtected,
};
