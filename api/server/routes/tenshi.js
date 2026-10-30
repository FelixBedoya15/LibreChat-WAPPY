const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireJwtAuth } = require('../middleware');
const TenshiConfig = require('../../models/TenshiConfig');
const TenshiMessage = require('../../models/TenshiMessage');
const { BlogPost } = require('../../models/BlogPost');
const { Course } = require('../../models/Course');
const Ticket = require('../../models/Ticket');
const axios = require('axios');
const { AuthKeys } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');
const { logger } = require('~/config');
const { generateShortLivedToken, Tokenizer } = require('@librechat/api');
const { getAllUserMemories, setMemory, deleteMemory } = require('~/models');
const CompanyInfo = require('../../models/CompanyInfo');
const { syncCompanyMemory } = require('./sgsst/companyInfo');
const SomosSST = require('../../app/clients/tools/structured/SomosSST');
const GoogleDrive = require('../../app/clients/tools/structured/GoogleDrive');
const ConsultarAgenteEspecializado = require('../../app/clients/tools/structured/ConsultarAgenteEspecializado');
const CanvasTool = require('../../app/clients/tools/structured/CanvasTool');
const { getActiveSkillInstructions, getActiveSkillsData } = require('~/server/services/skillRouter');
const { resolveApiKeys } = require('./sgsst/sgsstGemini');
const { executeTenshiMcpTool, TOOL_ROUTES } = require('./voice/tenshiMcpDispatcher');
const TenshiPendingAction = require('../../models/TenshiPendingAction');
const TenshiProceduralMemory = require('../../models/TenshiProceduralMemory');
const {
    isGovernedTool,
    stageGovernedAction,
    buildGenerativeWidgetForTool,
    manageProceduralMemory,
    getProceduralMemoryPromptBlock,
    autoSynthesizeProceduralRule,
    searchInstantHistory,
    searchNormativeKnowledgeBase,
} = require('./voice/tenshiOpenBotEngine');

function sanitizeSlug(title) {
    if (!title || typeof title !== 'string') return '';
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

async function findMatchingCourse(query) {
    if (!query || typeof query !== 'string') return null;
    const clean = query.trim();
    if (mongoose.isValidObjectId(clean)) {
        const byId = await Course.findById(clean).lean().catch(() => null);
        if (byId) return byId;
    }
    let searchTerm = clean;
    if (/\b(a\s*picar|a\s*pi\s*key|api\s*key)\b/i.test(searchTerm)) {
        searchTerm = 'api key';
    }
    const safeRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    let course = await Course.findOne({
        $or: [
            { title: safeRegex },
            { description: safeRegex },
            { 'lessons.title': safeRegex }
        ]
    }).lean().catch(() => null);
    if (course) return course;

    const words = searchTerm.split(/\s+/).filter(w => w.length > 3 && !['para', 'curso', 'sobre', 'este', 'como', 'facil', 'abrir', 'abre'].includes(w.toLowerCase()));
    for (const w of words) {
        const wordRegex = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        course = await Course.findOne({
            $or: [{ title: wordRegex }, { 'lessons.title': wordRegex }]
        }).lean().catch(() => null);
        if (course) return course;
    }
    return null;
}

async function findMatchingBlogPost(query) {
    if (!query || typeof query !== 'string') return null;
    const clean = query.trim();
    if (mongoose.isValidObjectId(clean)) {
        const byId = await BlogPost.findById(clean).lean().catch(() => null);
        if (byId) return byId;
    }
    const safeRegex = new RegExp(clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    let post = await BlogPost.findOne({
        $or: [
            { title: safeRegex },
            { slug: safeRegex },
            { tags: safeRegex }
        ]
    }).lean().catch(() => null);
    if (post) return post;

    const words = clean.split(/\s+/).filter(w => w.length > 3 && !['para', 'post', 'blog', 'articulo', 'sobre'].includes(w.toLowerCase()));
    for (const w of words) {
        const wordRegex = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        post = await BlogPost.findOne({ title: wordRegex }).lean().catch(() => null);
        if (post) return post;
    }
    return null;
}

// Knowledge Retrieval System (RAG)
async function getRelevantTickets(req, userQuery) {
    if (!userQuery || userQuery.length < 4) return '';
    let context = '';

    // 1. Consultar Base de Datos Normativa y Técnica interna de WAPPY (99+ archivos .md: Vademécum 2026, Res 1843/2025, Batería Psicosocial, etc.)
    try {
        const normativeRag = await searchNormativeKnowledgeBase(userQuery, 3);
        if (normativeRag && normativeRag.exito && normativeRag.textoFormateado) {
            context = normativeRag.textoFormateado;
        }
    } catch (_e) {}

    // 2. Try Vector DB (App RAG System) with 2000ms timeout
    if (!context && process.env.RAG_API_URL) {
        try {
            const jwtToken = generateShortLivedToken(req.user.id);
            const response = await axios.post(`${process.env.RAG_API_URL}/query`, {
                query: userQuery,
                entity_id: 'tenshi_knowledge_base',
                k: 3
            }, {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 2000
            });

            if (response.data && response.data.length > 0) {
                context = response.data.map(m => {
                    const content = m[0]?.page_content || m.text || '';
                    return `[RAG MATCH] ${content.trim()}`;
                }).join('\n');
            }
        } catch (e) {
            // Silently ignore RAG timeout/connection error for speed
        }
    }

    // 3. Fallback to MongoDB Smart Search (Text Index)
    if (!context) {
        try {
            const matches = await Ticket.find(
                { status: 'resolved', $text: { $search: userQuery } },
                { score: { $meta: 'textScore' } }
            )
                .sort({ score: { $meta: 'textScore' } })
                .limit(2)
                .lean();

            if (matches.length > 0) {
                context = matches.map(t => `- PQRS RELEVANTE [${t.type}]: ${t.description} -> SOLUCIÓN: ${t.response}`).join('\n');
            }
        } catch (e) {}
    }

    return context;
}

// In-memory cache for static platform manual
let cachedManualContent = null;
function getPlatformManual() {
    if (cachedManualContent !== null) return cachedManualContent;
    try {
        const fs = require('fs');
        const path = require('path');
        const manualPath = path.resolve(__dirname, '../../../client/public/manual_usuario.md');
        if (fs.existsSync(manualPath)) {
            let content = fs.readFileSync(manualPath, 'utf8');
            if (content.length > 3000) content = content.substring(0, 3000) + '\n...(manual truncado para eficiencia)';
            cachedManualContent = content;
            return cachedManualContent;
        }
    } catch (e) {}
    cachedManualContent = 'WAPPY IA opera la plataforma central Somos SST (/sgsst) dividida en 2 Módulos Principales: 1. Motor Bio-Individual (Bio Motor) y 2. Ecosistema SG-SST General.';
    return cachedManualContent;
}

router.get('/config', async (req, res) => {
    try {
        let config = await TenshiConfig.findOne().lean();
        if (!config) {
            config = await TenshiConfig.create({});
        }
        res.json(config);
    } catch (error) {
        console.error('Error fetching Tenshi config:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/config', requireJwtAuth, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        let config = await TenshiConfig.findOne();
        if (!config) {
            config = new TenshiConfig(req.body);
        } else {
            Object.assign(config, req.body);
        }
        await config.save();
        res.json(config);
    } catch (error) {
        console.error('Error saving Tenshi config:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function extractTextFromMedia(mediaObj) {
    if (!mediaObj || !mediaObj.dataUrl) return '';
    try {
        const rawMatch = mediaObj.dataUrl.match(/^data:([a-zA-Z0-9.+_-]+\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
        if (!rawMatch) return '';
        const mimeType = (rawMatch[1] || mediaObj.mimeType || '').toLowerCase();
        const base64Data = rawMatch[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = (mediaObj.name || '').toLowerCase();

        // 1. Text formats: plain, csv, markdown, json, xml, code, log, yaml
        if (
            mimeType.startsWith('text/') ||
            mimeType.includes('csv') ||
            mimeType === 'application/json' ||
            mimeType === 'application/xml' ||
            mimeType === 'application/javascript' ||
            filename.endsWith('.txt') ||
            filename.endsWith('.csv') ||
            filename.endsWith('.md') ||
            filename.endsWith('.json') ||
            filename.endsWith('.xml') ||
            filename.endsWith('.log') ||
            filename.endsWith('.yaml') ||
            filename.endsWith('.yml') ||
            filename.endsWith('.sql')
        ) {
            return buffer.toString('utf-8');
        }

        // 2. Word documents (.docx)
        if (filename.endsWith('.docx') || mimeType.includes('wordprocessingml.document')) {
            try {
                const mammoth = require('mammoth');
                const result = await mammoth.extractRawText({ buffer });
                if (result && result.value) {
                    return result.value;
                }
            } catch (err) {
                console.warn('[Tenshi Media] Mammoth extraction error:', err.message);
            }
        }

        // 3. Excel spreadsheets (.xlsx, .xls)
        if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || mimeType.includes('spreadsheetml.sheet')) {
            try {
                const ExcelJS = require('exceljs');
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);
                let excelText = '';
                workbook.eachSheet((worksheet) => {
                    excelText += `\n--- Hoja: ${worksheet.name} ---\n`;
                    worksheet.eachRow((row, rowNumber) => {
                        const rowVals = Array.isArray(row.values) ? row.values.slice(1).join(' | ') : '';
                        if (rowVals.trim()) {
                            excelText += `Fila ${rowNumber}: ${rowVals}\n`;
                        }
                    });
                });
                if (excelText.trim()) {
                    return excelText;
                }
            } catch (err) {
                console.warn('[Tenshi Media] ExcelJS extraction error:', err.message);
            }
        }

        // 4. PDF documents (.pdf) text fallback
        if (filename.endsWith('.pdf') || mimeType === 'application/pdf') {
            try {
                const pdfParse = require('pdf-parse');
                const pdfData = await pdfParse(buffer);
                if (pdfData && pdfData.text) {
                    return pdfData.text;
                }
            } catch (err) {
                console.warn('[Tenshi Media] PDF parse text fallback error:', err.message);
            }
        }
    } catch (e) {
        console.error('[Tenshi Media] Error extracting text from media:', e);
    }
    return '';
}

router.get('/history', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const userIds = [req.user.id, targetUserId].filter(Boolean);
        const history = await TenshiMessage.find({ user: { $in: userIds } }).sort({ createdAt: 1 }).lean();
        res.json(history.map(m => ({
            _id: m._id,
            role: m.role,
            content: m.content,
            image: m.image,
            media: m.media,
            htmlReport: m.htmlReport,
            file: m.file,
            qrCode: m.qrCode,
            widget: m.widget,
            createdAt: m.createdAt,
        })));
    } catch (error) {
        console.error('Error fetching Tenshi history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/message', requireJwtAuth, async (req, res) => {
    try {
        const { role = 'assistant', content, htmlReport, file, qrCode, widget, image, media } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const newMsg = await TenshiMessage.create({
            user: req.user.id,
            role,
            content: content.trim(),
            image,
            media,
            htmlReport,
            file,
            qrCode,
            widget,
        });
        res.json(newMsg);
    } catch (error) {
        console.error('Error creating Tenshi message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// =========================================================================
// GOBERNANZA HUMAN-IN-THE-LOOP (HITL) & MEMORIA PROCEDURAL (OPENBOT ENGINE)
// =========================================================================

router.get('/governance/pending', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const userIds = [req.user.id, targetUserId].filter(Boolean);
        const pending = await TenshiPendingAction.find({
            user: { $in: userIds },
            status: 'pendiente_aprobacion',
        }).sort({ createdAt: -1 }).limit(20).lean();
        res.json(pending);
    } catch (error) {
        logger.error('[Tenshi Governance] Error fetching pending actions:', error);
        res.status(500).json({ error: 'Error consultando acciones pendientes' });
    }
});

router.post('/governance/:id/approve', requireJwtAuth, async (req, res) => {
    try {
        const actionId = req.params.id;
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const userIds = [req.user.id, targetUserId].filter(Boolean);

        const pendingAction = await TenshiPendingAction.findOne({
            _id: actionId,
            user: { $in: userIds },
        });

        if (!pendingAction) {
            return res.status(404).json({ error: 'Solicitud de aprobación no encontrada.' });
        }

        if (pendingAction.status !== 'pendiente_aprobacion') {
            return res.json({
                success: true,
                alreadyProcessed: true,
                status: pendingAction.status,
                action: pendingAction,
            });
        }

        const customArgs = req.body?.args ? { ...pendingAction.args, ...req.body.args } : { ...pendingAction.args };
        const execResult = await executeTenshiMcpTool(
            pendingAction.toolName,
            { ...customArgs, _hitlApproved: true },
            targetUserId
        );

        pendingAction.status = execResult?.error ? 'error' : 'aprobada';
        pendingAction.decidedAt = new Date();
        pendingAction.decidedBy = req.user.name || req.user.username || 'Responsable SST';
        pendingAction.executionResult = execResult;
        if (execResult?.error) {
            pendingAction.errorMessage = String(execResult.error);
        }
        await pendingAction.save();

        // Actualizar el estado del widget dentro de TenshiMessage para persistencia en recargas
        await TenshiMessage.updateMany(
            { 'widget.actionId': String(actionId) },
            {
                $set: {
                    'widget.status': pendingAction.status,
                    'widget.data.status': pendingAction.status,
                    'widget.data.decidedBy': pendingAction.decidedBy,
                    'widget.data.decidedAt': pendingAction.decidedAt,
                    'widget.data.executionResult': execResult,
                },
            }
        ).catch(() => {});

        res.json({
            success: !execResult?.error,
            status: pendingAction.status,
            action: pendingAction,
            result: execResult,
        });
    } catch (error) {
        logger.error('[Tenshi Governance] Error approving action:', error);
        res.status(500).json({ error: error.message || 'Error ejecutando la acción autorizada' });
    }
});

router.post('/governance/:id/reject', requireJwtAuth, async (req, res) => {
    try {
        const actionId = req.params.id;
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const userIds = [req.user.id, targetUserId].filter(Boolean);

        const pendingAction = await TenshiPendingAction.findOne({
            _id: actionId,
            user: { $in: userIds },
        });

        if (!pendingAction) {
            return res.status(404).json({ error: 'Solicitud no encontrada.' });
        }

        pendingAction.status = 'rechazada';
        pendingAction.decidedAt = new Date();
        pendingAction.decidedBy = req.user.name || req.user.username || 'Responsable SST';
        await pendingAction.save();

        await TenshiMessage.updateMany(
            { 'widget.actionId': String(actionId) },
            {
                $set: {
                    'widget.status': 'rechazada',
                    'widget.data.status': 'rechazada',
                    'widget.data.decidedBy': pendingAction.decidedBy,
                    'widget.data.decidedAt': pendingAction.decidedAt,
                },
            }
        ).catch(() => {});

        res.json({
            success: true,
            status: 'rechazada',
            action: pendingAction,
        });
    } catch (error) {
        logger.error('[Tenshi Governance] Error rejecting action:', error);
        res.status(500).json({ error: error.message || 'Error rechazando la acción' });
    }
});

router.get('/procedural-memory', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const includeInactive = req.query.includeInactive === 'true' || req.query.all === 'true';
        const filter = includeInactive ? { user: targetUserId } : { user: targetUserId, isActive: true };
        const habits = await TenshiProceduralMemory.find(filter)
            .sort({ updatedAt: -1 })
            .limit(50)
            .lean();
        res.json(habits.map((h) => ({
            id: String(h._id),
            _id: String(h._id),
            category: h.category,
            trigger: h.trigger,
            rule: h.rule,
            isActive: h.isActive !== false,
            usageCount: h.usageCount || 0,
            companyName: h.companyName || '',
            updatedAt: h.updatedAt,
            createdAt: h.createdAt,
        })));
    } catch (error) {
        logger.error('[Tenshi Procedural Memory] Error listing habits:', error);
        res.status(500).json({ error: 'Error consultando memoria procedimental' });
    }
});

router.post('/procedural-memory', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const { trigger, rule, category = 'habito_operativo', companyId, companyName } = req.body;
        if (!trigger || !rule) {
            return res.status(400).json({ error: 'Se requiere trigger y rule.' });
        }
        const out = await manageProceduralMemory(
            { accion: 'guardar', trigger, regla: rule, categoria: category },
            targetUserId,
            companyId,
            companyName
        );
        if (out.widget?.data?.items) {
            await TenshiMessage.updateMany(
                { user: { $in: [req.user.id, targetUserId].filter(Boolean) }, 'widget.widgetType': 'procedural_memory' },
                { $set: { 'widget.data.items': out.widget.data.items, 'widget.data.habits': out.widget.data.items } }
            ).catch(() => {});
        }
        res.json({ ...out.result, widget: out.widget });
    } catch (error) {
        logger.error('[Tenshi Procedural Memory] Error creating habit:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/procedural-memory/:id', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const { trigger, rule, category, isActive } = req.body;
        const updateDoc = {};
        if (typeof trigger === 'string' && trigger.trim()) updateDoc.trigger = trigger.trim();
        if (typeof rule === 'string' && rule.trim()) updateDoc.rule = rule.trim();
        if (typeof category === 'string' && category.trim()) updateDoc.category = category.trim();
        if (typeof isActive === 'boolean') updateDoc.isActive = isActive;

        const updated = await TenshiProceduralMemory.findOneAndUpdate(
            { _id: req.params.id, user: targetUserId },
            { $set: updateDoc },
            { new: true }
        ).lean();

        if (!updated) {
            return res.status(404).json({ error: 'Regla no encontrada.' });
        }

        const activeHabits = await TenshiProceduralMemory.find({ user: targetUserId, isActive: true })
            .sort({ updatedAt: -1 })
            .limit(30)
            .lean();
        const mappedActive = activeHabits.map((h) => ({
            id: String(h._id),
            _id: String(h._id),
            category: h.category,
            trigger: h.trigger,
            rule: h.rule,
            isActive: h.isActive,
        }));
        await TenshiMessage.updateMany(
            { user: { $in: [req.user.id, targetUserId].filter(Boolean) }, 'widget.widgetType': 'procedural_memory' },
            { $set: { 'widget.data.items': mappedActive, 'widget.data.habits': mappedActive } }
        ).catch(() => {});

        res.json({
            success: true,
            item: {
                id: String(updated._id),
                _id: String(updated._id),
                category: updated.category,
                trigger: updated.trigger,
                rule: updated.rule,
                isActive: updated.isActive !== false,
                usageCount: updated.usageCount || 0,
                updatedAt: updated.updatedAt,
            },
            items: mappedActive,
        });
    } catch (error) {
        logger.error('[Tenshi Procedural Memory] Error updating habit:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/procedural-memory/:id', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        const deleted = await TenshiProceduralMemory.findOneAndDelete({
            _id: req.params.id,
            user: targetUserId,
        });
        const remaining = await TenshiProceduralMemory.find({ user: targetUserId, isActive: true })
            .sort({ updatedAt: -1 })
            .limit(30)
            .lean();
        const mappedRemaining = remaining.map((h) => ({
            id: String(h._id),
            _id: String(h._id),
            category: h.category,
            trigger: h.trigger,
            rule: h.rule,
            isActive: h.isActive,
        }));
        await TenshiMessage.updateMany(
            { user: { $in: [req.user.id, targetUserId].filter(Boolean) }, 'widget.widgetType': 'procedural_memory' },
            { $set: { 'widget.data.items': mappedRemaining, 'widget.data.habits': mappedRemaining } }
        ).catch(() => {});
        res.json({ success: Boolean(deleted), deleted, items: mappedRemaining });
    } catch (error) {
        logger.error('[Tenshi Procedural Memory] Error deleting habit:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Helper unificado para guardar riesgos evaluados en:
 * 1) La Matriz IPEVR Comunitaria del Hito 1 (ParticipacionIpevarData.participacionesList)
 * 2) La Matriz IPEVR Oficial GTC-45 del Hito 1 (GTC45WorkspaceSession isOfficial: true)
 */
async function saveRisksToHito1Matrices(userId, companyInfo, rawRiesgos = []) {
    const GTC45WorkspaceSession = mongoose.models.GTC45WorkspaceSession || require('../../models/GTC45WorkspaceSession');
    let ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData;
    if (!ParticipacionIpevarData) {
        try {
            require('./sgsst/participacionIpevar');
            ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData;
        } catch (_) {}
    }

    const companyId = companyInfo?._id || null;
    const officialConvoId = `official-${companyId || userId}`;

    // Buscar todas las sesiones oficiales activas de esta empresa para mantenerlas 100% sincronizadas
    let officialSessions = await GTC45WorkspaceSession.find(
        companyId
            ? { $or: [{ user: userId, companyId, isOfficial: true }, { conversationId: officialConvoId }] }
            : { $or: [{ user: userId, isOfficial: true }, { conversationId: officialConvoId }] }
    );

    if (!officialSessions || officialSessions.length === 0) {
        const created = new GTC45WorkspaceSession({
            conversationId: officialConvoId,
            user: userId,
            companyId: companyId || undefined,
            isOfficial: true,
            officialTitle: 'Matriz IPEVR SG-SST',
            matrixRows: [],
        });
        officialSessions = [created];
    }

    let partDoc = null;
    if (ParticipacionIpevarData) {
        partDoc = await ParticipacionIpevarData.findOne({ user: userId, companyId });
        if (!partDoc) {
            partDoc = new ParticipacionIpevarData({
                user: userId,
                companyId,
                participacionesList: [],
                inboxPublico: [],
            });
        }
    }

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    let insertedCount = 0;

    for (const r of rawRiesgos) {
        const nd = Number(r.nd) >= 0 ? Number(r.nd) : 6;
        const ne = Number(r.ne) >= 1 ? Number(r.ne) : 3;
        const np = nd * ne;
        const nc = Number(r.nc) >= 10 ? Number(r.nc) : 25;
        const nr = np * nc;

        const interpretacion_np = np >= 24 ? 'Muy Alto (MA)' : np >= 10 ? 'Alto (A)' : np >= 6 ? 'Medio (M)' : 'Bajo (B)';
        const interpretacion_nr = nr >= 600 ? 'I' : nr >= 150 ? 'II' : nr >= 40 ? 'III' : 'IV';
        const aceptabilidad =
            interpretacion_nr === 'I'
                ? 'No Aceptable'
                : interpretacion_nr === 'II'
                ? 'No Aceptable o Aceptable con control específico'
                : interpretacion_nr === 'III'
                ? 'Mejorable'
                : 'Aceptable';
        const severidadPercibida = nr >= 600 ? 'Crítica' : nr >= 150 ? 'Alta' : nr >= 40 ? 'Media' : 'Baja';

        const rowId = r.id || `gtc45_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const peligroDesc = String(r.peligro_descripcion || r.peligro || 'Peligro identificado').trim();
        const procesoVal = String(r.proceso || r.cargo || 'Operaciones Generales').trim();
        const cargoVal = String(r.cargo || r.proceso || 'Personal Operativo').trim();
        const zonaVal = String(r.zona || 'Instalaciones Principales').trim();
        const actividadVal = String(r.actividad || r.tareas || procesoVal || 'Labor operativa').trim();
        const clasificacionVal = String(
            r.peligro_clasificacion ||
                (/soldadura|humo|qu[ií]mico|gas|vapor/i.test(peligroDesc)
                    ? 'Físico / Químico'
                    : /postura|carga|ergon|repetitiv/i.test(peligroDesc)
                    ? 'Biomecánico'
                    : /ruido|iluminaci|vibraci|radiaci|temperat/i.test(peligroDesc)
                    ? 'Físico'
                    : 'Condiciones de Seguridad')
        ).trim();

        const newRow = {
            id: rowId,
            proceso: procesoVal,
            zona: zonaVal,
            actividad: actividadVal,
            tareas: r.tareas || actividadVal,
            rutinaria: r.rutinaria || 'Sí',
            cargo: cargoVal,
            peligro_descripcion: peligroDesc,
            peligro_clasificacion: clasificacionVal,
            efectos_posibles: r.efectos_posibles || 'Afecciones ocupacionales, fatiga o lesiones asociadas a la exposición',
            controles_fuente: r.controles_fuente || 'Mantenimiento preventivo e inspección de equipos',
            controles_medio: r.controles_medio || 'Señalización, ventilación y demarcación del área',
            controles_individuo: r.controles_individuo || 'Capacitación en estándares seguros y uso de EPP certificado',
            nd,
            ne,
            np,
            interpretacion_np,
            nc,
            nr,
            interpretacion_nr,
            aceptabilidad,
            peor_consecuencia: r.peor_consecuencia || 'Accidente de trabajo o enfermedad laboral',
            requisito_legal: r.requisito_legal || 'Decreto 1072 de 2015 / GTC-45',
            nro_expuestos: Number(r.nro_expuestos) || 1,
            medida_eliminacion: r.medida_eliminacion || 'N/A',
            medida_sustitucion: r.medida_sustitucion || 'N/A',
            medida_ingenieria: r.medida_ingenieria || 'Control técnico en fuente y ventilación/extracción',
            medida_administrativa: r.medida_administrativa || 'Procedimiento de trabajo seguro, inspecciones y pausas activas',
            medida_eppu: r.medida_eppu || 'Dotación y uso obligatorio de EPP certificado según matriz',
            factores_reduccion:
                r.factores_reduccion ||
                'Técnicamente viable y altamente costo-efectiva según Anexo E de la GTC-45. La implementación de controles en fuente/medio reduce el nivel de deficiencia y la probabilidad del riesgo.',
            origen_reporte: `Registrado desde Simulador GTC-45 de Tenshi IA (ND=${nd}, NE=${ne}, NC=${nc} → NR=${nr} Nivel ${interpretacion_nr}).`,
            creadoPor: 'Tenshi IA • Simulador GTC-45',
            fechaRegistro: nowIso,
        };

        for (const sess of officialSessions) {
            if (!Array.isArray(sess.matrixRows)) sess.matrixRows = [];
            const existsIdx = sess.matrixRows.findIndex(
                (existing) =>
                    String(existing.peligro_descripcion || '').toLowerCase() === peligroDesc.toLowerCase() &&
                    String(existing.proceso || '').toLowerCase() === procesoVal.toLowerCase()
            );
            if (existsIdx >= 0) {
                sess.matrixRows[existsIdx] = { ...sess.matrixRows[existsIdx], ...newRow, id: sess.matrixRows[existsIdx].id || rowId };
            } else {
                sess.matrixRows.push(newRow);
            }
            sess.markModified('matrixRows');
        }

        if (partDoc) {
            if (!Array.isArray(partDoc.participacionesList)) partDoc.participacionesList = [];
            const partId = `part-tenshi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const newPartEntry = {
                id: partId,
                title: `${procesoVal} - ${peligroDesc.substring(0, 45)}`,
                updatedAt: nowIso,
                status: 'applied_to_matrix',
                matrixAction: 'create_new',
                matrixRowId: rowId,
                appliedAt: new Date(),
                formData: {
                    fecha: todayStr,
                    area: procesoVal,
                    proceso: procesoVal,
                    zona: zonaVal,
                    actividad: actividadVal,
                    tarea: r.tareas || actividadVal,
                    rutinaria: 'Sí',
                    peligroClasificacion: clasificacionVal,
                    peligros: peligroDesc,
                    efectosPosibles: newRow.efectos_posibles,
                    severidadPercibida,
                    controlesExistentes: newRow.controles_individuo,
                    suficientes: nr < 150,
                    sugeridoEliminacion: newRow.medida_eliminacion,
                    sugeridoIngenieria: newRow.medida_ingenieria,
                    sugeridoAdministrativo: newRow.medida_administrativa,
                    sugeridoEPP: newRow.medida_eppu,
                    actividadGlobal: actividadVal,
                },
                images: { foto1: null, foto2: null, foto3: null },
                video: null,
                trabajadoresList: [{ nombre: 'Simulador GTC-45 (Tenshi IA)', cedula: 'SG-SST', cargo: cargoVal }],
                responsablesList: [{ nombre: companyInfo?.responsibleSST || 'Responsable SG-SST', cedula: '', rol: 'Responsable SST' }],
            };

            const existsPartIdx = partDoc.participacionesList.findIndex(
                (p) =>
                    String(p?.formData?.peligros || '').toLowerCase() === peligroDesc.toLowerCase() &&
                    String(p?.formData?.proceso || '').toLowerCase() === procesoVal.toLowerCase()
            );
            if (existsPartIdx >= 0) {
                partDoc.participacionesList[existsPartIdx] = {
                    ...partDoc.participacionesList[existsPartIdx],
                    ...newPartEntry,
                    id: partDoc.participacionesList[existsPartIdx].id || partId,
                };
            } else {
                partDoc.participacionesList.unshift(newPartEntry);
            }
            partDoc.markModified('participacionesList');
        }

        insertedCount++;
    }

    for (const sess of officialSessions) {
        await sess.save();
    }
    if (partDoc) {
        partDoc.updatedAt = new Date();
        await partDoc.save();
    }

    return {
        exito: true,
        insertedCount,
        totalRiesgosEnMatriz: officialSessions[0]?.matrixRows?.length || 0,
        totalParticipacionesComunitarias: partDoc?.participacionesList?.length || 0,
        mensaje: `Se guardaron ${insertedCount} peligro(s) exitosamente en la Matriz IPEVR Comunitaria y en la Matriz Oficial GTC-45 del Hito 1.`,
    };
}

router.post('/gtc45/save-to-hito1', requireJwtAuth, async (req, res) => {
    try {
        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        let companyInfo = await CompanyInfo.findOne({ user: targetUserId, isActive: true }).lean();
        if (!companyInfo) {
            companyInfo = await CompanyInfo.findOne({ user: targetUserId }).lean();
        }
        const payload = req.body || {};
        const riesgos = Array.isArray(payload.riesgos)
            ? payload.riesgos
            : [
                  {
                      peligro_descripcion: payload.peligro || payload.peligro_descripcion || 'Peligro evaluado',
                      proceso: payload.proceso || 'Operaciones Generales',
                      cargo: payload.cargo || payload.proceso || 'Operativo',
                      zona: payload.zona || 'Taller / Instalaciones',
                      nd: payload.nd,
                      ne: payload.ne,
                      nc: payload.nc,
                  },
              ];
        const result = await saveRisksToHito1Matrices(targetUserId, companyInfo, riesgos);
        res.json({ success: true, ...result });
    } catch (error) {
        logger.error('[Tenshi GTC45 Save Hito 1] Error:', error);
        res.status(500).json({ error: error.message || 'Error guardando en la Matriz IPEVR del Hito 1' });
    }
});

router.delete('/history', requireJwtAuth, async (req, res) => {
    try {
        await TenshiMessage.deleteMany({ user: req.user.id });
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing Tenshi history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/message/:id', requireJwtAuth, async (req, res) => {
    try {
        const msgId = req.params.id;
        const { content } = req.body;
        const targetMsg = await TenshiMessage.findOne({ _id: msgId, user: req.user.id });
        if (!targetMsg) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Update content
        targetMsg.content = content;
        await targetMsg.save();

        // Delete all subsequent messages
        await TenshiMessage.deleteMany({
            user: req.user.id,
            createdAt: { $gt: targetMsg.createdAt }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating Tenshi message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/message/:id', requireJwtAuth, async (req, res) => {
    try {
        const msgId = req.params.id;
        const targetMsg = await TenshiMessage.findOne({ _id: msgId, user: req.user.id });
        if (!targetMsg) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Delete this message and all subsequent ones
        await TenshiMessage.deleteMany({
            user: req.user.id,
            createdAt: { $gte: targetMsg.createdAt }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting Tenshi message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// A simple chat endpoint for Tenshi
router.post('/chat', requireJwtAuth, async (req, res) => {
    try {
        const { messages, browserState } = req.body;
        logger.info(`[Tenshi Backend] /chat request received. Messages count: ${messages?.length}, browserState length: ${browserState?.length || 0}`);
        const config = await TenshiConfig.findOne().lean();

        if (!config || !config.isActive) {
            return res.status(403).json({ error: 'Tenshi is not active.' });
        }

        let capturedHtmlReport = null;
        let capturedQrCode = null;
        let capturedFile = null;
        let capturedWidget = null;
        let capturedDelegatedOrder = null;
        let requestedGuiAction = null;
        let requestedGuiActions = null;

        const lastUserMsgPayload = messages[messages.length - 1];
        const userQuery = lastUserMsgPayload?.content || '';
        const userImage = lastUserMsgPayload?.image || (lastUserMsgPayload?.media?.type === 'image' ? lastUserMsgPayload.media.dataUrl : undefined);
        const userMedia = lastUserMsgPayload?.media || (lastUserMsgPayload?.image ? {
            name: 'imagen_adjunta.jpg',
            type: 'image',
            mimeType: 'image/jpeg',
            dataUrl: lastUserMsgPayload.image,
            size: 0,
        } : undefined);

        const userMediaForDb = userMedia ? { ...userMedia } : undefined;
        // Si el dataUrl excede 4MB, no almacenarlo en base de datos para no saturar MongoDB BSON (límite 16MB)
        if (userMediaForDb && userMediaForDb.dataUrl && userMediaForDb.dataUrl.length > 4 * 1024 * 1024) {
            userMediaForDb.dataUrl = undefined;
        }
        let userImageForDb = userImage;
        if (userImageForDb && userImageForDb.length > 4 * 1024 * 1024) {
            userImageForDb = undefined;
        }

        if (userQuery && !userQuery.startsWith('[RESULTADO_GUI]')) {
            TenshiMessage.create({
                user: req.user.id,
                role: 'user',
                content: userQuery,
                image: userImageForDb,
                media: userMediaForDb,
            }).catch(e => console.error('Error saving user TenshiMessage:', e));
        }

        const targetUserId = (req.user?.isSubUser && req.user?.parentUser) ? String(req.user.parentUser) : String(req.user?.id || req.user?._id);
        if (!req.body.conversationId) {
            req.body.conversationId = `tenshi-${targetUserId}`;
        }

        // Fetch dynamic knowledge concurrently via Promise.all for maximum response speed
        const [latestBlogs, latestCourses, ticketContext, companyInfo, rawMemories, recentTenshiReports] = await Promise.all([
            BlogPost.find({ isPublished: true }).sort({ createdAt: -1 }).limit(3).lean().catch(() => []),
            Course.find({ isPublished: true }).sort({ createdAt: -1 }).limit(2).lean().catch(() => []),
            getRelevantTickets(req, userQuery).catch(() => ''),
            (async () => {
                let info = null;
                if (req.user?.isSubUser && req.user?.assignedCompany) {
                    info = await CompanyInfo.findOne({ _id: req.user.assignedCompany, user: targetUserId }).lean().catch(() => null);
                }
                if (!info) {
                    info = await CompanyInfo.findOne({ user: targetUserId, isActive: true }).lean().catch(() => null);
                }
                if (!info) {
                    info = await CompanyInfo.findOne({ user: targetUserId }).lean().catch(() => null);
                }
                return info;
            })(),
            getAllUserMemories(targetUserId).catch(() => []),
            (async () => {
                try {
                    const userFilter = [String(req.user.id), targetUserId].filter(Boolean);
                    const reports = await TenshiMessage.find({
                        user: { $in: userFilter },
                        $or: [
                            { htmlReport: { $exists: true, $nin: [null, ''] } },
                            { 'file.content': { $exists: true, $nin: [null, ''] } }
                        ]
                    })
                        .sort({ createdAt: -1 })
                        .limit(4)
                        .lean();
                    return reports || [];
                } catch (e) {
                    return [];
                }
            })()
        ]);

        const blogStr = latestBlogs.map(b => `- BLOG: ${b.title}`).join('\n');
        const courseStr = latestCourses.map(c => `- CURSO: ${c.title}`).join('\n');
        const manualContent = getPlatformManual();

        const isMemoryEnabled = req.user?.personalization?.memories !== false;

        let fullCompanyAndMemoryBlock = '';
        if (isMemoryEnabled) {
            if (companyInfo) {
                let liveWorkerCount = null;
                try {
                    const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData || require('./sgsst/perfilSociodemografico');
                    const socioDoc = await PerfilSocioModel.findOne({
                        user: targetUserId,
                        ...(companyInfo._id ? { companyId: companyInfo._id } : {})
                    }).lean() || await PerfilSocioModel.findOne({ user: targetUserId }).lean();

                    if (socioDoc && Array.isArray(socioDoc.trabajadores)) {
                        const activeWorkers = socioDoc.trabajadores.filter(w => {
                            const estado = (w.estadoLaboral || w.estado || '').toLowerCase().trim();
                            return estado !== 'retirado' && estado !== 'inactivo';
                        });
                        liveWorkerCount = activeWorkers.length;
                    }
                } catch (e) {
                    try {
                        const SgsstWorker = mongoose.models.SgsstWorker || require('~/models/SgsstWorker');
                        const count = await SgsstWorker.countDocuments({
                            user: targetUserId,
                            ...(companyInfo._id ? { companyId: companyInfo._id } : {}),
                            estadoLaboral: { $ne: 'Retirado' }
                        });
                        if (count > 0) liveWorkerCount = count;
                    } catch (_) {}
                }

                const finalWorkerCount = liveWorkerCount !== null ? liveWorkerCount : (companyInfo.workerCount ?? 'N/A');

                if (liveWorkerCount !== null && companyInfo.workerCount !== liveWorkerCount) {
                    const CompanyInfoModel = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
                    CompanyInfoModel.updateOne({ _id: companyInfo._id }, { $set: { workerCount: liveWorkerCount } }).catch(() => {});
                    companyInfo.workerCount = liveWorkerCount;
                }

                const companyType = companyInfo.companyType || 'Persona Jurídica';
                const nitLabel = companyType === 'Persona Natural' ? 'Cédula de Ciudadanía' : 'NIT';
                let sedesStr = '';
                if (companyInfo.sedes && Array.isArray(companyInfo.sedes) && companyInfo.sedes.length > 0) {
                    sedesStr = '\n  * Sedes Adicionales:\n' + companyInfo.sedes.map(s => `    - Sede: ${s.nombre || 'N/A'} (Ciudad: ${s.city || 'N/A'}, Depto: ${s.departamento || 'N/A'}, Dirección: ${s.address || 'N/A'}, Actividades: ${s.generalActivities || 'N/A'})`).join('\n');
                }
                fullCompanyAndMemoryBlock += `### 🏢 [MEMORIA ESTRUCTURADA DUAL — BLOQUE 1: EMPRESA ACTIVA (HECHOS FIJOS SG-SST)]:\n` +
                    `- Razón Social / Nombre: ${companyInfo.companyName || 'N/A'}\n` +
                    `- Tipo de Empresa: ${companyType}\n` +
                    `- ${nitLabel}: ${companyInfo.nit || 'N/A'}\n` +
                    `- Representante Legal: ${companyInfo.legalRepresentative || 'N/A'}` + (companyInfo.legalRepresentativeId ? ` (Cédula: ${companyInfo.legalRepresentativeId})` : '') + `\n` +
                    `- Número de Trabajadores: ${finalWorkerCount} activos en Huella Biocéntrica / Nómina\n` +
                    `- ARL: ${companyInfo.arl || 'N/A'} (Nivel de Riesgo ARL: ${companyInfo.riskLevel || 'N/A'})\n` +
                    `- Actividad Económica: ${companyInfo.economicActivity || 'N/A'}\n` +
                    `- Código CIIU: ${companyInfo.ciiu || 'N/A'}\n` +
                    `- Sector: ${companyInfo.sector || 'N/A'}\n` +
                    `- Ubicación Sede Principal: ${companyInfo.address || 'N/A'} (Ciudad: ${companyInfo.city || 'N/A'}, Departamento: ${companyInfo.departamento || 'N/A'})\n` +
                    `- Responsable SG-SST: ${companyInfo.responsibleSST || 'N/A'}` + (companyInfo.licenseNumber ? ` (Licencia SST: ${companyInfo.licenseNumber}, Vigencia: ${companyInfo.licenseExpiry || 'N/A'})` : '') + `\n` +
                    `- Nivel de Formación SST: ${companyInfo.formationLevel || 'N/A'}\n` +
                    `- Estado Curso 50/20H: ${companyInfo.courseStatus || 'N/A'}\n` +
                    `- Descripción General de Actividades: ${companyInfo.generalActivities || 'N/A'}` +
                    (sedesStr ? `${sedesStr}\n\n` : '\n\n');
            } else {
                fullCompanyAndMemoryBlock += `### 🏢 [MEMORIA ESTRUCTURADA DUAL — BLOQUE 1: EMPRESA ACTIVA]:\nNo se ha registrado una empresa en el Gestor SG-SST aún.\n\n`;
            }

            // Deduplicate user memories by key (most recent first)
            const uniqueMemMap = new Map();
            if (Array.isArray(rawMemories)) {
                const sorted = [...rawMemories].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
                for (const m of sorted) {
                    if (m.key && !uniqueMemMap.has(m.key)) {
                        uniqueMemMap.set(m.key, m.value);
                    }
                }
            }

            if (uniqueMemMap.size > 0) {
                fullCompanyAndMemoryBlock += `### 🧠 [MEMORIA ESTRUCTURADA DUAL — BLOQUE 2: PREFERENCIAS DEL USUARIO Y MEMORIA PERMANENTE]:\n`;
                for (const [k, v] of uniqueMemMap.entries()) {
                    fullCompanyAndMemoryBlock += `📌 [${k}]:\n${v}\n\n`;
                }
            }

            const proceduralBlock = await getProceduralMemoryPromptBlock(targetUserId, companyInfo?._id, 12);
            if (proceduralBlock) {
                fullCompanyAndMemoryBlock += `${proceduralBlock}\n`;
            }

            fullCompanyAndMemoryBlock += `### ⚡ REGLA DE ORO DE CONOCIMIENTO CORPORATIVO Y MEMORIA:
- TIENES ACCESO PLENO E INMEDIATO a toda la información de la empresa activa y a la memoria del usuario descritas arriba.
- Conoces de antemano la Razón Social, NIT, Representante Legal, Trabajadores, ARL, Sedes, Macroprocesos y datos de la memoria.
- NUNCA digas "no tengo acceso a la empresa", "no sé qué empresa está activa" ni le pidas al usuario que repita datos que ya están en esta ficha o memoria. Úsalos con total familiaridad y exactitud en todas tus respuestas.`;
        }

        let recentConvosBlock = '';
        if (recentTenshiReports && recentTenshiReports.length > 0) {
            recentConvosBlock = `### 📄 ÚLTIMOS INFORMES Y DOCUMENTOS GENERADOS EN TU PROPIO CHAT DE TENSHI (DEL MÁS RECIENTE AL MÁS ANTIGUO):\n`;
            recentTenshiReports.forEach((r, idx) => {
                const title = r.file?.title || 'Informe Oficial SG-SST';
                const rawHtml = r.file?.content || r.htmlReport || '';
                const cleanSnippet = rawHtml
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 1800);
                const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Reciente';
                recentConvosBlock += `\n${idx === 0 ? '🔥 [ÚLTIMO INFORME EN CHAT DE TENSHI]' : `[Informe #${idx + 1}]`} Título: "${title}" (${dateStr})\n  - Mensaje de entrega: "${(r.content || '').substring(0, 300)}"\n  - Contenido/Resumen del informe: ${cleanSnippet}\n`;
            });
            recentConvosBlock += `\n*REGLA DE MEMORIA DE INFORMES PROPIOS*: Estos informes están publicados directamente en TU propio chat de Tenshi. Si el usuario te dice "revisa nuestro chat", "el último informe que hiciste", "envíame el último informe del chat a mi correo" o te pregunta por el informe en vuestro chat, se refiere SIEMPRE al 🔥 [ÚLTIMO INFORME EN CHAT DE TENSHI] listado arriba. NUNCA inventes que no tienes informes ni menciones chats viejos de otros agentes.\n\n`;
        }

        const rawSkillsList = (config.skills && config.skills.length > 0) ? config.skills : ['*'];
        const skillsList = rawSkillsList.filter(s => s !== 'wappy-cards');
        const rawSkillData = getActiveSkillsData(userQuery, skillsList);
        const skillInstructions = (rawSkillData.instructions || '').replace(/```wappy-card[\s\S]*?```/gi, '');
        const activeTools = rawSkillData.activeTools || [];
        const activeSkillNames = (rawSkillData.activeSkillNames || []).filter(s => s !== 'wappy-cards');
        logger.info(`[Tenshi Skill Router] Skills activadas por trigger: ${activeSkillNames.join(', ') || 'ninguna'}, herramientas dinámicas: ${activeTools.join(', ') || 'ninguna'}`);

        const nowColombiaStr = new Date().toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        let systemMessage = `${config.systemPrompt}

MANUAL DE FUNCIONAMIENTO DE WAPPY IA:
${manualContent}

${fullCompanyAndMemoryBlock}

Hola, estás conversando con el usuario: ${req.user.name || req.user.username || 'Usuario'}

### 🕒 ZONA HORARIA Y FECHA ACTUAL EN VIVO (COLOMBIA):
- País y Zona Horaria Oficial: Colombia (America/Bogota, UTC-5).
- Fecha y Hora Actual en Colombia: ${nowColombiaStr}.
- REGLA ESTRICTA DE AGENDAMIENTO: Toda hora o fecha que el usuario mencione ("hoy", "mañana", "a las 3pm", "a las 8am", etc.) debe interpretarse e ingresarse SIEMPRE en HORA COLOMBIA (America/Bogota, UTC-5). NUNCA uses UTC ni horarios extranjeros. Al enviar fechas a herramientas como 'google_calendar' o 'wappy_gestionar_agenda', envía la fecha y hora con el offset '-05:00' (ejemplo: '2026-10-16T15:00:00-05:00').

${blogStr ? `ÚLTIMAS PUBLICACIONES DEL BLOG:\n${blogStr}\n` : ''}
${courseStr ? `CURSOS DE FORMACIÓN DISPONIBLES:\n${courseStr}\n` : ''}
${ticketContext ? `CONOCIMIENTO DINÁMICO (Contexto extraído por RAG):\n${ticketContext}\n` : ''}
${recentConvosBlock}

### 🎯 ROL Y PERSONALIDAD DE TENSHI
Eres Tenshi, la IA estrella, guía oficial y orquestadora de WAPPY IA. Administras la plataforma central Somos SST (ubicada en /sgsst). Tu personalidad es alegre, carismática, empática, muy espontánea y respetuosa, utilizando modismos paisas colombianos naturales ("parce", "listo", "qué más pues", "bacano", "de una", "hágale").

### ⚡ DIRECTIVAS CRÍTICAS DE VELOCIDAD, ORQUESTACIÓN Y HERRAMIENTAS:
1. **RESPUESTAS INMEDIATAS A PREGUNTAS TEÓRICAS/CONCEPTUALES**: Si el usuario te hace preguntas conceptuales, definiciones teóricas (ej: "¿qué es SST?", "¿qué es un ATS?", "¿cuáles son las obligaciones del empleador?"), saludos o preguntas generales, RESPONDE DIRECTAMENTE EN TEXTO en 1 solo turno de forma concisa y alegre. ¡ESTÁ PROHIBIDO invocar herramientas como 'somos_sst' o 'resumen_empresa' para responder preguntas teóricas!
2. **DIFERENCIACIÓN ESTRICTA DE LOS 3 MODOS DE INTERACCIÓN CON ESPECIALISTAS (REGLA DE ORO)**:
   - **MODO 1 — RESPUESTA DIRECTA DE TENSHI (POR DEFECTO EN EL 90% DE LOS CASOS)**:
     * Si el usuario te hace una consulta técnica, médica, jurídica, ergonómica, química o de SST (ej: "tengo un trabajador con dolor lumbar", "cómo califico este accidente", "qué hago ante un despido con incapacidad") y **NO** te pide explícitamente llamar al especialista ni abrir un chat:
     * **RESPONDE TÚ MISMA DIRECTAMENTE** en 1 sola llamada usando tus competencias integradas de Médico Laboral, Abogado Laboral, Ingeniero SST, etc.
     * **ESTÁ TERMINANTEMENTE PROHIBIDO** despertar subagentes ('consultar_agente_especializado') o abrir chats ('wappy_abrir_chat_agente') por iniciativa propia cuando el usuario no lo pidió literalmente.
   - **MODO 2 — DICTAMEN DE SUBAGENTE EFÍMERO EN SEGUNDO PLANO ('consultar_agente_especializado')**:
     * ÚNICAMENTE cuando el usuario pide literalmente el dictamen, concepto u opinión de un especialista **dentro de tu propio chat** sin pedir cambiar de ventana (ej: "Quiero el dictamen formal del Abogado Laboral", "Pregúntale al Médico Laboral qué opina", "Dame el concepto del Psicólogo SST"):
     * Invoca **'consultar_agente_especializado'**. El subagente especialista analizará el caso en segundo plano y tú le entregarás su dictamen consolidado aquí mismo en el chat de Tenshi, **SIN abrir un nuevo chat en pantalla**.
   - **MODO 3 — ABRIR UN CHAT DEDICADO CON EL AGENTE EN PANTALLA ('wappy_abrir_chat_agente')**:
     * ÚNICAMENTE cuando el usuario te pide explícitamente **abrir un chat**, **ir al chat** o **crear una conversación** con el agente especialista en la interfaz principal (ej: "Ábreme un chat con el agente Médico Laboral", "Abre un chat con el Abogado Laboral", "Llévame al chat del Ingeniero Químico"):
     * Invoca **'wappy_abrir_chat_agente'**. Esta herramienta abrirá en la pantalla principal la ventana de chat dedicada con ese especialista y le enviará la consulta estructurada.
   - **ESTUDIO DE PUESTO DE TRABAJO ERGONÓMICO EN VIVO CON LA FISIOTERAPEUTA ('wappy_iniciar_estudio_ergonomico_vivo')**:
     * SIEMPRE que el usuario te diga: "necesito realizar un estudio de puesto de trabajo ergonómico", "quiero hacer un estudio de puesto de trabajo", "hagamos una evaluación ergonómica", "análisis ergonómico en vivo", "llévame al estudio ergonómico con la fisio":
     * INVOCA DE INMEDIATO 'wappy_iniciar_estudio_ergonomico_vivo'.
     * Esta herramienta abrirá automáticamente el Análisis en Vivo por Cámara y Voz con la Fisioterapeuta Laboral (con exoesqueleto 3D MediaPipe, protocolo de 3 fases, matriz CIE-11 y 12 ejercicios de pausas activas), y al finalizar dejará el informe oficial tanto en el chat principal como en tu propio chat de Tenshi listo para ver en pantalla o descargar.
   - **NUEVAS APIS Y HERRAMIENTAS ESPECIALIZADAS DE TENSHI**:
     * 'wappy_buscar_historial_instantaneo': Búsqueda ultrarrápida (< 5ms) en el historial de conversaciones pasadas, actas, cédulas, nombres de trabajadores o informes previos. Úsala cuando el usuario pregunte "¿qué hablamos la vez pasada sobre...?", "busca en el historial...", "¿cuándo hablamos de...?".
     * 'wappy_consultar_quimico_pubchem': Consulta oficial a PubChem (NIH) para CID, pictogramas SGA, palabra de advertencia (Peligro/Atención) y frases de peligro H y consejos P (Decreto 1496 de 2018).
     * 'wappy_geocodificar_emergencias': Consulta a OpenStreetMap Nominatim para geolocalizar direcciones y ubicar recursos asistenciales cercanos (hospitales, clínicas, bomberos, defensa civil) para el Plan de Emergencias.
     * 'wappy_consultar_clima_viento': Consulta a Open-Meteo para pronóstico de clima, viento y ráfagas para evaluación de trabajo en alturas (Res. 4272/2021).
3. **GENERACIÓN Y ENTREGA DE INFORMES EN EL CHAT DE TENSHI ('wappy_crear_informe' y 'canvas_tool')**:
   - Cuando el usuario te pida crear, redactar o entregar un informe técnico, INVOCA 'wappy_crear_informe' o 'canvas_tool' con formato HTML, Word o Excel y contenido técnico formal (citando Decreto 1072 de 2015, Res. 0312 de 2019, hallazgos y plan de mejora).
   - El informe se entrega directamente en el chat de Tenshi con visualizador y botones de descarga.
4. **WIDGETS INTERACTIVOS NATIVOS EN EL CHAT ('wappy_renderizar_widget_interactivo') vs APLICATIVOS EN CANVAS ('canvas_tool')**:
   - ⚠️ **PRIORIDAD ABSOLUTA DE GENERATIVE UI EN EL CHAT ('wappy_renderizar_widget_interactivo')**:
     * Siempre que el usuario pida una "calculadora interactiva GTC-45", "calculadora de riesgo", "simulador GTC-45", "evaluar un peligro con nivel de deficiencia / exposición / consecuencia", o una "lista de chequeo / checklist interactivo" (alturas, extintores, botiquín, preoperacional, orden y aseo), DEBES INVOCAR SIEMPRE 'wappy_renderizar_widget_interactivo' (con tipo_widget: 'risk_calculator' o 'inspection_checklist').
     * ESTÁ TERMINANTEMENTE PROHIBIDO usar 'canvas_tool' para calculadoras GTC-45 o listas de chequeo interactivas, y PROHIBIDO decir "te abrí en el panel de la derecha". El widget nativo de React se proyecta directamente dentro de tu burbuja de chat con sliders interactivos en tiempo real.
   - ⚠️ **PROHIBICIÓN DE DUPLICAR TARJETAS ('wappy-card') Y FÓRMULAS LATEX CRUDAS**:
     * Cuando invoques herramientas que ya proyectan su propio Widget Interactivo Nativo ('wappy_consultar_trabajadores', 'wappy_resumen_general_360', 'wappy_renderizar_widget_interactivo', 'wappy_memoria_procedimental', 'wappy_retirar_trabajador', 'wappy_eliminar_trabajador'), ESTÁ TERMINANTEMENTE PROHIBIDO incluir bloques \`\`\`wappy-card\`\`\` o listas largas en tu respuesta de texto, porque el sistema ya adjunta automáticamente la tarjeta interactiva oficial con buscador debajo de tu mensaje. Escribe únicamente un resumen ejecutivo breve y cálido de 2 a 3 líneas.
     * NUNCA escribas fórmulas matemáticas con signos de dólar LaTeX como \`$6 \\times 3 = 18$\` ni \`\\mathbf{450}\`; escribe siempre texto limpio y legible: \`6 × 3 = 18\` y \`**450**\`.
   - Si el usuario te pide explícitamente: "créame un documento en Word", "hazme un documento en Word", INVOCA 'canvas_tool' con fileType: 'text' redactando el documento formal completo en el lienzo.
   - Si el usuario te pide explícitamente: "créame un aplicativo en el lienzo", "hazme un dashboard de página completa", INVOCA 'canvas_tool' con fileType: 'html'.
   - **REGLAS OBLIGATORIAS DE DISEÑO VISUAL PARA APLICATIVOS HTML (SISTEMA DE DISEÑO WAPPY)**:
     * ESTÁ TERMINANTEMENTE PROHIBIDO crear páginas blancas planas, simplonas o hechas a la carrera. Todos los aplicativos deben tener el mismo estándar visual premium que los agentes especialistas de WAPPY:
     * 1. **Tema Dark Corporativo**: Fondo 'bg-[#0b0f19] text-slate-100', fuentes modernas (Plus Jakarta Sans o Inter), tarjetas 'bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl'.
     * 2. **Banner Superior Oficial WAPPY ('gradient-banner')**: Fondo degradado teal a cyan ('bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-500 rounded-[2rem] p-6 text-white'), logo oficial, título en mayúsculas, subtítulo institucional y badge 'PROCESO: VERIFICAR | V.02'.
     * 3. **Ficha de Metadatos de la Empresa Activa**: Tarjeta con acento de color mostrando Razón Social, NIT, ARL, Número de Trabajadores, Nivel de Riesgo, Código del Registro (ej: 'IND-SST-01') y fecha de vigencia.
     * 4. **Tarjetas de Indicadores/Métricas KPI Luminosas**: Valores grandes 'text-3xl font-black', bordes con acentos de color (teal, ámbar, cyan, púrpura), iconos Lucide y subtítulos técnicos explicativos.
     * 5. **Gráficos Interactivos Chart.js en Dark Mode**: Con paleta neón/SST (teal, cyan, ámbar, esmeralda), gridlines tenues 'rgba(255,255,255,0.05)' y tooltips estilizados.
     * 6. **Botón Flotante 'ASISTENTE IA'**: En la esquina inferior derecha '[🤖 ASISTENTE IA]'.
   - Todo se procesa por detrás y se entrega directamente en el panel y en el chat de Tenshi con botones de descarga y visualización, SIN ABRIR NINGÚN CHAT NUEVO.
5. **CÓDIGOS QR PARA COLABORADORES ('wappy_generar_qr')**:
   - Si el usuario te pide: "deseo hacer un reporte de actos y condiciones inseguras", "mándame el QR de actos", "quiero hacer el termómetro psicosocial", "mándame el QR para el trabajador", "mándame el QR de inspección vehicular", "mándame el QR del colaborador":
   - INVOCA DE INMEDIATO 'wappy_generar_qr' con tipo: 'actos_condiciones', 'termometro_psicosocial' o el módulo correspondiente.
   - El sistema entregará la tarjeta interactiva con la imagen del código QR y su enlace directo en el chat de Tenshi. Confírmale al usuario con entusiasmo que ya se lo dejaste en el chat listo para escanear o compartir por WhatsApp con sus trabajadores.
6. **LECTURA DE ANALÍTICA DE RESULTADOS ('wappy_consultar_analitica_psicosocial' y 'wappy_consultar_analitica_actos_condiciones')**:
   - Cuando el usuario te pida: "lee la analítica de los resultados", "cómo van los resultados del termómetro psicosocial", "cuántos actos y condiciones hay", "qué dicen las estadísticas de seguridad":
   - INVOCA DE INMEDIATO la herramienta de analítica correspondiente.
   - Analiza las métricas reales (porcentajes de satisfacción/estrés, estresores principales, nivel de riesgo global o proporción de actos vs condiciones) y explícale con rigor profesional los resultados y recomendaciones de intervención SST.
7. **ENVÍO DE CORREOS ELECTRÓNICOS ('wappy_enviar_correo')**:
   - Envía correos formales a cualquier destinatario o al correo del usuario ('mi correo') con mensajes, actas o el informe técnico generado, vía Gmail o servidor de WAPPY.
8. **GESTIÓN INTEGRAL DE AGENDAS Y CALENDARIO ('wappy_gestionar_agenda' y 'google_calendar')**:
   - ⚠️ **PRIORIDAD ABSOLUTA DE GOOGLE CALENDAR ANTE PREGUNTAS DE AGENDA**: Siempre que el usuario pregunte: "¿qué tengo en mi agenda?", "¿qué tengo para hoy?", "¿qué tengo mañana?", "¿cuáles son mis reuniones?", "revisa mi agenda", "qué citas tengo", "cómo está mi día":
     * DEBES INVOCAR DE INMEDIATO 'google_calendar' (action: 'list_events' o timeMin con la fecha actual en hora Colombia).
     * PRIORIZA SIEMPRE GOOGLE CALENDAR POR ENCIMA DEL CRONOGRAMA INTERNO O ACTIVIDADES SST para responder por la agenda personal del usuario.
     * Solo si el usuario te pide expresamente "las tareas del cronograma SST" o "actividades pendientes de SST", consultas las tareas del sistema con 'wappy_mcp_sst' o 'somos_sst'.
   - Tienes control total de agendas: agendar eventos, capacitaciones, inspecciones, comités COPASST o citas médicas en Google Calendar y en el cronograma de WAPPY.
   - REPROGRAMACIÓN Y EDICIÓN: Puedes reprogramar o cambiar de fecha y hora cualquier evento existente (ej. "mueve la reunión de las 3pm a las 5pm", "pasa la capacitación para el viernes a las 9am").
   - ELIMINACIÓN Y CANCELACIÓN: Puedes eliminar o cancelar cualquier cita tanto por ID exacto como por el nombre o motivo de la reunión (ej. "cancela la cita de bomberos", "elimina la reunión de extintores"), buscando automáticamente el evento en el calendario sin exigir IDs técnicos al usuario.
   - CONSULTA: Puedes listar la agenda de eventos próximos para el día, la semana o el mes.
8.1. **LECTURA VISUAL DE PANTALLA COMO FALLBACK OBLIGATORIO ('leer_pantalla')**:
   - REGLA DE ORO DE INCERTIDUMBRE: Cuando no sepas algo, cuando una consulta interna no devuelva datos claros, o cuando el usuario te pregunte sobre algo que está viendo en su pantalla ("¿qué ves?", "¿qué dice ahí?", "¿qué es esto?", "¿qué hay en la pantalla?", "explícame lo que hay acá"):
     * ESTÁ TERMINANTEMENTE PROHIBIDO adivinar, inventar o decir que no puedes ver.
     * DEBES INVOCAR DE INMEDIATO 'leer_pantalla'.
     * Lee fielmente el contenido visual del DOM de la página donde se encuentra el usuario y básate en lo que está en pantalla para contestar, explicar o guiar al usuario.
8.2. **CENTRO DE CONTROL - DIFERENCIACIÓN OBLIGATORIA DE LAS 4 ETAPAS DE KANBAN**:
   - Al consultar o explicar las actividades y tareas del Centro de Control / Kanban (/sgsst/control), ESTÁ TOTALMENTE PROHIBIDO agrupar todas las actividades como si fueran una sola lista plana.
   - DEBES DIFERENCIAR SIEMPRE las actividades por cada una de las 4 etapas del tablero:
     1. 'todo' (Por hacer / Pendientes): Actividades planificadas por iniciar.
     2. 'due_soon' (Próximas a vencer): Actividades con fecha límite cercana.
     3. 'overdue' (Vencidas / En alerta roja): Actividades cuyo plazo ya expiró.
     4. 'done' (Completadas / Realizadas): Actividades finalizadas con éxito.
8.3. **TIENDA OFICIAL Y MARKETPLACE DE WAPPY ('wappy_consultar_marketplace')**:
   - Tienes la herramienta 'wappy_consultar_marketplace' para consultar productos, servicios SST, señalización, extintores, consultorías comerciales, software, precios y pedidos de la tienda.
   - Si el usuario te pide ir a la tienda o marketplace, navega con 'wappy_navegar' a modulo: 'marketplace' (ruta: '/marketplace').
   - DIFERENCIACIÓN VITAL: La Tienda / Marketplace es para comprar productos y servicios con precio ($ COP). NUNCA la confundas con la Academia WAPPY LMS.
8.4. **ACADEMIA WAPPY LMS, CURSOS, BLOGS Y CLASES EN VIVO**:
   - Clases en vivo / Sesiones en vivo: navega con 'wappy_navegar' a modulo: 'clases_en_vivo' (ruta: '/academia?tab=meet') o 'events_meet'.
   - Cursos de formación interactivos: 'wappy_consultar_cursos' para listar, 'wappy_abrir_curso' para abrir inmediatamente un curso en pantalla (/training/:id/:slug), y 'wappy_leer_curso' para ver su temario.
   - ⚠️ REGLA DE ACCIÓN DIRECTA: Cuando el usuario te diga "ábreme el curso de...", "ábreme el de...", "abre el curso...", "quiero ver el curso...", NO te limites a hacerle preguntas de relleno; DEBES INVOCAR DE INMEDIATO 'wappy_abrir_curso'.
   - Blog técnico: 'wappy_consultar_blog' para listar, 'wappy_abrir_articulo_blog' para abrir en pantalla (/blog/:id/:slug), y 'wappy_leer_articulo_blog' para leer el texto.
8.45. **CONTROL DE VIDEOLLAMADA Y CÁMARA**:
   - PROHIBICIÓN ESTRICTA: NUNCA actives la cámara ni la videollamada por tu cuenta ni ante refranes, expresiones coloquiales ("lléname esta jeep...") o mención de vehículos u objetos físicos.
   - Solo invoca 'wappy_controlar_videollamada' con accion: 'activar_camara' si el usuario te lo solicita explícitamente ("activa la cámara", "enciende videollamada").
8.5. **EMPRESAS REGISTRADAS Y CONFIGURACIÓN**:
   - Para abrir la administración de empresas registradas ("dónde van las empresas registradas", "abre mis empresas"): 'wappy_navegar' con modulo: 'empresas' o 'empresas_registradas'.
   - Para ir a configuración / ajustes de la cuenta: 'wappy_navegar' con modulo: 'configuracion' o 'settings'.
8.6. **PRESENCIA EN PÁGINAS INSTITUCIONALES (/planes, /terms, /privacy, /about) Y REGRESO**:
   - Tenshi está presente y atenta en /planes, /terms, /privacy y /about. Puede leerlas con 'leer_pantalla' y explicarlas.
   - Para volver al chat o al SG-SST: 'wappy_navegar' con modulo: 'regresar' o 'volver'.
9. **GOOGLE DRIVE Y COBERTURA TOTAL DE SOMOS SST ('google_drive')**:
   - Conéctate a Google Drive para explorar carpetas, leer documentos (RUT, planillas, matrices GTC45, FDS químicas) o guardar archivos con 'write_file'.
10. **GESTIÓN DIRECTA DE COLABORADORES, CENSO Y EMPRESAS (HUELLA BIOCÉNTRICA)**:
   - TIENES HERRAMIENTAS DIRECTAS PARA CONTROL TOTAL DE COLABORADORES Y EMPRESAS:
     * 'wappy_consultar_trabajadores': Para buscar trabajadores o consultar nómina (activos o retirados). Retorna 'totalRegistrados' (censo global absoluto), 'totalActivos' y 'totalRetirados'.
     * DIFERENCIACIÓN OBLIGATORIA DE CENSO: NUNCA confundas el total registrado con los activos. Si la respuesta dice 58 registrados, 57 activos y 1 retirado, DI CLARAMENTE: "Tienes un total de 58 trabajadores registrados: 57 activos y 1 retirado". ESTÁ TERMINANTEMENTE PROHIBIDO decir "58 activos y 1 retirado". Sigue con fidelidad el 'resumenCenso' devuelto.
     * 'wappy_consultar_empresas': Cuando el usuario pregunte cuántas empresas tiene registradas o cuáles son, INVOCA DE INMEDIATO 'wappy_consultar_empresas'. WAPPY permite hasta 3 empresas por usuario. Reporta el total de empresas registradas, sus nombres, NIT, trabajadores y cuál está activa según 'resumenTexto'.
     * 'wappy_consultar_detalle_empresa': Cuando el usuario pida ver los datos o contenido de cualquiera de sus empresas (activa o inactiva), INVOCA 'wappy_consultar_detalle_empresa' indicando su nombre o NIT.
     * 'wappy_activar_empresa' / 'seleccionar_empresa': Cuando el usuario te pida activar, seleccionar o cambiar a otra de sus empresas registradas, INVOCA DE INMEDIATO 'wappy_activar_empresa' o 'seleccionar_empresa' con el nombre de la empresa.
     * 'wappy_actualizar_empresa': Cuando el usuario te pida modificar, editar o actualizar la información de una empresa (razón social, NIT, representante legal, cédula rep legal, trabajadores, ARL, riesgo, actividad económica, CIIU, dirección, ciudad, teléfono, email, responsable SST, etc.), INVOCA DE INMEDIATO 'wappy_actualizar_empresa' con los campos correspondientes. El sistema actualizará el perfil en la base de datos, en la pantalla y en la memoria.
     * 'wappy_reintegrar_trabajador': Cuando el usuario te pida reintegrar, reactivar, volver a contratar, reincorporar o pasar a activo a un trabajador previamente retirado (ej: "reintegrar al trabajador Jorge Enrique Pineda" o "reactivar a Jorge Pineda"), INVOCA DE INMEDIATO 'wappy_reintegrar_trabajador' con su nombre o cédula. El sistema restaurará su estado laboral a 'Activo' en la base de datos y refrescará la plataforma.
     * ESTÁ TERMINANTEMENTE PROHIBIDO afirmar que ya reintegraste a un colaborador sin antes invocar 'wappy_reintegrar_trabajador'.
     * 'wappy_retirar_trabajador': Cuando el usuario te pida retirar, desvincular, dar de baja o sacar a un trabajador (ej: "dejar como retirado a Jorge Ricky Pineda" o "retirar a Jorge Pineda"), INVOCA DE INMEDIATO 'wappy_retirar_trabajador' con su nombre o cédula. El sistema conservará su historial médico y ocupacional de 20 años y lo trasladará a la pestaña 'Retirados'.
     * ESTÁ TERMINANTEMENTE PROHIBIDO decir que no tienes una función para cambiar el estado de un colaborador a 'retirado'. ¡TIENES la función 'wappy_retirar_trabajador'!
     * 'wappy_actualizar_trabajador': Para editar cargos, salarios, áreas, sedes o estado de un trabajador.
     * 'wappy_registrar_trabajador': Para dar de alta a un nuevo colaborador en el SG-SST.
     * 'wappy_importar_sociodemografico_drive': SIEMPRE que el usuario te pida buscar en su Google Drive (en una carpeta específica X o en su Drive) el archivo del Perfil Sociodemográfico o Condiciones de Salud y alimentar/cargar la información de los trabajadores en el Perfil Sociodemográfico y Condiciones de Salud de Somos SST, INVOCA DE INMEDIATO 'wappy_importar_sociodemografico_drive' indicando 'carpeta' (ej. el nombre de la carpeta X) y opcionalmente 'archivo'. Esta herramienta híbrida busca la carpeta en Drive, lee todas las hojas/archivos, procesa a todos los trabajadores con el modelo de texto 'gemini-3.5-flash-lite' (y respaldo 'gemini-3.6-flash') y alimenta automáticamente tanto el Perfil Sociodemográfico como las Condiciones de Salud y el Score Biocéntrico en Somos SST.
     * 'wappy_importar_hito1_drive': SIEMPRE que el usuario te pida buscar en su Google Drive archivos o matrices del Hito 1 (Matriz IPEVR GTC-45, Matriz de Riesgos Viales PESV, Matriz de Compatibilidad Química SGA, Análisis de Vulnerabilidad/Diamante de Emergencias, Diagnóstico Inicial Estándares Mínimos 0312 o Asignación del Responsable SST) y alimentar/actualizar los aplicativos en Somos SST, INVOCA DE INMEDIATO 'wappy_importar_hito1_drive' indicando 'aplicativo' ('gtc45', 'pesv', 'compatibilidad', 'vulnerabilidad', 'diagnostico', 'responsable' o 'auto'), 'carpeta' (si la menciona) y opcionalmente 'archivo'. Extrae, normaliza y calcula con fórmulas exactas y 'gemini-3.5-flash-lite' (respaldo 'gemini-3.6-flash'), alimentando los aplicativos oficiales en Somos SST. (Nota: Matriz legal excluida por estar en construcción).
6. **CONTROL TOTAL DE LA PLATAFORMA MEDIANTE CLICS Y OPERACIÓN VISUAL ('operar_interfaz_visual')**:
   - Puedes hacer clic en CUALQUIER BOTÓN, pestaña, menú o tarjeta de todos los aplicativos (ej: pestañas 'Retirados', 'Activos', 'Todos', botones '+ Agregar Trabajador', 'Guardar Localmente', 'Descargar', etc.) usando 'operar_interfaz_visual' indicando el índice [índice] o el texto/nombre del botón.
7. **SUITE COMPLETA DE 41 OPERACIONES MCP DEL SG-SST ('wappy_mcp_sst' y 'wappy_resumen_general_360')**:
   - Cuentas con acceso integral a las 41 operaciones MCP para consultar y alimentar: Diagnóstico 360°, Empresa, Matriz GTC-45, Matriz PESV, Matriz Legal, Estándares 0312, Comités (COPASST, Convivencia, Brigadas), Químicos SGA, Vehículos, EPP, Reportes de Actos y Condiciones, Perfiles de Cargo, Casos ATEL, Cronograma y Tareas, Capacitaciones, Auditorías y Automatizaciones.
8. **ENTREGA DE INFORMES ORIGINALES DE APLICATIVOS ('wappy_leer_informe_aplicativo')**:
   - Cuando el usuario te pida: "pásame el informe de [aplicativo]", "tráeme el informe de responsabilidades", "muéstrame el informe de la política", etc.:
     * DEBES invocar 'wappy_leer_informe_aplicativo' pasando el aplicativo correspondiente ('responsable', 'politica', 'objetivos', 'perfil_cargo', 'gtc45', 'diagnostico_0312', 'ats', 'vulnerabilidad', 'owas', 'estudio_puesto', 'legal', 'quimicos', 'comites', 'capacitaciones', 'epp', 'investigacion_atel', 'pesv', 'auditoria', etc.).
     * Si la herramienta devuelve el informe original guardado en el aplicativo, entrégalo con fidelidad. El sistema adjuntará automáticamente el documento interactivo para verlo en pantalla o descargarlo.
     * ESTÁ TERMINANTEMENTE PROHIBIDO limitarse a un resumen en texto plano o generar un nuevo documento en Canva, a menos que el usuario pida explícitamente "haz un diseño en Canva" o "crea uno nuevo".
     * Si hay múltiples informes guardados para ese aplicativo, indícale la versión más reciente y menciónale que tiene además otros disponibles para consultar.
     * Si no existe ningún informe guardado aún en ese aplicativo, explícaselo cordialmente y ofrécele generarlo de inmediato.
   - PERFILES DE CARGO: En Perfiles de Cargo, reporta el catálogo completo de todos los cargos de la empresa y si te piden un cargo puntual consúltalo pasando cargo: '<nombre del cargo>'.
9. **ACADEMIA WAPPY LMS ('wappy_consultar_cursos' y 'wappy_leer_curso')**:
   - 'wappy_consultar_cursos': Consulta y lista todos los cursos formativos de la academia, sus lecciones y descripción.
   - 'wappy_leer_curso': Lee un curso completo con todas sus lecciones, contenidos formativos y evaluaciones por su título o ID.
10. **BLOG DE WAPPY ('wappy_consultar_blog' y 'wappy_leer_articulo_blog')**:
   - 'wappy_consultar_blog': Lista todos los artículos publicados en el blog, títulos, etiquetas y resúmenes.
   - 'wappy_leer_articulo_blog': Lee el texto íntegro y exhaustivo de cualquier artículo del blog para responder y enseñar a fondo.
11. **ACTIVACIÓN TOTAL DE HERRAMIENTAS DE AGENTES ('wappy_activar_herramienta_agente')**:
   - TIENES FACULTAD TOTAL para activar y ejecutar directamente cualquiera de las herramientas especializadas de los agentes ('canvas', 'matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'gestor_automatizaciones', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'editor_live', 'generar_imagen_sst'). Invócala cuando el usuario te pida abrir, activar o ejecutar la herramienta de un agente.
12. **DELEGACIÓN Y CONEXIÓN BIDIRECCIONAL CON ANTIGRAVITY ('wappy_delegar_orden_antigravity')**:
   - Si el usuario menciona explícitamente a "Antigravity" (ej: "pregúntale a Antigravity...", "conéctate con Antigravity", "que Antigravity cree un documento y me lo mande al chat"):
   - DISTINCIÓN CRÍTICA: Si el usuario solo hace una pregunta o consulta para Antigravity (sin pedir explícitamente crear un documento, informe o aplicativo), invoca 'wappy_delegar_orden_antigravity' con tipo_entregable='respuesta' para que Antigravity responda directamente en el chat sin generar documentos innecesarios.
   - Si el usuario sí pide explícitamente crear un documento o informe, usa tipo_entregable='documento' (se abrirá en el Editor de Documentos de WAPPY / Canvas); si pide un aplicativo o dashboard, usa tipo_entregable='html'.
   - Explícale al usuario que la consulta/orden fue enviada en tiempo real por Push a Antigravity.
13. **REGLA MANDATORIA DE BASE DE DATOS NORMATIVA RAG Y BÚSQUEDA HÍBRIDA ('web_search')**:
   - Tienes conectada una **Base de Datos Documental y Normativa Oficial de WAPPY (99+ documentos .md + Vademécum Maestro 2026 + Batería completa de Riesgo Psicosocial manuales 1 al 7 + Resoluciones 2024-2026)** integrada directamente dentro de la herramienta 'web_search' y en tu contexto RAG.
   - Si el usuario te pide buscar en tu base de datos documental/normativa, pregunta por guías o manuales de riesgo psicosocial, o su consulta involucra normatividad colombiana (Leyes, Decretos, Resoluciones, Sentencias):
   - DEBES EJECUTAR INMEDIATAMENTE en tu primer turno la herramienta 'web_search' (la cual consulta simultáneamente la Base de Datos Normativa Oficial de WAPPY y el buscador web SearXNG en tiempo real).
   - **HITOS NORMATIVOS VIGENTES (PROHIBIDO CITAR NORMAS DEROGADAS)**:
     * **Evaluaciones Médicas Ocupacionales e Historia Clínica:** La norma vigente es la **Resolución 1843 de 2025** del Ministerio del Trabajo (que actualizó y reemplazó a la antigua Resolución 2346 de 2007 y Res. 1918 de 2009). NUNCA digas que la última norma de exámenes médicos es la 2346 de 2007.
     * **Riesgo Psicosocial y Batería:** **Resolución 2764 de 2022** (adopta la Batería de Instrumentos, Manual General, Intralaboral Forma A/B, Extralaboral, Cuestionario de Estrés, Guías de análisis y Protocolo de Duelo) en articulación con la **Resolución 2646 de 2008** y **Ley 1090 de 2006**.
     * **Trabajo en Alturas:** **Resolución 4272 de 2021** (derogó la Res. 1409 de 2012).
     * **Espacios Confinados:** **Resolución 0491 de 2020** modificada por la **Resolución 2605 de 2020**.
     * **Seguridad Vial (PESV):** **Resolución 40595 de 2022** y **Ley 2251 de 2022**.
     * **Trabajo en Calderas:** **Resolución 1857 de 2024**.
     * **Reglamento Técnico de Instalaciones Eléctricas (RETIE):** **Resolución 40117 de 2024** y **Resolución 5018 de 2019**.
     * **Acoso Laboral y Sexual:** **Ley 1010 de 2006**, **Ley 2209 de 2022** y **Ley 2365 de 2024** (prevención de acoso sexual en el ámbito laboral).`;

        if (skillInstructions) {
            systemMessage += `\n\n${skillInstructions}`;
        }

        if (browserState) {
            systemMessage += `\n\n### 🌐 ESTADO VISUAL DE LA PÁGINA ACTUAL (DEL NAVEGADOR DEL USUARIO)
Puedes interactuar con la pantalla del usuario (hacer clic, rellenar formularios, escribir texto, hacer scroll) utilizando la herramienta 'operar_interfaz_visual' pasándole el [índice] correspondiente de esta lista:
${browserState}

REGLAS EXTRAS PARA OPERAR LA INTERFAZ:
- NUNCA utilices la herramienta 'operar_interfaz_visual' para responder a saludos simples ("hola", "buenos días", etc.), despedidas o preguntas de texto puro que no requieran ninguna navegación ni interacción con la pantalla.
- Sé sumamente proactivo: si el usuario te dice que quiere, desea, necesita o te pide ayuda para realizar una tarea o acción (ej: "deseo crear un trabajador", "ayúdame a ver Z", "quiero registrar Y"), NO le expliques los pasos en texto. En lugar de eso, utiliza de inmediato la herramienta 'operar_interfaz_visual' para navegar, hacer clics y guiarlo o hacerlo por él en la pantalla. ¡El usuario quiere ver la automatización en vivo en su navegador!
- Persistencia del objetivo: Una vez que el usuario inicia una solicitud de tarea (ej: crear un trabajador), debes mantener la ejecución de esa tarea a lo largo de todos los turnos subsiguientes. Aunque recibas un mensaje de actualización '[RESULTADO_GUI]', debes analizar el nuevo DOM y seguir llamando a 'operar_interfaz_visual' de forma ininterrumpida hasta que el objetivo final (como guardar el formulario) se haya cumplido por completo. No te detengas a medio camino.
- NUNCA mientas ni alucines diciendo que has creado registros, guardado datos o hecho cambios en el "backend" o "base de datos" por tu cuenta si no has llamado a una herramienta real para ello. Si el usuario te pide hacer algo, hazlo interactivamente en la pantalla usando 'operar_interfaz_visual' (por ejemplo, navegando, haciendo clic en '+ Agregar Trabajador', y rellenando los campos) de manera que se vea en el navegador.
- Si tienes que buscar, pulsar o seleccionar algo, haz scroll o clics progresivamente llamando a 'operar_interfaz_visual' tantas veces como sea necesario en turnos sucesivos.
- NUNCA inventes índices de elementos que no aparezcan en la lista.
- FLUJO OBLIGATORIO PARA EDITAR UN TRABAJADOR EN PERFIL SOCIODEMOGRÁFICO O CONDICIONES DE SALUD:
  1. Cuando llegues al módulo (ej: Perfil Sociodemográfico), NO hagas clic en 'Guardar Localmente' todavía.
  2. Primero haz scroll hacia ABAJO en la lista para encontrar la tarjeta del trabajador específico (busca su nombre o cédula).
  3. Cuando veas la tarjeta del trabajador, haz clic en ella para expandir su formulario.
  4. Rellena o edita los campos del formulario (nombre, cédula, cargo, etc.) con la acción 'escribir'.
  5. SOLO DESPUÉS de haber rellenado los campos, haz scroll hacia ARRIBA para encontrar el botón 'Guardar Localmente' en la barra de herramientas y haz clic en él.
  6. Confirma que el guardado fue exitoso antes de reportar éxito al usuario.
- REGLA ANTI-TEXTO Y ANTI-ALUCINACIÓN: Si recibes un [RESULTADO_GUI], SIEMPRE debes responder llamando a 'operar_interfaz_visual' con la siguiente acción concreta. NUNCA respondas con texto inventando que realizaste una acción que no ejecutaste con una herramienta real. NUNCA digas "ya registré a Fabian" ni "quedó guardado" si no ejecutaste los pasos del flujo completo incluyendo el clic en Guardar.
- CAPACIDAD DE ACCIÓN EN LOTE (PARALELO): Puedes llamar a la herramienta 'operar_interfaz_visual' múltiples veces en la misma respuesta (en paralelo) si deseas ejecutar una secuencia de pasos lógicos seguidos (ej: hacer clic en una tarjeta, escribir en un campo, y luego hacer clic en guardar). Esto ahorra tiempo de red y ejecuta todo de una vez. Preferible usar esto para rellenar formularios rápidamente.`;
        }

        // format messages for the LLM
        const formattedMessages = [
            { role: 'system', content: systemMessage },
            ...messages
        ];

        // Route the request based on provider
        let responseText = '';

        if (config.provider === 'google') {
            const { GoogleGenerativeAI } = require('@google/generative-ai');

            // 1. Retrieve API keys with Tenshi priority and fallback to general keys / env
            let apiKeys = [];
            try {
                const tenshiKey = await getUserKey({ userId: req.user.id || req.user, name: 'tenshi_google' });
                if (tenshiKey) {
                    try {
                        const parsed = JSON.parse(tenshiKey);
                        const keyVal = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY || tenshiKey;
                        apiKeys = keyVal.split(',').map(k => k.trim()).filter(Boolean);
                    } catch (e) {
                        apiKeys = tenshiKey.split(',').map(k => k.trim()).filter(Boolean);
                    }
                }
            } catch (err) {}

            if (!apiKeys || apiKeys.length === 0) {
                const clientTenshiKey = req.body?.tenshiKey || req.headers?.['x-tenshi-key'];
                if (clientTenshiKey) {
                    apiKeys = clientTenshiKey.split(',').map(k => k.trim()).filter(Boolean);
                }
            }

            if (!apiKeys || apiKeys.length === 0) {
                apiKeys = await resolveApiKeys(req.user.id || req.user);
            }

            if (!apiKeys || apiKeys.length === 0) {
                throw new Error('No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del chat.');
            }

            // Dual-axis rotation: Candidate models with fallback
            // Modelos de texto configurados en GOOGLE_MODELS
            const envModels = (process.env.GOOGLE_MODELS || '')
                .split(',')
                .map(m => m.trim().replace('models/', ''))
                .filter(m => m && !m.includes('live') && !m.includes('native-audio') && !m.includes('transcribe') && !m.includes('tts'));

            // Modelos de texto permitidos y vigentes en WAPPY: gemini-3.5-flash-lite (ultra-rápido prioritario), gemini-3.6-flash y gemini-3.8-flash (fallback)
            const allowedTextModels = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];
            const validEnvModels = envModels.filter(m => allowedTextModels.includes(m));

            // Tenshi siempre prioriza gemini-3.5-flash-lite para máxima velocidad de respuesta
            const candidateModels = [
                'gemini-3.5-flash-lite',
                ...validEnvModels.filter(m => m !== 'gemini-3.5-flash-lite'),
                'gemini-3.6-flash'
            ].filter(Boolean);
            const modelFallbacks = [...new Set(candidateModels)];

            // Build history once (reusable across all retries) con ventana deslizante de los últimos 16 mensajes
            // para evitar saturación de contexto, envenenamiento y alucinaciones en conversaciones largas
            const rawHistory = messages.length > 16 ? messages.slice(-16, -1) : messages.slice(0, -1);
            const history = [];
            let firstUserFound = false;
            for (const m of rawHistory) {
                if (!firstUserFound && m.role !== 'user') continue;
                firstUserFound = true;
                
                let contentText = m.content || '';
                if (m.role === 'user' && contentText.startsWith('[RESULTADO_GUI]')) {
                    const delimiterIndex = contentText.indexOf('Estado actual de la pantalla:');
                    if (delimiterIndex !== -1) {
                        contentText = contentText.substring(0, delimiterIndex).trim();
                    }
                }
                const reportHtml = m.file?.content || m.htmlReport || '';
                if (reportHtml && typeof reportHtml === 'string') {
                    const cleanReportText = reportHtml
                        .replace(/<style[\s\S]*?<\/style>/gi, '')
                        .replace(/<script[\s\S]*?<\/script>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .substring(0, 1500);
                    const reportTitle = m.file?.title || 'Informe Oficial SG-SST';
                    contentText += `\n[📄 INFORME GENERADO EN ESTE MENSAJE DEL CHAT DE TENSHI: "${reportTitle}" — Extracto: ${cleanReportText}]`;
                }

                history.push({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: contentText || ' ' }]
                });
            }

            // Base function declarations (always available to Tenshi)
            const somosSSTDeclaration = {
                name: 'somos_sst',
                description: 'Herramienta oficial de SOMOS SST (anteriormente SGSST). Permite consultar y editar cualquier información en sus 2 MÓDULOS PRINCIPALES: el Motor Bio-Individual (Bio Motor - expediente del trabajador, exámenes médicos, accidentes ATEL, Hitos) y el Ecosistema SG-SST General (matrices GTC45, EPP, alturas, ATS, capacitaciones, políticas, Centro de Control ACPM y estadísticas en tiempo real).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: {
                            type: 'STRING',
                            description: 'La acción a ejecutar: actualizar_informacion_empresa, consultar_expediente_integral, listar_trabajadores, resumen_empresa, actualizar_examen_medico, registrar_accidente_atel, actualizar_hito_tarea, editar_cualquier_aplicativo, generar_informe_html, consultar_historial_informes, consultar_planes_y_sistema, consultar_centro_control_acpm, crear_actividad_acpm, actualizar_actividad_acpm, crear_trabajador, retirar_trabajador, actualizar_trabajador, eliminar_trabajador.'
                        },
                        razon_social: { type: 'STRING', description: 'Razón Social o Nombre legal de la empresa' },
                        tipo_empresa: { type: 'STRING', description: '"Persona Jurídica" o "Persona Natural"' },
                        nit: { type: 'STRING', description: 'Número de Identificación Tributaria (NIT)' },
                        representante_legal: { type: 'STRING', description: 'Nombre del Representante Legal' },
                        cedula_representante: { type: 'STRING', description: 'Cédula o ID del Representante Legal' },
                        numero_trabajadores: { type: 'NUMBER', description: 'Número de trabajadores' },
                        arl: { type: 'STRING', description: 'Nombre de la Administradora de Riesgos Laborales (ARL)' },
                        actividad_economica: { type: 'STRING', description: 'Actividad económica principal' },
                        nivel_riesgo: { type: 'STRING', description: 'Nivel de riesgo ARL (I, II, III, IV, V)' },
                        ciiu: { type: 'STRING', description: 'Código CIIU' },
                        direccion: { type: 'STRING', description: 'Dirección física de la sede principal' },
                        ciudad: { type: 'STRING', description: 'Ciudad o municipio' },
                        departamento: { type: 'STRING', description: 'Departamento' },
                        telefono: { type: 'STRING', description: 'Teléfono de contacto' },
                        correo: { type: 'STRING', description: 'Correo electrónico corporativo' },
                        datos_json: { type: 'STRING', description: 'Datos estructurados en formato JSON o string para guardado masivo' },
                        tipo_informe: { type: 'STRING' },
                        titulo_informe: { type: 'STRING' },
                        contenido_html: { type: 'STRING' },
                        nombre_o_cargo: { type: 'STRING' },
                        identificacion: { type: 'STRING' },
                        fecha_examen: { type: 'STRING' },
                        concepto_diagnostico: { type: 'STRING' },
                        restricciones: { type: 'STRING' },
                        tipo_siniestro: { type: 'STRING' },
                        dias_incapacidad: { type: 'STRING' },
                        descripcion_hechos: { type: 'STRING' },
                        nombre_aplicativo: { 
                            type: 'STRING',
                            description: 'Nombre del aplicativo a editar: "empresa", "cargos" (perfiles de cargo), "estudio_puesto" (EPT), "auditoria", "diagnostico", "epp", "alturas", "ats", "vehiculos", "capacitaciones", "gtc45", "owas", "actos", "vulnerabilidad", "quimicos", "kanban", "politica", "matriz_legal", "rhs", "rit", "estadisticas".'
                        },
                        propiedad_o_ruta: { type: 'STRING' },
                        nuevo_valor: { type: 'STRING' },
                        titulo_actividad: { type: 'STRING', description: 'Título de la actividad para el Centro de Control ACPM' },
                        descripcion_actividad: { type: 'STRING', description: 'Detalles o descripción de la actividad ACPM' },
                        fecha_vencimiento: { type: 'STRING', description: 'Fecha de vencimiento (YYYY-MM-DD o "mañana")' },
                        estado_actividad: { type: 'STRING', description: 'todo, due_soon, overdue, done' },
                        tipo_actividad: { type: 'STRING', description: 'manual, medical_exam, training, other' }
                    },
                    required: ['accion']
                }
            };

            const googleDriveDeclaration = {
                name: 'google_drive',
                description: 'Permite interactuar con Google Drive del usuario: buscar archivos y carpetas, leer el contenido de documentos (PDFs, Word .docx, Excel .xlsx/.xls, Google Docs, Google Sheets) y crear o actualizar documentos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: {
                            type: 'STRING',
                            description: 'La acción a realizar: "list_files_and_folders", "read_document_content", "create_folder", "write_file".'
                        },
                        query: {
                            type: 'STRING',
                            description: 'Término de búsqueda para listar archivos (nombre, palabra clave) o el texto a escribir.'
                        },
                        fileId: {
                            type: 'STRING',
                            description: 'El ID del archivo o carpeta para leer o actualizar.'
                        },
                        fileName: {
                            type: 'STRING',
                            description: 'El nombre del archivo o carpeta que deseas crear.'
                        },
                        parentId: {
                            type: 'STRING',
                            description: 'El ID de la carpeta contenedora en Google Drive (opcional).'
                        }
                    },
                    required: ['action']
                }
            };

            const consultarAgenteDeclaration = {
                name: 'consultar_agente_especializado',
                description: 'MODO 2 — Subagente Efímero en Segundo Plano (SIN salir del chat de Tenshi): Consulta en segundo plano a un Agente Especialista (Médico Laboral, Abogado Laboral, Psicólogo SST, Auditor, etc.) y recibe su dictamen técnico para responder aquí mismo en el chat de Tenshi. PROHIBICIÓN ESTRICTA: SOLO invócala cuando el usuario pida literalmente el dictamen, concepto u opinión del especialista dentro de este chat (ej: "Quiero el dictamen formal del Abogado Laboral", "Pregúntale al Médico qué opina"). Si el usuario pide ABRIR UN CHAT en pantalla con el agente ("Ábreme un chat con el médico laboral"), NO uses esta herramienta; usa wappy_abrir_chat_agente. Si el usuario solo hace una pregunta técnica normal, responde tú misma sin invocar esta herramienta.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        nombre_especialista: { type: 'STRING', description: 'Nombre exacto del agente especialista a consultar en segundo plano.' },
                        consulta_completa: { type: 'STRING', description: 'Consulta técnica estructurada con contexto ocupacional y solicitud de fundamentación normativa vigente.' }
                    },
                    required: ['nombre_especialista', 'consulta_completa']
                }
            };

            const wappyAbrirChatAgenteDeclaration = {
                name: 'wappy_abrir_chat_agente',
                description: 'MODO 3 — Abrir Chat Dedicado en Pantalla Principal: Abre la ventana de chat en pantalla con un Agente Especialista de WAPPY (Médico Laboral, Abogado Laboral, Fisioterapeuta Laboral, Ingeniero Químico SST, Coordinador PESV, Psicólogo SST, etc.) y le envía la consulta estructurada. ÚNICAMENTE invócala cuando el usuario pida explícitamente ABRIR UN CHAT, IR AL CHAT o CREAR UNA CONVERSACIÓN con el especialista (ej: "Ábreme un chat con el agente Médico Laboral", "Abre un chat con el Abogado", "Llévame al chat del médico").',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        agente: {
                            type: 'STRING',
                            description: "Nombre o especialidad del agente (ej: 'medico_laboral', 'abogado_laboral', 'fisioterapeuta_laboral', 'ingeniero_quimico_sst', 'coordinador_seguridad_vial', 'psicologo_sst', 'auditor_sg_sst')."
                        },
                        pregunta: {
                            type: 'STRING',
                            description: 'Consulta técnica estructurada y profesional para el especialista, incluyendo planteamiento ocupacional, solicitud de normatividad colombiana vigente y recomendaciones prácticas para el SG-SST.'
                        },
                        nuevo_chat: {
                            type: 'BOOLEAN',
                            description: 'true si el usuario pide abrir un nuevo chat o cambiar de especialista; false si continúa en la conversación actual.'
                        }
                    },
                    required: ['agente', 'pregunta']
                }
            };

            const wappyBuscarHistorialDeclaration = {
                name: 'wappy_buscar_historial_instantaneo',
                description: 'Búsqueda Instantánea de Historial (< 5ms, estilo BM25 sin gastar tokens): Busca en todas las conversaciones pasadas de Tenshi, chats con especialistas e informes SG-SST por palabras clave, nombres de trabajadores, cédulas, accidentes o normas.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        consulta: {
                            type: 'STRING',
                            description: 'Término, nombre de trabajador, cédula, norma o tema a buscar en el historial.'
                        },
                        limite: {
                            type: 'NUMBER',
                            description: 'Cantidad máxima de resultados a retornar (por defecto 8).'
                        }
                    },
                    required: ['consulta']
                }
            };

            const canvasDeclaration = {
                name: 'canvas_tool',
                description: 'Lienzo interactivo Canvas: Crea o edita documentos ("text"), hojas de cálculo ("excel"), presentaciones ("presentation") o prototipos ("html") en pantalla dividida.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'crear, actualizar, leer, editar_seccion, buscar_reemplazar, insertar' },
                        fileType: { type: 'STRING', description: 'text, excel, presentation, html' },
                        title: { type: 'STRING', description: 'Título del documento' },
                        content: { type: 'STRING', description: 'Contenido principal o Markdown' }
                    },
                    required: ['accion', 'fileType']
                }
            };

            const operarGUIDeclaration = {
                name: 'operar_interfaz_visual',
                description: 'Operar Interfaz Visual (GUI): Permite simular clics y escrituras directamente en el navegador del usuario. Úsala cuando necesites hacer clic en un botón (ej: "Generar con IA", "Guardar", "Exportar", "Historial"), escribir texto en un input, o hacer scroll en la pantalla activa del usuario.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: {
                            type: 'STRING',
                            description: 'La acción a ejecutar: click, escribir, scroll, esperar.'
                        },
                        indice: {
                            type: 'NUMBER',
                            description: 'El índice numérico del elemento interactivo obtenido de la lista del DOM (ej: 0, 1, 2...). Opcional si se especifica "detalle".'
                        },
                        detalle: {
                            type: 'STRING',
                            description: 'Texto, etiqueta o nombre del botón/elemento con el que deseas interactuar (ej: "Generar con IA", "Guardar", "Historial", "Exportar a Excel"). Permite encontrar el botón semánticamente de forma segura.'
                        },
                        campo: {
                            type: 'STRING',
                            description: 'Nombre o placeholder del campo input donde escribir (opcional).'
                        },
                        texto: {
                            type: 'STRING',
                            description: 'El texto a escribir (obligatorio si la acción es "escribir").'
                        },
                        direccion: {
                            type: 'STRING',
                            description: 'La dirección del scroll: "arriba" o "abajo" (obligatorio si la acción es "scroll").'
                        }
                    },
                    required: ['accion']
                }
            };

            const diligenciarFormularioDeclaration = {
                name: 'wappy_diligenciar_formulario',
                description: 'Diligenciar Formulario: Autocompleta o redacta automáticamente campos de un formulario o aplicativo en pantalla (Investigación ATEL, PESV, Alturas, Reporte de Actos, etc.) con datos estructurados.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        modulo: {
                            type: 'STRING',
                            description: 'Nombre del aplicativo o formulario (ej: "investigacion_atel", "vehicles_pesv", "permiso_alturas", "reporte_actos").'
                        },
                        campos: {
                            type: 'OBJECT',
                            description: 'Objeto clave-valor con los campos y sus datos a rellenar en el formulario.'
                        },
                        accion: {
                            type: 'STRING',
                            description: 'Acción a realizar: "llenar", "guardar" o "generar_ia".'
                        }
                    },
                    required: ['modulo', 'campos']
                }
            };

            const seleccionarEmpresaDeclaration = {
                name: 'seleccionar_empresa',
                description: 'Permite cambiar o activar la empresa en uso en la plataforma WAPPY por su nombre, NIT o ID. Si el usuario te pide cambiar de empresa o activar otra empresa, invoca esta función.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        nombre_o_id: {
                            type: 'STRING',
                            description: 'Nombre de la empresa, NIT o ID a seleccionar y activar.'
                        }
                    },
                    required: ['nombre_o_id']
                }
            };

            const wappyActivarEmpresaDeclaration = {
                name: 'wappy_activar_empresa',
                description: 'Activa o cambia la empresa en uso en WAPPY por su nombre, NIT o ID. Actualiza la empresa activa en la base de datos, en la pantalla y en la memoria.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        empresa: {
                            type: 'STRING',
                            description: 'Nombre, NIT o ID de la empresa a activar.'
                        }
                    },
                    required: ['empresa']
                }
            };

            const wappyActualizarEmpresaDeclaration = {
                name: 'wappy_actualizar_empresa',
                description: 'Modifica o edita la información de cualquier empresa registrada del usuario o de la empresa activa (razón social, NIT, tipo de empresa, representante legal, cédula rep legal, número de trabajadores, ARL, nivel de riesgo, actividad económica, CIIU, dirección, ciudad, departamento, teléfono, email, responsable SST, licencia SST, vigencia).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        empresa: { type: 'STRING', description: 'Nombre, NIT o ID de la empresa a editar. Si se omite, se edita la empresa activa.' },
                        companyName: { type: 'STRING', description: 'Nueva razón social de la empresa.' },
                        nit: { type: 'STRING', description: 'Nuevo NIT o cédula.' },
                        companyType: { type: 'STRING', description: "'Persona Jurídica' o 'Persona Natural'." },
                        legalRepresentative: { type: 'STRING', description: 'Nombre del representante legal.' },
                        legalRepresentativeId: { type: 'STRING', description: 'Cédula del representante legal.' },
                        workerCount: { type: 'NUMBER', description: 'Número de trabajadores.' },
                        arl: { type: 'STRING', description: 'Nombre de la ARL.' },
                        riskLevel: { type: 'STRING', description: "Nivel de riesgo ('I', 'II', 'III', 'IV', 'V')." },
                        ciiu: { type: 'STRING', description: 'Código CIIU.' },
                        economicActivity: { type: 'STRING', description: 'Actividad económica.' },
                        address: { type: 'STRING', description: 'Dirección principal.' },
                        city: { type: 'STRING', description: 'Ciudad.' },
                        departamento: { type: 'STRING', description: 'Departamento.' },
                        phone: { type: 'STRING', description: 'Teléfono de contacto.' },
                        email: { type: 'STRING', description: 'Correo electrónico.' },
                        responsibleSST: { type: 'STRING', description: 'Nombre del Responsable SST.' },
                        licenseNumber: { type: 'STRING', description: 'Licencia SST.' },
                        licenseExpiry: { type: 'STRING', description: 'Fecha vigencia licencia SST.' },
                        generalActivities: { type: 'STRING', description: 'Actividades generales.' }
                    }
                }
            };

            const gestionarMemoriaDeclaration = {
                name: 'gestionar_memoria',
                description: 'Permite consultar, guardar o eliminar datos clave en la memoria permanente del usuario (como datos de la empresa, procesos, notas importantes, directrices). Úsala si el usuario te pide guardar o recordar un dato en su memoria.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: {
                            type: 'STRING',
                            description: 'Acción a realizar: "consultar", "guardar" o "eliminar".'
                        },
                        clave: {
                            type: 'STRING',
                            description: 'Clave o tema de la memoria (ej: "empresa_activa", "macroprocesos", "nota", etc.).'
                        },
                        valor: {
                            type: 'STRING',
                            description: 'Contenido a guardar cuando la acción sea "guardar".'
                        }
                    },
                    required: ['accion']
                }
            };

            const leerPantallaDeclaration = {
                name: 'leer_pantalla',
                description: 'Lee e inspecciona el texto, tablas, registros, tarjetas e informes que están visibles en la pantalla actual del usuario. Úsala siempre que el usuario te pida leerle lo que hay en pantalla, leerle un informe reciente o revisar los datos visibles de un aplicativo.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        seccion: {
                            type: 'STRING',
                            description: 'Sección o informe específico a leer (opcional: "informe", "tabla", "formulario", "todo").'
                        }
                    }
                }
            };

            const wappyNavegarDeclaration = {
                name: 'wappy_navegar',
                description: 'Navega de inmediato a cualquier módulo, hito, pantalla o aplicativo de la plataforma WAPPY y Somos SST. DEBES invocar esta función siempre que el usuario te pida ir, ver, abrir o consultar una sección o hito.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        modulo: {
                            type: 'STRING',
                            description: "Nombre clave del módulo, hito o aplicativo. Hitos 1 al 8: 'diagnostico' (0312), 'participacion_ipevar', 'matriz_ipevar_oficial', 'matriz_pesv_oficial', 'matriz_compatibilidad_oficial', 'vulnerabilidad', 'plan_emergencias', 'responsable', 'politica', 'objetivos', 'legal', 'rhs', 'rit', 'perfil_cargo', 'perfil_socio', 'condiciones_salud', 'copasst', 'cocolab', 'comite_pesv', 'brigada_emergencias', 'animo', 'metodo_owas', 'estudio_puesto', 'peligros', 'permiso_alturas', 'analisis_trabajo_seguro', 'epp_delivery', 'vehicles_pesv', 'heights_lifecycle', 'chemical_registry', 'equipos_emergencia', 'reporte_actos', 'capacitaciones', 'simulacros_emergencia', 'ruta_aprendizaje', 'app_builder', 'estadisticas', 'investigacion_atel', 'control_acpm', 'auditoria', 'alta_direccion', 'investigacion_profunda', 'predictivo'. Aplicativos y Dashboards: 'sgsst', 'planes', 'academia', 'training_admin', 'rutas', 'ruta_admin', 'blog', 'blog_admin', 'events_meet', 'events_meet_admin', 'marketplace' (/marketplace tienda productos SST), 'marketplace_admin', 'agents' (/agents catálogo especialistas IA), 'control' (Kanban ACPM), 'tareas' (/tareas: Tareas programadas de agentes IA, antes 'Automatizaciones'; alias 'automatizaciones'), 'historial_tareas' (/tareas?tab=historial), 'animo_dashboard', 'live' (/c/new), 'chat_sst', 'roadmap', 'contactanos', 'comunidad', 'matriz', 'embajadores', 'embajadores_dashboard', 'tenshi_admin', 'search', 'privacy', 'terms', 'about'. Portales públicos: 'public_reportar', 'public_animo', 'public_estudio_puesto', 'public_ipevar', 'public_alta_direccion', 'public_atel', 'public_colaborador', 'public_comites', 'public_convivencia', 'public_votaciones', 'public_inspecciones', 'public_brigadistas'."
                        },
                        ruta: {
                            type: 'STRING',
                            description: 'Ruta URL interna exacta (opcional).'
                        }
                    },
                    required: ['modulo']
                }
            };

            // Dynamic function declarations (activated via Skill Triggers based on user intent)
            const matrizIPEVARDeclaration = {
                name: 'matriz_ipevar',
                description: 'Lee, añade, evalúa o actualiza riesgos laborales directamente en la Matriz GTC-45 de la conversación actual. Usa esta herramienta para leer, documentar o evaluar peligros en la matriz IPEVR / GTC-45.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'consultar_contexto_sgsst, leer, escribir, borrar' },
                        filtro_proceso: { type: 'STRING', description: 'Filtro por proceso o cargo.' },
                        filtro_cargo: { type: 'STRING', description: 'Filtro por cargo.' },
                        filtro_actividad: { type: 'STRING', description: 'Filtro por actividad.' },
                        filtro_peligro: { type: 'STRING', description: 'Filtro por peligro.' },
                        ids_a_borrar: { type: 'ARRAY', items: { type: 'STRING' }, description: 'IDs de riesgos a eliminar cuando accion="borrar".' },
                        riesgos: {
                            type: 'ARRAY',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    cargo: { type: 'STRING' },
                                    proceso: { type: 'STRING' },
                                    zona: { type: 'STRING' },
                                    actividad: { type: 'STRING' },
                                    tareas: { type: 'STRING' },
                                    rutinaria: { type: 'STRING', description: 'Sí o No' },
                                    peligro_descripcion: { type: 'STRING' },
                                    peligro_clasificacion: { type: 'STRING' },
                                    efectos_posibles: { type: 'STRING' },
                                    controles_fuente: { type: 'STRING' },
                                    controles_medio: { type: 'STRING' },
                                    controles_individuo: { type: 'STRING' },
                                    nd: { type: 'NUMBER' },
                                    ne: { type: 'NUMBER' },
                                    nc: { type: 'NUMBER' },
                                    medida_eliminacion: { type: 'STRING' },
                                    medida_sustitucion: { type: 'STRING' },
                                    medida_ingenieria: { type: 'STRING' },
                                    medida_administrativa: { type: 'STRING' },
                                    medida_eppu: { type: 'STRING' },
                                    factores_reduccion: { type: 'STRING' },
                                    nd_cualitativo: { type: 'NUMBER' },
                                    nro_expuestos: { type: 'NUMBER' },
                                    peor_consecuencia: { type: 'STRING' },
                                    requisito_legal: { type: 'STRING' }
                                },
                                required: ['proceso', 'zona', 'actividad', 'tareas', 'rutinaria', 'peligro_descripcion', 'peligro_clasificacion', 'efectos_posibles', 'nd', 'ne', 'nc']
                            },
                            description: 'Lista de riesgos a registrar cuando accion="escribir".'
                        }
                    },
                    required: ['accion']
                }
            };

            const matrizPESVDeclaration = {
                name: 'matriz_pesv',
                description: 'Lee, añade, evalúa o actualiza riesgos viales en la Matriz PESV (Plan Estratégico de Seguridad Vial - Res. 20223040040595 Paso 6, 8, 16 y 17 / ISO 39001).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'consultar_contexto_sgsst, leer, escribir, borrar' },
                        filtro_proceso: { type: 'STRING' },
                        filtro_cargo: { type: 'STRING' },
                        filtro_actor_vial: { type: 'STRING' },
                        filtro_peligro: { type: 'STRING' },
                        ids_a_borrar: { type: 'ARRAY', items: { type: 'STRING' } },
                        riesgos: {
                            type: 'ARRAY',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    grupo_trabajo: { type: 'STRING' },
                                    cargo: { type: 'STRING' },
                                    tipo_desplazamiento: { type: 'STRING' },
                                    rol_via: { type: 'STRING' },
                                    factor_riesgo: { type: 'STRING' },
                                    peligro_descripcion: { type: 'STRING' },
                                    programa_paso8: { type: 'STRING', description: 'Programa de gestión de riesgos críticos Paso 8 Res. 20223040040595.' },
                                    np_cualitativo: { type: 'STRING' },
                                    ne_cualitativo: { type: 'STRING' },
                                    nc_cualitativo: { type: 'STRING' },
                                    controles_existentes_descripcion: { type: 'STRING' },
                                    controles_existentes_tipo: { type: 'STRING' },
                                    tratamiento_accion: { type: 'STRING' },
                                    plan_accion_medio: { type: 'STRING' },
                                    plan_accion_vehiculo: { type: 'STRING' },
                                    plan_accion_individuo: { type: 'STRING' },
                                    plan_accion_infraestructura: { type: 'STRING' },
                                    responsable: { type: 'STRING' },
                                    fecha_programacion: { type: 'STRING' },
                                    estado: { type: 'STRING' },
                                    observaciones: { type: 'STRING' }
                                },
                                required: ['grupo_trabajo', 'cargo', 'tipo_desplazamiento', 'rol_via', 'factor_riesgo', 'peligro_descripcion', 'np_cualitativo', 'ne_cualitativo', 'nc_cualitativo']
                            },
                            description: 'Lista de riesgos viales a registrar cuando accion="escribir".'
                        }
                    },
                    required: ['accion']
                }
            };

            const matrizCompatibilidadDeclaration = {
                name: 'matriz_compatibilidad',
                description: 'Lee, añade, evalúa, enriquece con PubChem NIH GHS o actualiza inventarios de productos químicos en la Matriz de Compatibilidad y Almacenamiento Seguro SGA (Decreto 1496 de 2018, Res. 773 de 2021, NTC 3966).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'consultar_contexto_sgsst, leer, escribir, enriquecer_pubchem, borrar' },
                        filtro_nombre: { type: 'STRING' },
                        filtro_ubicacion: { type: 'STRING' },
                        filtro_clase: { type: 'STRING' },
                        ids_a_borrar: { type: 'ARRAY', items: { type: 'STRING' } },
                        productos: {
                            type: 'ARRAY',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    nombre: { type: 'STRING' },
                                    fabricante: { type: 'STRING' },
                                    estado_fisico: { type: 'STRING' },
                                    clasificacion_onu: { type: 'STRING' },
                                    numero_onu: { type: 'STRING' },
                                    cas: { type: 'STRING' },
                                    palabra_advertencia: { type: 'STRING' },
                                    pictogramas_sga: { type: 'ARRAY', items: { type: 'STRING' } },
                                    cantidad_almacenada: { type: 'STRING' },
                                    ubicacion: { type: 'STRING' },
                                    tiene_fds: { type: 'STRING' },
                                    tiene_rotulo: { type: 'STRING' },
                                    frases_h: { type: 'STRING' },
                                    consejos_p: { type: 'STRING' },
                                    incompatibilidades: { type: 'STRING' },
                                    requisitos_almacenamiento: { type: 'STRING' }
                                },
                                required: ['nombre', 'clasificacion_onu']
                            },
                            description: 'Lista de sustancias químicas a registrar cuando accion="escribir".'
                        }
                    },
                    required: ['accion']
                }
            };

            const gestorAutomatizacionesDeclaration = {
                name: 'gestor_automatizaciones',
                description: "Crea, lista, actualiza/edita, activa, desactiva/pausa, ejecuta, detiene o elimina TAREAS programadas (antes llamadas 'Automatizaciones IA'): tareas periódicas autónomas de agentes en segundo plano en la sección 'Tareas' (/tareas). Puedes identificar la tarea por su ID, por su título en pantalla o usar 'todas'.",
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'crear, listar, actualizar, activar, desactivar, activar_todas, desactivar_todas, eliminar, eliminar_todas, ejecutar_ahora, detener, ver_logs' },
                        nombre: { type: 'STRING', description: 'Nombre de la tarea/automatización (para crearla o buscarla por título).' },
                        nuevo_nombre: { type: 'STRING', description: 'Nuevo nombre si se desea renombrar la tarea.' },
                        agente_objetivo: { type: 'STRING', description: 'Agente que ejecutará la tarea periódica.' },
                        prompt_a_ejecutar: { type: 'STRING', description: 'Instrucción detallada a ejecutar periódicamente.' },
                        tipo_frecuencia: { type: 'STRING', description: 'daily, weekly, monthly, hourly' },
                        configuracion_horario: {
                            type: 'OBJECT',
                            properties: {
                                hora: { type: 'NUMBER' },
                                minuto: { type: 'NUMBER' },
                                dias_semana: { type: 'ARRAY', items: { type: 'NUMBER' } },
                                dia_mes: { type: 'NUMBER' },
                                intervalo_horas: { type: 'NUMBER' }
                            }
                        },
                        correos_notificacion: { type: 'ARRAY', items: { type: 'STRING' } },
                        automatizacion_id: { type: 'STRING', description: 'ID de 24 caracteres, título exacto/parcial de la tarea en pantalla, o "todas".' },
                        nuevo_estado: { type: 'STRING', description: 'active (activar) o inactive (desactivar/pausar)' }
                    },
                    required: ['accion']
                }
            };

            const googleSheetsDeclaration = {
                name: 'google_sheets',
                description: 'Interactúa con Google Sheets: crea hojas de cálculo, lee rangos de celdas, actualiza valores, añade filas y aplica formatos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'create_spreadsheet, read_spreadsheet, update_spreadsheet_values, append_spreadsheet_values, format_spreadsheet' },
                        spreadsheetId: { type: 'STRING', description: 'ID de la hoja de cálculo de Google.' },
                        title: { type: 'STRING', description: 'Título de la hoja a crear.' },
                        range: { type: 'STRING', description: 'Rango A1 (ej: "Sheet1!A1:D10").' },
                        values: {
                            type: 'ARRAY',
                            items: { type: 'ARRAY', items: { type: 'STRING' } },
                            description: 'Matriz bidimensional de datos a escribir o añadir.'
                        },
                        sheetId: { type: 'NUMBER', description: 'ID numérico de la pestaña.' },
                        headerColorHex: { type: 'STRING', description: 'Color hex de cabecera.' }
                    },
                    required: ['action']
                }
            };

            const googleDocsDeclaration = {
                name: 'google_docs',
                description: 'Interactúa con Google Docs: crea nuevos documentos, lee su texto completo, sobrescribe o añade contenido al final.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'create_document, read_document, write_to_document, append_to_document' },
                        documentId: { type: 'STRING', description: 'ID del documento de Google.' },
                        title: { type: 'STRING', description: 'Título del documento a crear.' },
                        text: { type: 'STRING', description: 'Contenido de texto o Markdown a redactar.' }
                    },
                    required: ['action']
                }
            };

            const googleSlidesDeclaration = {
                name: 'google_slides',
                description: 'Interactúa con Google Slides: crea presentaciones ejecutivas, añade diapositivas y lee la estructura.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'create_presentation, add_slide, read_presentation' },
                        presentationId: { type: 'STRING', description: 'ID de la presentación de Google Slides.' },
                        title: { type: 'STRING', description: 'Título de la presentación o diapositiva.' },
                        bodyText: { type: 'STRING', description: 'Texto del cuerpo de la diapositiva.' },
                        slideLayout: { type: 'STRING', description: 'TITLE_AND_BODY, TITLE, SECTION_HEADER, BLANK' },
                        slideType: { type: 'STRING', description: 'TITLE_SLIDE o CONTENT_SLIDE' }
                    },
                    required: ['action']
                }
            };

            const googleGmailDeclaration = {
                name: 'google_gmail',
                description: 'Permite enviar correos electrónicos, crear borradores, buscar/listar correos y leer correos en Gmail desde la cuenta de Google Workspace conectada.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'send_email, create_draft, list_emails o read_email' },
                        to: { type: 'STRING', description: 'Dirección de correo electrónico del destinatario (para send_email o create_draft).' },
                        subject: { type: 'STRING', description: 'Asunto del correo electrónico.' },
                        body: { type: 'STRING', description: 'Contenido del mensaje (HTML o texto).' },
                        cc: { type: 'STRING', description: 'Correos en copia.' },
                        bcc: { type: 'STRING', description: 'Correos en copia oculta.' },
                        query: { type: 'STRING', description: 'Filtro o término de búsqueda para list_emails (ej. "is:unread", "from:...", "subject:...").' },
                        maxResults: { type: 'NUMBER', description: 'Cantidad máxima de correos a listar (opcional, default 10).' },
                        messageId: { type: 'STRING', description: 'ID del mensaje específico a leer en read_email.' }
                    },
                    required: ['action']
                }
            };

            const googleCalendarDeclaration = {
                name: 'google_calendar',
                description: 'Interactúa con Google Calendar: crea eventos/recordatorios, lista o busca eventos para verificar disponibilidad, reprograma/edita citas existentes y elimina eventos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'create_event, list_events, find_event, delete_event, update_event, reschedule_event' },
                        title: { type: 'STRING', description: 'Título o resumen del evento.' },
                        description: { type: 'STRING', description: 'Detalles del evento.' },
                        startTime: { type: 'STRING', description: 'Fecha y hora de inicio (formato ISO local con offset -05:00 para Hora Colombia).' },
                        endTime: { type: 'STRING', description: 'Fecha y hora de finalización (opcional).' },
                        timeMin: { type: 'STRING', description: 'Fecha de inicio para listar eventos.' },
                        timeMax: { type: 'STRING', description: 'Fecha de fin para listar eventos.' },
                        eventId: { type: 'STRING', description: 'ID del evento de Google Calendar para eliminar o actualizar.' },
                        query: { type: 'STRING', description: 'Palabra clave, nombre de la reunión o motivo para buscar, reprogramar o eliminar sin ID exacto.' },
                        newStartTime: { type: 'STRING', description: 'Nueva fecha y hora de inicio para reprogramar el evento.' },
                        newEndTime: { type: 'STRING', description: 'Nueva fecha y hora de finalización al reprogramar (opcional).' },
                        newTitle: { type: 'STRING', description: 'Nuevo título del evento si se desea modificar.' }
                    },
                    required: ['action']
                }
            };

            const oneDriveDeclaration = {
                name: 'onedrive',
                description: 'Interactúa con Microsoft OneDrive: busca archivos/carpetas, lee documentos (Word, Excel, PDF) y escribe archivos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        action: { type: 'STRING', description: 'list_files_and_folders, read_document_content, create_folder, write_file' },
                        query: { type: 'STRING', description: 'Término de búsqueda o contenido a escribir.' },
                        fileId: { type: 'STRING', description: 'ID del archivo o carpeta en OneDrive.' },
                        fileName: { type: 'STRING', description: 'Nombre del archivo o carpeta.' },
                        parentId: { type: 'STRING', description: 'ID de la carpeta contenedora.' }
                    },
                    required: ['action']
                }
            };

            const webSearchDeclaration = {
                name: 'web_search',
                description: 'Busca información actualizada en tiempo real en Internet (noticias, normatividad SST, decretos, resoluciones de Mintrabajo, estadísticas oficiales, documentación técnica, etc.). Utiliza el motor de búsqueda avanzado de WAPPY.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        query: {
                            type: 'STRING',
                            description: 'La consulta de búsqueda a ejecutar en internet. Sé específico e incluye términos clave relevantes (ej: "Resolución 0312 de 2019 Colombia Mintrabajo").'
                        }
                    },
                    required: ['query']
                }
            };

            const editorRITDeclaration = {
                name: 'editor_rit',
                description: 'Editor especializado para el Reglamento Interno de Trabajo (RIT): cargar plantilla tradicional/humanista, leer y editar secciones.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'cargar_plantilla, leer, escribir, editar_seccion, buscar_reemplazar, insertar' },
                        tono: { type: 'STRING', description: 'tradicional o humanista' },
                        content: { type: 'STRING', description: 'Contenido HTML completo.' },
                        fileName: { type: 'STRING', description: 'Nombre descriptivo del documento.' },
                        titulo_seccion: { type: 'STRING', description: 'Título de la sección a editar.' },
                        nuevo_contenido_seccion: { type: 'STRING', description: 'Nuevo contenido de la sección.' },
                        buscar: { type: 'STRING', description: 'Texto a buscar.' },
                        reemplazar: { type: 'STRING', description: 'Texto de reemplazo.' }
                    },
                    required: ['accion']
                }
            };

            const analiticaPsicosocialDeclaration = {
                name: 'consultar_analitica_psicosocial',
                description: 'Consulta de forma anónima y consolidada los datos de estado de ánimo, clima laboral y factores de estrés de los trabajadores.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        dias: { type: 'NUMBER', description: 'Días de historial hacia atrás (por defecto 30).' },
                        departamento: { type: 'STRING', description: 'Área o departamento a filtrar.' }
                    }
                }
            };

            const analiticaActosCondicionesDeclaration = {
                name: 'consultar_analitica_actos_condiciones',
                description: 'Consulta estadísticas de actos y condiciones inseguras, áreas críticas y tendencias de seguridad en el buzón.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'obtener_analisis o marcar_procesado' },
                        reportId: { type: 'STRING', description: 'ID del reporte a marcar procesado.' },
                        dias: { type: 'NUMBER', description: 'Días de historial a analizar (por defecto 30).' }
                    }
                }
            };

            const wappyRetirarTrabajadorDeclaration = {
                name: 'wappy_retirar_trabajador',
                description: 'Marca a un trabajador o colaborador como RETIRADO en el SG-SST (Huella Biocéntrica / Perfil Sociodemográfico). Conserva todo su historial médico y ocupacional de 20 años según el Decreto 1072 de 2015, y traslada su ficha a la pestaña "Retirados". Invócala de inmediato cuando el usuario te pida retirar, desvincular o dar de baja a un empleado de la empresa.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        idOrCedula: { type: 'STRING', description: 'Cédula, ID o nombre del trabajador a retirar (ej: "80123456", "Jorge Ricky Pineda" o "Jorge Pineda").' },
                        nombre: { type: 'STRING', description: 'Nombre del trabajador si se conoce.' },
                        motivoRetiro: { type: 'STRING', description: 'Motivo del retiro (ej: "Renuncia voluntaria", "Terminación de contrato", "Salida de la empresa").' },
                        fechaRetiro: { type: 'STRING', description: 'Fecha de retiro en formato YYYY-MM-DD (opcional).' }
                    },
                    required: ['idOrCedula']
                }
            };

            const wappyReintegrarTrabajadorDeclaration = {
                name: 'wappy_reintegrar_trabajador',
                description: 'Reintegra, reactiva o vuelve a pasar a estado ACTIVO a un trabajador previamente retirado en el SG-SST (Huella Biocéntrica / Perfil Sociodemográfico), limpiando su fecha de retiro y actualizando su estado laboral a "Activo". Invócala de inmediato cuando el usuario te pida reintegrar, reactivar o volver a contratar a un colaborador.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        idOrCedula: { type: 'STRING', description: 'Cédula, ID o nombre del trabajador a reintegrar (ej: "80123456" o "Jorge Enrique Pineda").' },
                        nombre: { type: 'STRING', description: 'Nombre del trabajador si se conoce.' }
                    },
                    required: ['idOrCedula']
                }
            };

            const wappyActualizarTrabajadorDeclaration = {
                name: 'wappy_actualizar_trabajador',
                description: 'Actualiza los datos de un trabajador en el SG-SST (cargo, área, sede, salario, estado laboral "Activo" o "Retirado", EPS, AFP, teléfono, etc.).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        idOrCedula: { type: 'STRING', description: 'Cédula, ID o nombre del trabajador a actualizar.' },
                        nombre: { type: 'STRING', description: 'Nombre completo actualizado.' },
                        cargo: { type: 'STRING', description: 'Cargo u ocupación.' },
                        estadoLaboral: { type: 'STRING', description: '"Activo" o "Retirado".' },
                        motivoRetiro: { type: 'STRING', description: 'Motivo del retiro si aplica.' },
                        area: { type: 'STRING', description: 'Área de trabajo.' },
                        sede: { type: 'STRING', description: 'Sede.' }
                    },
                    required: ['idOrCedula']
                }
            };

            const wappyConsultarTrabajadoresDeclaration = {
                name: 'wappy_consultar_trabajadores',
                description: 'Consulta o busca colaboradores en el SG-SST de la empresa activa (Huella Biocéntrica). Permite buscar por nombre, cédula o filtrar por activos o retirados.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        filtro: { type: 'STRING', description: '"Activo", "Retirado", o "todos".' },
                        busqueda: { type: 'STRING', description: 'Nombre o cédula para buscar un colaborador específico.' }
                    }
                }
            };

            const wappyRegistrarTrabajadorDeclaration = {
                name: 'wappy_registrar_trabajador',
                description: 'Registra y da de alta a un nuevo colaborador en la nómina del SG-SST de la empresa.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        nombre: { type: 'STRING', description: 'Nombre completo del trabajador.' },
                        cedula: { type: 'STRING', description: 'Número de cédula o documento de identidad.' },
                        cargo: { type: 'STRING', description: 'Cargo u ocupación.' },
                        tipoContrato: { type: 'STRING', description: 'Tipo de contrato.' }
                    },
                    required: ['nombre', 'cedula', 'cargo']
                }
            };

            const wappyConsultarEmpresasDeclaration = {
                name: 'wappy_consultar_empresas',
                description: 'Consulta y lista todas las empresas que el usuario tiene registradas en WAPPY (hasta 3 empresas). Retorna el total de empresas, el nombre y NIT de cada una, la cantidad de trabajadores, cuál es la empresa activa actualmente y un resumen en texto.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        dummy: { type: 'STRING', description: 'Parámetro opcional' }
                    }
                }
            };

            const wappyResumenGeneral360Declaration = {
                name: 'wappy_resumen_general_360',
                description: 'Diagnóstico 360° integral de la empresa en WAPPY: consulta en tiempo real el estado general, cantidad de trabajadores, riesgos GTC-45 y PESV, cumplimiento de matriz legal, puntaje de estándares 0312, comités, EPP, inventario químico, flota vehicular, incidentes ATEL y tareas pendientes.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        dummy: { type: 'STRING', description: 'Parámetro opcional' }
                    }
                }
            };

            const wappyMcpSstDeclaration = {
                name: 'wappy_mcp_sst',
                description: 'Suite oficial de operaciones y consultas MCP de WAPPY. Permite consultar o ejecutar de forma autónoma: diagnóstico 360°, empresa, trabajadores, matriz GTC45, matriz PESV, matriz legal, estándares 0312, comités (COPASST, Convivencia, Brigadas), químicos SGA, vehículos, EPP, reportes de actos y condiciones, perfiles de cargo, casos ATEL, cronograma y tareas, capacitaciones, auditorías, creación/edición/eliminación de agentes de IA (wappy_crear_agente, wappy_actualizar_agente, wappy_eliminar_agente), automatizaciones y cualquier acción del usuario conectado (wappy_ejecutar_accion_usuario).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        herramienta: {
                            type: 'STRING',
                            description: 'Nombre de la herramienta MCP a ejecutar (ej: wappy_resumen_general_360, wappy_crear_agente, wappy_actualizar_agente, wappy_eliminar_agente, wappy_ejecutar_accion_usuario, wappy_consultar_matriz_gtc45, etc.).'
                        },
                        parametros: {
                            type: 'OBJECT',
                            description: 'Argumentos para la herramienta.'
                        }
                    },
                    required: ['herramienta']
                }
            };

            const wappyConsultarDetalleEmpresaDeclaration = {
                name: 'wappy_consultar_detalle_empresa',
                description: 'Consulta el perfil y detalle completo de cualquier empresa registrada del usuario (activa o inactiva) por su nombre, NIT o ID. Retorna razón social, NIT, tipo de empresa, representante legal, cédula, responsable SST, licencia, vigencia, sedes, ciudad, nivel de riesgo y ARL.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        empresa: { type: 'STRING', description: 'Nombre, NIT o ID de la empresa a consultar.' }
                    },
                    required: ['empresa']
                }
            };

            const wappyConsultarMarketplaceDeclaration = {
                name: 'wappy_consultar_marketplace',
                description: 'Consulta los productos, servicios, precios, ofertas y catálogo oficial de la tienda de WAPPY (Marketplace / Tienda SST). También permite consultar pedidos u órdenes de compra realizadas. Úsala siempre que el usuario pregunte por la tienda, qué venden, precios de productos, servicios, señalización, extintores, cursos, software o sus compras.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        busqueda: { type: 'STRING', description: 'Palabra clave o nombre del producto, servicio o categoría a buscar (ej: "extintores", "botiquin", "chalecos", "epp", "auditoria"). Opcional.' },
                        categoria: { type: 'STRING', description: 'Categoría de productos a filtrar si aplica.' },
                        consultarPedidos: { type: 'BOOLEAN', description: 'true si el usuario desea consultar sus pedidos u órdenes de compra realizadas en la tienda.' }
                    }
                }
            };

            const wappyConsultarCursosDeclaration = {
                name: 'wappy_consultar_cursos',
                description: 'Consulta y lista todos los cursos formativos disponibles en WAPPY Academia / LMS. Retorna los títulos, cantidad de lecciones de cada uno y descripción temática.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        busqueda: { type: 'STRING', description: 'Término de búsqueda opcional por tema o palabra clave.' }
                    }
                }
            };

            const wappyLeerCursoDeclaration = {
                name: 'wappy_leer_curso',
                description: 'Lee e inspecciona el contenido detallado de un curso de WAPPY Academia por su ID o título. Retorna todas sus lecciones con sus contenidos formativos, temario, recursos y exámenes.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        curso: { type: 'STRING', description: 'Título o ID del curso a leer e inspeccionar.' }
                    },
                    required: ['curso']
                }
            };

            const wappyConsultarBlogDeclaration = {
                name: 'wappy_consultar_blog',
                description: 'Consulta el catálogo de artículos y publicaciones técnicas en el Blog de WAPPY. Retorna el listado de publicaciones, títulos, etiquetas temáticas y resúmenes.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        busqueda: { type: 'STRING', description: 'Término de búsqueda opcional para filtrar artículos del blog.' }
                    }
                }
            };

            const wappyLeerArticuloBlogDeclaration = {
                name: 'wappy_leer_articulo_blog',
                description: 'Lee el contenido íntegro y exhaustivo de cualquier artículo del Blog de WAPPY por su ID o título. Retorna todo el texto, análisis técnico y recomendaciones del artículo.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        articulo: { type: 'STRING', description: 'Título o ID del artículo del blog a leer.' }
                    },
                    required: ['articulo']
                }
            };

            const wappyAbrirCursoDeclaration = {
                name: 'wappy_abrir_curso',
                description: 'Abre de inmediato en pantalla un curso específico de la Academia WAPPY LMS navegando a su vista interactiva (/training/:id/:slug). DEBES invocar esta herramienta INMEDIATAMENTE siempre que el usuario te pida abrir, ver, entrar o mostrar un curso formativo de la academia ("ábreme el de api key", "abre el curso de primeros auxilios", "quiero ver el curso de trabajo en alturas").',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        curso: { type: 'STRING', description: 'Título, palabra clave, tema o ID del curso a abrir en pantalla (ej: "API Key", "Primeros Auxilios", "Trabajo en Alturas").' }
                    },
                    required: ['curso']
                }
            };

            const wappyAbrirArticuloBlogDeclaration = {
                name: 'wappy_abrir_articulo_blog',
                description: 'Abre de inmediato en pantalla un artículo específico del Blog técnico de WAPPY navegando a su vista de lectura (/blog/:id/:slug). DEBES invocar esta herramienta cuando el usuario te pida abrir, leer o ver una publicación o artículo del blog.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        articulo: { type: 'STRING', description: 'Título, tema, palabra clave o ID del artículo del blog a abrir.' }
                    },
                    required: ['articulo']
                }
            };

            const wappyLeerInformeAplicativoDeclaration = {
                name: 'wappy_leer_informe_aplicativo',
                description: 'Lee e inspecciona el informe técnico oficial de cualquiera de los 20 aplicativos del SG-SST (Perfiles de Cargo, Matriz IPEVAR / GTC-45, Diagnóstico Res. 0312, Sociodemográfico y Salud, Vulnerabilidad y Emergencias, Ergonomía OWAS, Estudio de Puesto, ATS, Alturas, Matriz Legal, Comités COPASST, Capacitaciones, EPP, Actos y Condiciones, Investigación ATEL, PESV, Químicos SGA, Vehículos, Cronograma, Auditoría Anual). Si se trata de perfiles de cargo, consulta el catálogo completo de todos los cargos de la empresa y el informe del cargo seleccionado o solicitado.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        aplicativo: {
                            type: 'STRING',
                            description: "Nombre o clave del aplicativo: 'perfil_cargo', 'gtc45', 'diagnostico_0312', 'investigacion_atel', 'pesv', 'quimicos', 'auditoria', 'perfil_socio', 'vulnerabilidad', 'owas', 'estudio_puesto', 'ats', 'alturas', 'legal', 'comites', 'capacitaciones', 'epp', 'actos_condiciones', 'vehiculos', 'cronograma'."
                        },
                        cargo: {
                            type: 'STRING',
                            description: "Nombre puntual del cargo para consultar su perfil específico (ej: 'Conductor', 'Operario', 'Auxiliar contable', 'Gerente')."
                        },
                        id: {
                            type: 'STRING',
                            description: 'ID opcional del caso o registro a consultar.'
                        }
                    },
                    required: ['aplicativo']
                }
            };

            const wappyActivarHerramientaAgenteDeclaration = {
                name: 'wappy_activar_herramienta_agente',
                description: "Activa y ejecuta de inmediato cualquiera de las herramientas especializadas de los agentes de WAPPY ('canvas', 'matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'gestor_automatizaciones', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'editor_live', 'generar_imagen_sst'). Invócala cuando el usuario pida abrir o activar una herramienta de un agente.",
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        herramienta: {
                            type: 'STRING',
                            description: "Nombre de la herramienta especializada: 'canvas', 'matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'gestor_automatizaciones', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'editor_live', 'generar_imagen_sst'."
                        },
                        parametros: {
                            type: 'OBJECT',
                            description: 'Parámetros o argumentos específicos para la herramienta.',
                            properties: {
                                accion: { type: 'STRING', description: 'Acción a realizar en la herramienta' },
                                datos: { type: 'STRING', description: 'Datos, contenido o configuración' }
                            }
                        }
                    },
                    required: ['herramienta']
                }
            };

            const wappyCrearInformeDeclaration = {
                name: 'wappy_crear_informe',
                description: 'Crea y genera un informe técnico oficial del SG-SST (para cualquiera de los 20 aplicativos de WAPPY o dictámenes técnicos) y lo entrega directamente en el chat de Tenshi con botones de descarga (Word, Excel o HTML interactivo). INVÓCALA SIEMPRE que el usuario te pida crear, generar, redactar o entregar un informe.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        titulo: { type: 'STRING', description: 'Título formal del informe.' },
                        aplicativo: { type: 'STRING', description: 'Módulo o aplicativo: perfil_cargo, gtc45, diagnostico_0312, perfil_socio, vulnerabilidad, owas, estudio_puesto, ats, alturas, legal, comites, capacitaciones, epp, investigacion_atel, pesv, quimicos, vehiculos, cronograma, auditoria, general.' },
                        formato: { type: 'STRING', description: 'html, text o excel.' },
                        contenido: { type: 'STRING', description: 'Contenido exhaustivo y formal del informe en Markdown o HTML, citando normatividad colombiana (Dec. 1072, Res. 0312), hallazgos, indicadores y recomendaciones.' }
                    },
                    required: ['titulo', 'aplicativo']
                }
            };

            const wappyEnviarCorreoDeclaration = {
                name: 'wappy_enviar_correo',
                description: 'Redacta y envía un correo electrónico formal a cualquier destinatario utilizando Google Gmail (si está conectado) o el servidor oficial de WAPPY. Puedes enviar informes generados, recordatorios, citaciones a comités o comunicaciones de SST.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        destinatario: { type: 'STRING', description: 'Correo del destinatario (o "mi correo" para enviar al usuario).' },
                        asunto: { type: 'STRING', description: 'Asunto del correo.' },
                        mensaje: { type: 'STRING', description: 'Cuerpo del mensaje o informe (texto o HTML).' }
                    },
                    required: ['destinatario', 'asunto', 'mensaje']
                }
            };

            const wappyGestionarAgendaDeclaration = {
                name: 'wappy_gestionar_agenda',
                description: 'Gestiona la agenda, calendario y compromisos del SG-SST en Google Calendar y en el cronograma de WAPPY: agendar eventos, listar compromisos próximos, reprogramar/editar fechas de eventos y cancelar/eliminar compromisos.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'agendar_evento, listar_agenda, reprogramar_evento, actualizar_evento o eliminar_evento.' },
                        titulo: { type: 'STRING', description: 'Título del evento o compromiso (ej: "Inspección de Extintores").' },
                        fecha_inicio: { type: 'STRING', description: 'Fecha y hora de inicio (ISO o YYYY-MM-DD HH:mm con Hora Colombia).' },
                        fecha_fin: { type: 'STRING', description: 'Fecha y hora de finalización (opcional).' },
                        nueva_fecha: { type: 'STRING', description: 'Nueva fecha y hora para reprogramar el evento (ej: "2026-10-18T14:00:00").' },
                        nuevo_titulo: { type: 'STRING', description: 'Nuevo título si se modifica el evento.' },
                        descripcion: { type: 'STRING', description: 'Detalles del evento.' },
                        tipo: { type: 'STRING', description: 'manual, training, medical_exam, audit_finding, copasst_finding, other.' },
                        id_evento: { type: 'STRING', description: 'ID o palabra clave del evento para eliminar o reprogramar.' }
                    },
                    required: ['accion']
                }
            };

            const wappyGenerarQrDeclaration = {
                name: 'wappy_generar_qr',
                description: 'Genera códigos QR y enlaces interactivos para colaboradores (Reporte de Actos y Condiciones Inseguras, Termómetro Psicosocial / Ánimo, Estudio de Puesto, Matriz IPEVR, Inspección Vehicular PESV, Solicitud de EPP, etc.). Muestra el QR y enlace en el chat.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        tipo: {
                            type: 'STRING',
                            description: 'actos_condiciones, termometro_psicosocial, estudio_puesto, ipevar, perfil_salud, atel_testimonio, colaborador_hub, inspeccion_vehicular, solicitud_epp, copasst_inspecciones, votaciones, ruta_aprendizaje.'
                        }
                    },
                    required: ['tipo']
                }
            };

            const wappyAnaliticaPsicosocialDeclaration = {
                name: 'wappy_consultar_analitica_psicosocial',
                description: 'Consulta métricas y estadísticas de bienestar emocional y estrés de los colaboradores en el Termómetro Psicosocial (distribución de ánimo, principales factores de sobrecarga y recomendaciones SST).',
                parameters: {
                    type: 'OBJECT',
                    properties: {}
                }
            };

            const wappyAnaliticaActosDeclaration = {
                name: 'wappy_consultar_analitica_actos_condiciones',
                description: 'Consulta métricas y estadísticas del buzón de seguridad (desglose de actos vs condiciones inseguras, niveles de riesgo, sedes y áreas con mayor recurrencia).',
                parameters: {
                    type: 'OBJECT',
                    properties: {}
                }
            };

            const wappyConsultarQuimicoPubchemDeclaration = {
                name: 'wappy_consultar_quimico_pubchem',
                description: 'Consulta la API oficial de PubChem (NIH) para obtener el CID, clasificación oficial GHS / SGA, pictogramas de seguridad, palabras de advertencia (Peligro/Atención) y frases de peligro H y consejos P de cualquier sustancia o producto químico conforme al Decreto 1496 de 2018.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        nombre: {
                            type: 'STRING',
                            description: 'Nombre de la sustancia química en español o inglés (ej: benceno, xileno, cloro, acetona, acido sulfurico, thinner).'
                        }
                    },
                    required: ['nombre']
                }
            };

            const wappyGeocodificarEmergenciasDeclaration = {
                name: 'wappy_geocodificar_emergencias',
                description: 'Consulta la API de OpenStreetMap Nominatim para geolocalizar direcciones de sedes de la empresa y ubicar recursos externos de emergencia cercanos (hospitales, clínicas, estaciones de bomberos, defensa civil, centros de urgencias) para el Plan de Prevención y Preparación ante Emergencias.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        query: {
                            type: 'STRING',
                            description: 'Término de búsqueda o recurso a geolocalizar (ej: hospital Chapinero Bogota, bomberos Medellin).'
                        }
                    },
                    required: ['query']
                }
            };

            const wappyConsultarClimaVientoDeclaration = {
                name: 'wappy_consultar_clima_viento',
                description: 'Consulta la API de Open-Meteo para obtener en tiempo real la velocidad del viento, ráfagas, temperatura y pronóstico diario meteorológico para evaluar riesgos climáticos en trabajos en alturas (Resolución 4272 de 2021), espacios confinados y operaciones en campo.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        latitude: {
                            type: 'NUMBER',
                            description: 'Latitud geográfica (ej: 4.6097 para Bogotá).'
                        },
                        longitude: {
                            type: 'NUMBER',
                            description: 'Longitud geográfica (ej: -74.0817 para Bogotá).'
                        }
                    }
                }
            };

            const wappyDelegarOrdenAntigravityDeclaration = {
                name: 'wappy_delegar_orden_antigravity',
                description: 'Delega una orden de trabajo, investigación profunda o análisis de archivos locales a Google Antigravity en la computadora o entorno de trabajo del usuario. Se utiliza cuando el usuario pide a Tenshi que Antigravity investigue, revise carpetas locales de su computador o desarrolle entregables (Word, Excel, PDF, presentaciones, HTML) para luego reflejarlos en este chat de Tenshi.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        instruccion: {
                            type: 'STRING',
                            description: 'Instrucción o tarea detallada que Antigravity debe realizar (ej: "Analizar los informes de inspección de la carpeta X y redactar el balance consolidado").'
                        },
                        carpeta_o_recurso: {
                            type: 'STRING',
                            description: 'Ruta o nombre de la carpeta local en el computador del usuario o Google Drive que Antigravity debe inspeccionar (ej: "/Users/usuario/Inspecciones", "Carpeta SST").'
                        },
                        tipo_entregable: {
                            type: 'STRING',
                            description: "Tipo de respuesta o entregable esperado según lo que pidió el usuario: 'respuesta' (POR DEFECTO cuando el usuario solo hace una pregunta o consulta y NO pidió explícitamente crear un documento o archivo), 'documento' / 'word' (para documentos o informes en el Editor de Documentos de WAPPY / Canvas), 'html' (para aplicativos interactivos o dashboards), 'excel' o 'presentacion'."
                        },
                        titulo: {
                            type: 'STRING',
                            description: 'Título descriptivo de la orden de trabajo.'
                        },
                        archivos: {
                            type: 'ARRAY',
                            description: 'Lista de rutas, enlaces o nombres de archivos, imágenes, videos o documentos que se deben enviar a Antigravity para su procesamiento.',
                            items: {
                                type: 'STRING'
                            }
                        }
                    },
                    required: ['instruccion']
                }
            };

            const notebooklmListarCuadernosDeclaration = {
                name: "notebooklm_listar_cuadernos",
                description: "Consulta y lista todos los cuadernos vinculados en Google NotebookLM / Gemini Notebook del usuario. Úsala cuando el usuario pregunte qué cuadernos tiene o pida ver sus fuentes bibliográficas.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        dummy: { type: "STRING", description: "Filtro opcional" }
                    }
                }
            };

            const notebooklmConsultarDeclaration = {
                name: "notebooklm_consultar",
                description: "Realiza una consulta documental fundamentada (Grounded RAG) sobre los cuadernos y fuentes de Google NotebookLM del usuario. Devuelve respuestas directas fundamentadas en sus documentos y citas normativas.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        cuaderno: { type: "STRING", description: "Nombre o ID del cuaderno a consultar." },
                        pregunta: { type: "STRING", description: "Pregunta o consulta técnica detallada." }
                    },
                    required: ["cuaderno", "pregunta"]
                }
            };

            const notebooklmGenerarStudioDeclaration = {
                name: "notebooklm_generar_studio",
                description: "Genera artefactos de estudio o multimedia en Google NotebookLM: video explicativo ('video'), infografía ('infographic'), presentación de diapositivas ('slide_deck'), tabla de datos ('data_table'), podcast ('audio'), cuestionario ('quiz'), informe ('report'), fichas ('flashcards') o mapa conceptual ('mind_map').",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        cuaderno: { type: "STRING", description: "Nombre o ID del cuaderno." },
                        tipo_artefacto: { type: "STRING", description: "Tipo de contenido: video, infographic, slide_deck, data_table, audio, quiz, report, flashcards o mind_map." },
                        instrucciones: { type: "STRING", description: "Instrucciones de enfoque o temas prioritarios." }
                    },
                    required: ["cuaderno", "tipo_artefacto"]
                }
            };

            const googleFlowGenerarImagenDeclaration = {
                name: "google_flow_generar_imagen",
                description: "Genera imágenes fotorrealistas, afiches de seguridad, diagramas técnicos o ilustraciones 3D con Google Flow Studio (Google Imagen / Nano Banana) y las entrega directamente en el chat y en el Canvas de Tenshi.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        prompt: { type: "STRING", description: "Descripción visual detallada de la escena u objeto a generar." },
                        aspecto: { type: "STRING", description: "Relación de aspecto: '16:9', '9:16' o '1:1'." },
                        estilo: { type: "STRING", description: "Estilo visual: 'fotorrealista', '3d_render', 'ilustracion_tecnica' o 'afiche_seguridad'." }
                    },
                    required: ["prompt"]
                }
            };

            const googleFlowGenerarVideoDeclaration = {
                name: "google_flow_generar_video",
                description: "Genera un clip de video cinematográfico en MP4 con Google Flow Studio (Google Veo / Flow Camera) y lo entrega con reproductor de video directamente en el chat y en el Canvas de Tenshi.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        prompt: { type: "STRING", description: "Descripción cinematográfica detallada de la escena y acción del video." },
                        aspecto: { type: "STRING", description: "Relación de aspecto: '16:9' (horizontal) o '9:16' (vertical/Reel)." },
                        movimiento_camara: { type: "STRING", description: "Movimiento de cámara: 'zoom_in', 'zoom_out', 'orbit', 'pan_right' o 'pan_left'." }
                    },
                    required: ["prompt"]
                }
            };

            const wappyIniciarEstudioErgonomicoVivoDeclaration = {
                name: 'wappy_iniciar_estudio_ergonomico_vivo',
                description: 'Inicia y abre de inmediato el Análisis Biomecánico y Estudio de Puesto de Trabajo Ergonómico EN VIVO por cámara y voz con la Fisioterapeuta Laboral (con exoesqueleto MediaPipe 3D, protocolo de 3 fases, matriz CIE-11 y 12 ejercicios de pausas activas ExerciseDB). INVÓCALA SIEMPRE que el usuario diga que necesita, quiere o desea realizar un estudio de puesto de trabajo ergonómico o evaluación ergonómica.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        trabajador: {
                            type: 'STRING',
                            description: 'Nombre del trabajador a evaluar si el usuario lo mencionó (opcional).'
                        },
                        cargo: {
                            type: 'STRING',
                            description: 'Cargo o puesto de trabajo a evaluar si el usuario lo mencionó (opcional).'
                        }
                    }
                }
            };

            const wappyConsultarRehabilitacionMedlinePlusDeclaration = {
                name: 'wappy_consultar_rehabilitacion_medlineplus',
                description: 'Consulta guías oficiales de salud ocupacional en español de MedlinePlus Connect (NIH de EE. UU.) y prescribe pausas activas osteomusculares y ejercicios de Fisioterapia laboral según el segmento anatómico o código CIE-10 (ej: M54.2 cuello, G56.0 túnel carpiano, M54.5 espalda lumbar, M75.1 hombro).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        codigo: { type: 'STRING', description: 'Código CIE-10 de la patología (ej: M54.2, G56.0, M54.5, M75.1).' },
                        segmento: { type: 'STRING', description: 'Segmento anatómico: cervical, lumbar, muñeca, hombro, codo o ocular.' }
                    }
                }
            };

            const wappyControlarVideollamadaDeclaration = {
                name: 'wappy_controlar_videollamada',
                description: 'Controla la cámara, la videollamada o cuelga la llamada de Tenshi. DEBES invocar esta herramienta cuando el usuario te diga: activa videollamada, activa video, enciende la cámara, activa la cámara, apaga la cámara, desactiva video, cuelga, colgar o terminar llamada.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: {
                            type: 'STRING',
                            description: 'Acción a ejecutar: activar_camara, apagar_camara o colgar_llamada.'
                        }
                    },
                    required: ['accion']
                }
            };

            const wappyImportarSociodemograficoDriveDeclaration = {
                name: 'wappy_importar_sociodemografico_drive',
                description: 'Busca en Google Drive del usuario (dentro de la carpeta indicada o en todo el Drive) el archivo del Perfil Sociodemográfico y/o Condiciones de Salud, extrae todos los trabajadores usando el modelo de texto gemini-3.5-flash-lite (respaldo gemini-3.6-flash) y alimenta masivamente tanto el Perfil Sociodemográfico como las Condiciones de Salud en Somos SST.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        carpeta: {
                            type: 'STRING',
                            description: 'Nombre de la carpeta en Google Drive donde está el perfil sociodemográfico (ej: "SST", "Talento Humano", "Nomina", etc.). Dejar vacío si está en la raíz.'
                        },
                        archivo: {
                            type: 'STRING',
                            description: 'Nombre aproximado del archivo a buscar dentro de la carpeta (opcional, ej: "perfil sociodemografico", "condiciones de salud").'
                        },
                        fileId: {
                            type: 'STRING',
                            description: 'ID exacto del archivo en Google Drive si ya se conoce (opcional).'
                        },
                        texto_extraido: {
                            type: 'STRING',
                            description: 'Texto o contenido ya extraído previamente si ya se leyó el archivo (opcional).'
                        }
                    }
                }
            };

            const wappyImportarHito1DriveDeclaration = {
                name: 'wappy_importar_hito1_drive',
                description: 'Busca en el Google Drive del usuario los archivos de los aplicativos del Hito 1 (Matriz IPEVR GTC-45, Matriz de Riesgos Viales PESV, Matriz de Compatibilidad Química SGA, Análisis de Vulnerabilidad/Diamante de Emergencias, Diagnóstico Inicial 0312 o Asignación del Responsable SST), extrae y normaliza los datos con gemini-3.5-flash-lite (y respaldo gemini-3.6-flash) y alimenta automáticamente los aplicativos oficiales en Somos SST.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        aplicativo: {
                            type: 'STRING',
                            description: "Aplicativo a alimentar: 'gtc45', 'pesv', 'compatibilidad', 'vulnerabilidad', 'diagnostico', 'responsable' o 'auto'."
                        },
                        carpeta: {
                            type: 'STRING',
                            description: 'Nombre de la carpeta en Google Drive donde están los archivos del SG-SST (opcional).'
                        },
                        archivo: {
                            type: 'STRING',
                            description: 'Nombre aproximado del archivo en Google Drive (opcional).'
                        },
                        fileId: {
                            type: 'STRING',
                            description: 'ID exacto del archivo en Google Drive si ya se conoce (opcional).'
                        }
                    }
                }
            };

            const wappyMemoriaProcedimentalDeclaration = {
                name: 'wappy_memoria_procedimental',
                description: 'Gestiona la Memoria Procedural y de Hábitos Operativos de la empresa (estilo OpenBot). Permite guardar, listar o eliminar costumbres, flujos de aprobación, criterios técnicos o reglas operativas específicas de la organización para aplicarlas automáticamente en sesiones futuras.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: {
                            type: 'STRING',
                            description: "Acción a realizar: 'guardar', 'listar' o 'eliminar'."
                        },
                        trigger: {
                            type: 'STRING',
                            description: "Situación o disparador en que aplica el hábito (ej: 'Al cerrar investigación ATEL', 'En informes mensuales', 'Al registrar químicos')."
                        },
                        regla: {
                            type: 'STRING',
                            description: "Regla operativa o hábito a cumplir (ej: 'Notificar siempre primero a la Dra. María antes de archivar')."
                        },
                        categoria: {
                            type: 'STRING',
                            description: "Categoría: 'habito_operativo', 'flujo_aprobacion', 'notificacion', 'criterio_tecnico' o 'preferencia_formato'."
                        },
                        id: {
                            type: 'STRING',
                            description: "ID o palabra clave del hábito a eliminar cuando accion='eliminar'."
                        }
                    },
                    required: ['accion']
                }
            };

            const wappyRenderizarWidgetDeclaration = {
                name: 'wappy_renderizar_widget_interactivo',
                description: 'Generative UI (AG-UI): Proyecta y renderiza una tarjeta o widget interactivo directamente en el chat del usuario (ej: Simulador/Calculadora de Riesgo GTC-45 NDxNExNC con sliders en vivo, o Checklist Interactivo de Inspección SST). Úsala cuando el usuario pida una calculadora interactiva en el chat, simular el nivel de riesgo GTC-45 o una lista de chequeo interactiva.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        tipo_widget: {
                            type: 'STRING',
                            description: "Tipo de widget interactivo: 'risk_calculator' (Simulador GTC-45 NDxNExNC) o 'inspection_checklist' (Lista de verificación interactiva)."
                        },
                        titulo: {
                            type: 'STRING',
                            description: 'Título del widget interactivo.'
                        },
                        subtitulo: {
                            type: 'STRING',
                            description: 'Subtítulo o contexto normativo.'
                        },
                        peligro: {
                            type: 'STRING',
                            description: 'Descripción del peligro a simular (para risk_calculator).'
                        },
                        proceso: {
                            type: 'STRING',
                            description: 'Proceso o cargo evaluado.'
                        },
                        nd: {
                            type: 'NUMBER',
                            description: 'Nivel de Deficiencia inicial (0, 2, 6 o 10).'
                        },
                        ne: {
                            type: 'NUMBER',
                            description: 'Nivel de Exposición inicial (1, 2, 3 o 4).'
                        },
                        nc: {
                            type: 'NUMBER',
                            description: 'Nivel de Consecuencia inicial (10, 25, 60 o 100).'
                        },
                        items: {
                            type: 'ARRAY',
                            items: { type: 'STRING' },
                            description: 'Ítems de verificación para inspection_checklist.'
                        }
                    },
                    required: ['tipo_widget']
                }
            };

            // Assemble base tools and dynamically triggered tools (strictly excluding Group 7)
            const baseFunctionDeclarations = [
                wappyNavegarDeclaration,
                wappyControlarVideollamadaDeclaration,
                wappyIniciarEstudioErgonomicoVivoDeclaration,
                wappyConsultarRehabilitacionMedlinePlusDeclaration,
                somosSSTDeclaration,
                wappyCrearInformeDeclaration,
                wappyGenerarQrDeclaration,
                wappyAnaliticaPsicosocialDeclaration,
                wappyAnaliticaActosDeclaration,
                wappyConsultarQuimicoPubchemDeclaration,
                wappyGeocodificarEmergenciasDeclaration,
                wappyConsultarClimaVientoDeclaration,
                wappyDelegarOrdenAntigravityDeclaration,
                notebooklmListarCuadernosDeclaration,
                notebooklmConsultarDeclaration,
                notebooklmGenerarStudioDeclaration,
                googleFlowGenerarImagenDeclaration,
                googleFlowGenerarVideoDeclaration,
                wappyEnviarCorreoDeclaration,
                wappyGestionarAgendaDeclaration,
                googleCalendarDeclaration,
                googleGmailDeclaration,
                googleDriveDeclaration,
                googleSheetsDeclaration,
                googleDocsDeclaration,
                googleSlidesDeclaration,
                oneDriveDeclaration,
                wappyRetirarTrabajadorDeclaration,
                wappyReintegrarTrabajadorDeclaration,
                wappyActualizarTrabajadorDeclaration,
                wappyConsultarTrabajadoresDeclaration,
                wappyRegistrarTrabajadorDeclaration,
                wappyImportarSociodemograficoDriveDeclaration,
                wappyImportarHito1DriveDeclaration,
                wappyConsultarEmpresasDeclaration,
                wappyConsultarDetalleEmpresaDeclaration,
                wappyConsultarMarketplaceDeclaration,
                wappyConsultarCursosDeclaration,
                wappyAbrirCursoDeclaration,
                wappyLeerCursoDeclaration,
                wappyConsultarBlogDeclaration,
                wappyAbrirArticuloBlogDeclaration,
                wappyLeerArticuloBlogDeclaration,
                wappyResumenGeneral360Declaration,
                wappyMcpSstDeclaration,
                wappyLeerInformeAplicativoDeclaration,
                wappyActivarHerramientaAgenteDeclaration,
                consultarAgenteDeclaration,
                wappyAbrirChatAgenteDeclaration,
                wappyBuscarHistorialDeclaration,
                canvasDeclaration,
                operarGUIDeclaration,
                diligenciarFormularioDeclaration,
                seleccionarEmpresaDeclaration,
                wappyActivarEmpresaDeclaration,
                wappyActualizarEmpresaDeclaration,
                gestionarMemoriaDeclaration,
                wappyMemoriaProcedimentalDeclaration,
                wappyRenderizarWidgetDeclaration,
                leerPantallaDeclaration
            ];

            const dynamicToolsMap = {
                matriz_ipevar: matrizIPEVARDeclaration,
                matriz_pesv: matrizPESVDeclaration,
                matriz_compatibilidad: matrizCompatibilidadDeclaration,
                gestor_automatizaciones: gestorAutomatizacionesDeclaration,
                google_sheets: googleSheetsDeclaration,
                google_docs: googleDocsDeclaration,
                google_slides: googleSlidesDeclaration,
                google_gmail: googleGmailDeclaration,
                google_calendar: googleCalendarDeclaration,
                onedrive: oneDriveDeclaration,
                one_drive: oneDriveDeclaration,
                web_search: webSearchDeclaration,
                editor_rit: editorRITDeclaration,
                consultar_analitica_psicosocial: analiticaPsicosocialDeclaration,
                consultar_analitica_actos_condiciones: analiticaActosCondicionesDeclaration,
            };

            const lastMsgObj = messages[messages.length - 1];
            const lastUserMsg = lastMsgObj?.content || 'Hola';
            const lastUserLower = String(lastUserMsg || '').toLowerCase();
            const isGuiResultTurn = String(lastUserMsg || '').trim().startsWith('[RESULTADO_GUI]');
            const isInlineWidgetIntent =
                !isGuiResultTurn &&
                (((lastUserLower.includes('calculadora') || lastUserLower.includes('simulador')) &&
                    (lastUserLower.includes('gtc') || lastUserLower.includes('riesgo') || lastUserLower.includes('deficiencia') || lastUserLower.includes('peligro'))) ||
                lastUserLower.includes('checklist interactivo') ||
                lastUserLower.includes('lista de chequeo interactiva'));
            const isWorkerListIntent =
                !isGuiResultTurn &&
                (/\b(lista|listado|censo|nomina|nómina|ver|mostrar|muestrame|muéstrame|dame|cuales\s+son|cuáles\s+son|quienes\s+son|quiénes\s+son|consultar|consulta)\b[\s\S]{0,40}\b(trabajadores|colaboradores|empleados|personal)\b/i.test(lastUserLower) ||
                /\b(trabajadores|colaboradores|empleados)\b[\s\S]{0,30}\b(activos|retirados|registrados|lista|censo|todos|empresa)\b/i.test(lastUserLower));

            let toolsToAttach = [...baseFunctionDeclarations];
            if (isInlineWidgetIntent && !lastUserLower.includes('canvas') && !lastUserLower.includes('lienzo')) {
                // Evitar que Gemini gaste 15s generando HTML en canvas_tool cuando el usuario pide el widget nativo en el chat
                toolsToAttach = toolsToAttach.filter(t => t.name !== 'canvas_tool');
            }
            for (const toolName of activeTools) {
                const decl = dynamicToolsMap[toolName];
                if (decl && !toolsToAttach.some(d => d.name === decl.name)) {
                    toolsToAttach.push(decl);
                }
            }
            logger.info(`[Tenshi Backend] Herramientas adjuntas a Gemini (${toolsToAttach.length}): ${toolsToAttach.map(t => t.name).join(', ')}`);

            // Rotation loop: outer = models, inner = api keys
            let lastError = null;
            let succeeded = false;
            const mediaObj = lastMsgObj?.media;
            const mediaDataUrl = lastMsgObj?.image || mediaObj?.dataUrl;
            let extractedFileText = '';
            if (mediaObj || mediaDataUrl) {
                try {
                    extractedFileText = await extractTextFromMedia(mediaObj || { dataUrl: mediaDataUrl });
                } catch (errExt) {
                    logger.warn('[Tenshi Backend] Error extracting text from media:', errExt.message);
                }
            }

            for (let mi = 0; mi < modelFallbacks.length && !succeeded; mi++) {
                const currentModel = modelFallbacks[mi];
                for (let i = 0; i < apiKeys.length; i++) {
                    const apiKey = apiKeys[i];
                    try {
                        logger.debug(`[Tenshi] Trying Key ${i + 1}/${apiKeys.length} with model "${currentModel}"`);
                        const genAI = new GoogleGenerativeAI(apiKey);

                        const geminiModel = genAI.getGenerativeModel({
                            model: currentModel,
                            systemInstruction: systemMessage,
                            tools: [{ functionDeclarations: toolsToAttach }],
                            generationConfig: { temperature: 0.7, maxOutputTokens: 65536 }
                        });

                        const userParts = [{ text: lastUserMsg }];

                        if (mediaDataUrl && typeof mediaDataUrl === 'string') {
                            const rawMatch = mediaDataUrl.match(/^data:([a-zA-Z0-9.+_-]+\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
                            if (rawMatch) {
                                const mimeType = rawMatch[1];
                                const base64Data = rawMatch[2];
                                if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/') || mimeType === 'application/pdf') {
                                    userParts.push({
                                        inlineData: {
                                            mimeType,
                                            data: base64Data
                                        }
                                    });
                                    logger.info(`[Tenshi Backend] Injected inlineData (${mimeType}) from ${mediaObj?.name || 'media'} into Gemini user turn`);
                                }
                            } else if (mediaDataUrl.length > 50) {
                                userParts.push({
                                    inlineData: {
                                        mimeType: 'image/jpeg',
                                        data: mediaDataUrl.replace(/^data:[^;]+;base64,/, '')
                                    }
                                });
                                logger.info(`[Tenshi Backend] Injected inlineData raw base64 media into Gemini user turn`);
                            }
                        }

                        if (extractedFileText && extractedFileText.trim()) {
                            const maxLen = 45000;
                            const truncated = extractedFileText.length > maxLen
                                ? extractedFileText.substring(0, maxLen) + '\n... [Contenido truncado por longitud]'
                                : extractedFileText;
                            userParts.push({
                                text: `\n\n📄 [CONTENIDO DEL ARCHIVO ADJUNTO "${mediaObj?.name || 'documento'}"]:\n\`\`\`\n${truncated}\n\`\`\`\n`
                            });
                            logger.info(`[Tenshi Backend] Injected ${truncated.length} chars of extracted text from ${mediaObj?.name || 'media'} into Gemini prompt`);
                        }

                        logger.info(`[Tenshi Backend] Sending request to Gemini (${currentModel}) with message: "${lastUserMsg}", parts count: ${userParts.length}`);

                        let currentContents = [
                            ...history,
                            { role: 'user', parts: userParts }
                        ];

                        let responseResult = await geminiModel.generateContent({ contents: currentContents });
                        let candidate = responseResult.response.candidates && responseResult.response.candidates[0];
                        let calls = responseResult.response.functionCalls();
                        logger.info(`[Tenshi Backend] Gemini initial response function calls: ${JSON.stringify(calls)}`);
                        let loops = 0;
                        requestedGuiAction = null;
                        requestedGuiActions = null;

                        while (calls && calls.length > 0 && loops < 7) {
                            loops++;
                            const call = calls[0];
                            logger.info(`[Tenshi Tool Call] Executing ${call.name} with args:`, call.args);
                            let toolOutput = '';

                            try {
                                if (call.name === 'somos_sst') {
                                    const toolInstance = new SomosSST({ req });
                                    toolOutput = await toolInstance._call(call.args);
                                } else if (call.name === 'google_drive') {
                                    const toolInstance = new GoogleDrive({ req });
                                    toolOutput = await toolInstance._call(call.args);
                                } else if (call.name === 'consultar_agente_especializado') {
                                    const toolInstance = new ConsultarAgenteEspecializado({ req });
                                    toolOutput = await toolInstance._call(call.args);
                                } else if (call.name === 'canvas_tool' || call.name === 'canvas') {
                                    const tempCanvasConvoId = req.body?.conversationId && req.body.conversationId !== 'new'
                                        ? req.body.conversationId
                                        : `tenshi-canvas-${targetUserId}-${Date.now()}`;
                                    if (!req.body) req.body = {};
                                    req.body.conversationId = tempCanvasConvoId;
                                    const toolInstance = new CanvasTool({ req });
                                    toolOutput = await toolInstance._call(call.args);
                                    try {
                                        const parsed = typeof toolOutput === 'string' ? JSON.parse(toolOutput) : toolOutput;
                                        if (parsed?.success) {
                                            const sessionDoc = await CanvasSession.findOne({ conversationId: tempCanvasConvoId }).lean();
                                            const fileType = sessionDoc?.fileType || call.args?.fileType || 'html';
                                            const title = sessionDoc?.title || call.args?.title || 'Documento SG-SST';
                                            const content = sessionDoc?.content ?? call.args?.content ?? '';
                                            capturedFile = {
                                                title,
                                                fileType,
                                                content: typeof content === 'string' ? content : JSON.stringify(content),
                                                rawContent: content,
                                                canvasId: tempCanvasConvoId
                                            };
                                            if (fileType === 'html' || (typeof content === 'string' && (content.includes('<html') || content.includes('<!DOCTYPE')))) {
                                                capturedHtmlReport = content;
                                            }
                                        }
                                    } catch (_) {}
                                } else if (call.name === 'matriz_ipevar') {
                                    if (call.args?.accion === 'escribir' && Array.isArray(call.args?.riesgos) && call.args.riesgos.length > 0) {
                                        const savedRes = await saveRisksToHito1Matrices(targetUserId, companyInfo, call.args.riesgos);
                                        toolOutput = JSON.stringify(savedRes);
                                    } else if (call.args?.accion === 'leer') {
                                        const gtcRes = await executeTenshiMcpTool('wappy_consultar_matriz_gtc45', call.args || {}, targetUserId);
                                        toolOutput = JSON.stringify(gtcRes);
                                    } else {
                                        const MatrizIPEVAR = require('../../app/clients/tools/structured/MatrizIPEVAR');
                                        toolOutput = await new MatrizIPEVAR({ req })._call(call.args);
                                    }
                                } else if (call.name === 'matriz_pesv') {
                                    const MatrizPESV = require('../../app/clients/tools/structured/MatrizPESV');
                                    toolOutput = await new MatrizPESV({ req })._call(call.args);
                                } else if (call.name === 'matriz_compatibilidad') {
                                    const MatrizCompatibilidad = require('../../app/clients/tools/structured/MatrizCompatibilidad');
                                    toolOutput = await new MatrizCompatibilidad({ req })._call(call.args);
                                } else if (call.name === 'gestor_automatizaciones') {
                                    const GestorAutomatizaciones = require('../../app/clients/tools/structured/GestorAutomatizaciones');
                                    toolOutput = await new GestorAutomatizaciones({ req })._call(call.args);
                                } else if (call.name === 'google_sheets') {
                                    const GoogleSheetsTool = require('../../app/clients/tools/structured/GoogleSheets');
                                    toolOutput = await new GoogleSheetsTool({ req })._call(call.args);
                                } else if (call.name === 'google_docs') {
                                    const GoogleDocsTool = require('../../app/clients/tools/structured/GoogleDocs');
                                    toolOutput = await new GoogleDocsTool({ req })._call(call.args);
                                } else if (call.name === 'google_slides') {
                                    const GoogleSlidesTool = require('../../app/clients/tools/structured/GoogleSlides');
                                    toolOutput = await new GoogleSlidesTool({ req })._call(call.args);
                                } else if (call.name === 'google_gmail') {
                                    const GoogleGmailTool = require('../../app/clients/tools/structured/GoogleGmail');
                                    toolOutput = await new GoogleGmailTool({ req })._call(call.args);
                                } else if (call.name === 'google_calendar') {
                                    const GoogleCalendarTool = require('../../app/clients/tools/structured/GoogleCalendar');
                                    toolOutput = await new GoogleCalendarTool({ req })._call(call.args);
                                } else if (call.name === 'onedrive' || call.name === 'one_drive') {
                                    const OneDriveTool = require('../../app/clients/tools/structured/OneDrive');
                                    toolOutput = await new OneDriveTool({ req })._call(call.args);
                                } else if (call.name === 'web_search') {
                                    const WebSearchTool = require('../../app/clients/tools/structured/WebSearch');
                                    toolOutput = await new WebSearchTool({ req })._call(call.args);
                                } else if (call.name === 'editor_rit') {
                                    const EditorRIT = require('../../app/clients/tools/structured/EditorRIT');
                                    toolOutput = await new EditorRIT({ req })._call(call.args);
                                } else if (call.name === 'consultar_analitica_psicosocial' || call.name === 'wappy_consultar_analitica_psicosocial') {
                                    const res = await executeTenshiMcpTool('wappy_consultar_analitica_psicosocial', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'consultar_analitica_actos_condiciones' || call.name === 'wappy_consultar_analitica_actos_condiciones') {
                                    const res = await executeTenshiMcpTool('wappy_consultar_analitica_actos_condiciones', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_crear_informe' || call.name === 'wappy_generar_informe') {
                                    const res = await executeTenshiMcpTool('wappy_crear_informe', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                    if (res?.informe?.contenido) {
                                        if (res.informe.formato === 'html' || res.informe.contenido.includes('<html') || res.informe.contenido.includes('<!DOCTYPE')) {
                                            capturedHtmlReport = res.informe.contenido;
                                        }
                                    }
                                } else if (call.name === 'wappy_generar_qr' || call.name === 'generar_qr') {
                                    const res = await executeTenshiMcpTool('wappy_generar_qr', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                    if (res && res.exito) {
                                        capturedQrCode = res;
                                    }
                                } else if (call.name === 'wappy_enviar_correo' || call.name === 'enviar_correo') {
                                    const res = await executeTenshiMcpTool('wappy_enviar_correo', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_gestionar_agenda' || call.name === 'wappy_listar_agenda') {
                                    const res = await executeTenshiMcpTool('wappy_gestionar_agenda', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'seleccionar_empresa' || call.name === 'wappy_seleccionar_empresa' || call.name === 'wappy_activar_empresa') {
                                    const term = call.args?.nombre_o_id || call.args?.empresa || call.args?.nombre || call.args?.id || call.args?.companyId || call.args?.target;
                                    let query = { user: targetUserId };
                                    if (mongoose.isValidObjectId(term)) {
                                        query._id = term;
                                    } else {
                                        const safeRegex = new RegExp(String(term || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                                        query.$or = [
                                            { companyName: safeRegex },
                                            { nit: term }
                                        ];
                                    }
                                    const found = await CompanyInfo.findOne(query);
                                    if (found) {
                                        await CompanyInfo.updateMany({ user: targetUserId }, { isActive: false });
                                        found.isActive = true;
                                        await found.save();
                                        await syncCompanyMemory(targetUserId, found);
                                        toolOutput = JSON.stringify({ success: true, message: `Empresa "${found.companyName}" activada y sincronizada exitosamente con la memoria.`, empresa: found, companyData: found });
                                    } else {
                                        toolOutput = JSON.stringify({ success: false, error: `No se encontró ninguna empresa que coincida con "${term}".` });
                                    }
                                } else if (call.name === 'wappy_actualizar_empresa' || call.name === 'wappy_actualizar_perfil_empresa' || call.name === 'actualizar_empresa') {
                                    const term = call.args?.empresa || call.args?.nombre_o_id || call.args?.id || call.args?.companyId;
                                    let company = null;
                                    if (term) {
                                        if (mongoose.isValidObjectId(term)) {
                                            company = await CompanyInfo.findOne({ user: targetUserId, _id: term });
                                        }
                                        if (!company) {
                                            const safeRegex = new RegExp(String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                                            company = await CompanyInfo.findOne({
                                                user: targetUserId,
                                                $or: [{ companyName: safeRegex }, { nit: term }]
                                            });
                                        }
                                    }
                                    if (!company) {
                                        company = await CompanyInfo.findOne({ user: targetUserId, isActive: true });
                                    }
                                    if (!company) {
                                        company = await CompanyInfo.findOne({ user: targetUserId });
                                    }
                                    if (!company) {
                                        toolOutput = JSON.stringify({ success: false, error: 'No se encontró ninguna empresa para actualizar.' });
                                    } else {
                                        const updateFields = [
                                            'companyName', 'companyType', 'nit', 'legalRepresentative', 'legalRepresentativeId',
                                            'workerCount', 'arl', 'economicActivity', 'riskLevel', 'ciiu', 'address',
                                            'city', 'departamento', 'phone', 'email', 'generalActivities', 'sector',
                                            'responsibleSST', 'responsibleSSTPhone', 'formationLevel', 'licenseNumber',
                                            'courseStatus', 'licenseExpiry', 'sedes'
                                        ];
                                        for (const f of updateFields) {
                                            if (call.args[f] !== undefined && call.args[f] !== null) {
                                                company[f] = call.args[f];
                                            }
                                        }
                                        await company.save();
                                        if (company.isActive) {
                                            await syncCompanyMemory(targetUserId, company);
                                        }
                                        toolOutput = JSON.stringify({
                                            success: true,
                                            mensaje: `Empresa "${company.companyName}" actualizada exitosamente.`,
                                            empresa: company,
                                            companyData: company
                                        });
                                    }
                                } else if (call.name === 'gestionar_memoria') {
                                    const accion = call.args?.accion || 'consultar';
                                    const clave = call.args?.clave;
                                    const valor = call.args?.valor;
                                    if (accion === 'guardar' && clave && valor) {
                                        const tokenCount = Tokenizer.getTokenCount(valor, 'o200k_base') || 0;
                                        await setMemory({ userId: targetUserId, agentId: 'global', key: clave, value: valor, tokenCount });
                                        toolOutput = JSON.stringify({ success: true, message: `Dato guardado exitosamente en la memoria bajo la clave "${clave}".` });
                                    } else if (accion === 'eliminar' && clave) {
                                        await deleteMemory({ userId: targetUserId, agentId: 'global', key: clave });
                                        toolOutput = JSON.stringify({ success: true, message: `Memoria "${clave}" eliminada con éxito.` });
                                    } else {
                                        const rawMems = await getAllUserMemories(targetUserId);
                                        const unique = new Map();
                                        (rawMems || []).forEach(m => { if (m.key && !unique.has(m.key)) unique.set(m.key, m.value); });
                                        const list = Array.from(unique.entries()).map(([k, v]) => `[${k}]: ${v}`).join('\n\n');
                                        toolOutput = JSON.stringify({ success: true, memorias: list || 'No hay memorias registradas aún.' });
                                    }
                                } else if (call.name === 'leer_pantalla') {
                                    if (browserState && browserState.length > 30) {
                                        toolOutput = JSON.stringify({ success: true, contenido_pantalla: browserState });
                                    } else {
                                        toolOutput = JSON.stringify({ success: true, message: 'La pantalla actual no contiene texto o elementos adicionales visibles.' });
                                    }
                                } else if (call.name === 'wappy_diligenciar_formulario') {
                                    requestedGuiAction = {
                                        name: 'wappy_diligenciar_formulario',
                                        args: call.args
                                    };
                                    break;
                                } else if (call.name === 'wappy_navegar') {
                                    requestedGuiAction = {
                                        name: 'wappy_navegar',
                                        accion: 'navegar',
                                        modulo: call.args?.modulo,
                                        ruta: call.args?.ruta,
                                        args: call.args
                                    };
                                    break;
                                } else if (call.name === 'wappy_abrir_curso') {
                                    const query = call.args?.curso || call.args?.course || call.args?.id || call.args?.titulo || '';
                                    const course = await findMatchingCourse(query);
                                    let targetRoute = '/academia?tab=cursos';
                                    let courseTitle = query;
                                    if (course) {
                                        courseTitle = course.title;
                                        targetRoute = `/training/${course._id}/${sanitizeSlug(course.title)}`;
                                    }
                                    const courseMsg = course
                                        ? `¡De una! Abriendo el curso **${courseTitle}** en pantalla.`
                                        : '¡De una! Abriendo el catálogo de cursos de **WAPPY Academia** en pantalla.';
                                    requestedGuiAction = {
                                        name: 'wappy_navegar',
                                        accion: 'navegar',
                                        modulo: 'training',
                                        ruta: targetRoute,
                                        args: { ruta: targetRoute, modulo: 'training' },
                                        message: courseMsg,
                                    };
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        message: course ? `Abriendo curso "${courseTitle}" en pantalla: ${targetRoute}` : 'Abriendo catálogo de cursos de WAPPY Academia.'
                                    });
                                    break;
                                } else if (call.name === 'wappy_abrir_articulo_blog') {
                                    const query = call.args?.articulo || call.args?.slug || call.args?.id || call.args?.titulo || '';
                                    const post = await findMatchingBlogPost(query);
                                    let targetRoute = '/academia?tab=blog';
                                    let postTitle = query;
                                    if (post) {
                                        postTitle = post.title;
                                        targetRoute = `/blog/${post._id}/${sanitizeSlug(post.title)}`;
                                    }
                                    const blogMsg = post
                                        ? `¡De una! Abriendo el artículo **${postTitle}** en pantalla.`
                                        : '¡De una! Abriendo el **Blog de WAPPY** en pantalla.';
                                    requestedGuiAction = {
                                        name: 'wappy_navegar',
                                        accion: 'navegar',
                                        modulo: 'blog',
                                        ruta: targetRoute,
                                        args: { ruta: targetRoute, modulo: 'blog' },
                                        message: blogMsg,
                                    };
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        message: post ? `Abriendo artículo "${postTitle}" en pantalla: ${targetRoute}` : 'Abriendo Blog de WAPPY.'
                                    });
                                    break;
                                } else if (call.name === 'wappy_iniciar_estudio_ergonomico_vivo') {
                                    requestedGuiAction = {
                                        name: 'wappy_iniciar_estudio_ergonomico_vivo',
                                        accion: 'iniciar_estudio_ergonomico_vivo',
                                        args: call.args || {}
                                    };
                                    break;
                                } else if (call.name === 'wappy_abrir_chat_agente') {
                                    requestedGuiAction = {
                                        name: 'wappy_abrir_chat_agente',
                                        accion: 'abrir_chat_agente',
                                        args: call.args || {}
                                    };
                                    break;
                                } else if (call.name === 'wappy_buscar_historial_instantaneo') {
                                    const histOut = await searchInstantHistory(call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(histOut);
                                } else if (call.name === 'wappy_controlar_videollamada' || call.name === 'controlar_videollamada') {
                                    const rawAccion = call.args?.accion || 'activar_camara';
                                    if (rawAccion === 'activar_camara') {
                                        const userPrompt = (message || '').toLowerCase();
                                        const explicitCam = /\b(activa|activar|enciende|encender|inicia|iniciar|pon|poner|prende|prender|abre|abrir|mostrar|ver)\s+(la\s+)?(c[aá]mara|videollamada|video|visi[oó]n)\b|\b(videollamada|c[aá]mara\s+en\s+vivo|activa\s+c[aá]mara|activa\s+video|prende\s+c[aá]mara)\b/i.test(userPrompt);
                                        if (!explicitCam) {
                                            toolOutput = JSON.stringify({
                                                success: false,
                                                error: 'Cámara NO activada: La videollamada requiere una orden explícita del usuario (ej: "activa la cámara", "inicia videollamada"). NUNCA actives la cámara ante expresiones casuales o refranes.'
                                            });
                                            break;
                                        }
                                    }
                                    const camMsg = rawAccion === 'activar_camara'
                                        ? 'Cámara y videollamada activadas con éxito.'
                                        : rawAccion === 'apagar_camara'
                                        ? 'Cámara apagada con éxito.'
                                        : 'Llamada finalizada y colgada a petición del usuario.';
                                    requestedGuiAction = {
                                        name: 'wappy_controlar_videollamada',
                                        action: 'wappy_controlar_videollamada',
                                        accion: rawAccion,
                                        message: camMsg,
                                    };
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        accion: rawAccion,
                                        message: camMsg
                                    });
                                } else if (call.name === 'operar_interfaz_visual') {
                                    const guiCalls = calls.filter(c => c.name === 'operar_interfaz_visual');
                                    requestedGuiActions = guiCalls.map(c => ({
                                        accion: c.args.accion,
                                        indice: c.args.indice,
                                        texto: c.args.texto,
                                        direccion: c.args.direccion,
                                        detalle: c.args.detalle || c.args.campo,
                                        campo: c.args.campo
                                    }));
                                    requestedGuiAction = requestedGuiActions[0]; // fallback
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        message: `Acción visual programada: ${requestedGuiAction.accion}`
                                    });
                                    break;
                                } else if (call.name === 'wappy_memoria_procedimental') {
                                    const memOut = await manageProceduralMemory(
                                        call.args || {},
                                        targetUserId,
                                        companyInfo?._id,
                                        companyInfo?.companyName || ''
                                    );
                                    if (memOut.widget) {
                                        capturedWidget = memOut.widget;
                                    }
                                    toolOutput = JSON.stringify(memOut.result);
                                } else if (call.name === 'wappy_renderizar_widget_interactivo') {
                                    capturedWidget = buildGenerativeWidgetForTool(
                                        'wappy_renderizar_widget_interactivo',
                                        call.args || {},
                                        { ok: true }
                                    );
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        mensaje: `Widget interactivo "${capturedWidget?.title || 'Simulador SST'}" proyectado exitosamente en el chat del usuario.`,
                                    });
                                } else if (call.name === 'wappy_reintegrar_trabajador' || call.name === 'wappy_reactivar_trabajador') {
                                    const rawArgs = call.args || {};
                                    const target = rawArgs.idOrCedula || rawArgs.id || rawArgs.cedula || rawArgs.nombre || rawArgs.identificacion || rawArgs.target || '';
                                    const argsToSend = {
                                        ...rawArgs,
                                        idOrCedula: target,
                                        id: target,
                                        nombre: rawArgs.nombre || target
                                    };
                                    const res = await executeTenshiMcpTool('wappy_reintegrar_trabajador', argsToSend, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_retirar_trabajador' || call.name === 'wappy_eliminar_trabajador') {
                                    const rawArgs = call.args || {};
                                    const target = rawArgs.idOrCedula || rawArgs.id || rawArgs.cedula || rawArgs.nombre || rawArgs.identificacion || rawArgs.target || '';
                                    const argsToSend = {
                                        ...rawArgs,
                                        idOrCedula: target,
                                        id: target,
                                        nombre: rawArgs.nombre || target
                                    };
                                    if (isGovernedTool('wappy_retirar_trabajador', argsToSend)) {
                                        const staged = await stageGovernedAction('wappy_retirar_trabajador', argsToSend, targetUserId, companyInfo?._id);
                                        capturedWidget = staged.widget;
                                        toolOutput = JSON.stringify(staged.toolResponse);
                                    } else {
                                        const res = await executeTenshiMcpTool('wappy_retirar_trabajador', argsToSend, targetUserId);
                                        toolOutput = JSON.stringify(res);
                                    }
                                } else if (call.name === 'wappy_actualizar_trabajador') {
                                    const rawArgs = call.args || {};
                                    const target = rawArgs.idOrCedula || rawArgs.id || rawArgs.cedula || rawArgs.nombre || rawArgs.identificacion || rawArgs.target || '';
                                    const argsToSend = { ...rawArgs, idOrCedula: target, id: target };
                                    const res = await executeTenshiMcpTool('wappy_actualizar_trabajador', argsToSend, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_consultar_trabajadores') {
                                    const res = await executeTenshiMcpTool('wappy_consultar_trabajadores', call.args || {}, targetUserId);
                                    if (!capturedWidget) {
                                        capturedWidget = buildGenerativeWidgetForTool('wappy_consultar_trabajadores', call.args || {}, res);
                                    }
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_registrar_trabajador') {
                                    const res = await executeTenshiMcpTool('wappy_registrar_trabajador', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_importar_sociodemografico_drive' || call.name === 'wappy_alimentar_sociodemografico_masivo') {
                                    const res = await executeTenshiMcpTool('wappy_importar_sociodemografico_drive', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_importar_hito1_drive') {
                                    const res = await executeTenshiMcpTool('wappy_importar_hito1_drive', call.args || {}, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_resumen_general_360') {
                                    const res = await executeTenshiMcpTool('wappy_resumen_general_360', call.args || {}, targetUserId);
                                    if (!capturedWidget) {
                                        capturedWidget = buildGenerativeWidgetForTool('wappy_resumen_general_360', call.args || {}, res);
                                    }
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'notebooklm_listar_cuadernos' || call.name === 'notebooklm_consultar' || call.name === 'notebooklm_generar_studio') {
                                     let mappedTool = 'notebook_list';
                                     let mappedArgs = {};
                                     if (call.name === 'notebooklm_consultar') {
                                         mappedTool = 'chat_ask';
                                         mappedArgs = { notebook: call.args?.cuaderno || call.args?.notebook || '', query: call.args?.pregunta || call.args?.query || '' };
                                     } else if (call.name === 'notebooklm_generar_studio') {
                                         mappedTool = 'studio_generate';
                                         mappedArgs = { notebook: call.args?.cuaderno || '', artifact_type: call.args?.tipo_artefacto || call.args?.artifact_type || 'audio', instructions: call.args?.instrucciones || '' };
                                     }
                                     const res = await executeTenshiMcpTool(mappedTool, mappedArgs, targetUserId);
                                     toolOutput = typeof res === 'string' ? res : JSON.stringify(res);
                                 } else if (call.name === 'google_flow_generar_imagen' || call.name === 'google_flow_generar_video' || call.name === 'google_flow') {
                                     const {
                                         executeFlowImageGeneration,
                                         executeFlowVideoGeneration,
                                         buildFlowStudioCanvasHtml,
                                     } = require('./googleflow');
                                     const isVideoCall =
                                         call.name === 'google_flow_generar_video' ||
                                         call.args?.accion === 'generar_video';
                                     const flowPrompt = call.args?.prompt || call.args?.descripcion || '';
                                     const flowAspect = call.args?.aspecto || call.args?.aspectRatio || '16:9';
                                     const flowStyle = call.args?.estilo || call.args?.style || 'fotorrealista';
                                     const flowMotion = call.args?.movimiento_camara || call.args?.cameraMotion || 'zoom_in';

                                     const mediaRes = isVideoCall
                                         ? await executeFlowVideoGeneration({
                                               userId: targetUserId,
                                               prompt: flowPrompt,
                                               aspectRatio: flowAspect,
                                               cameraMotion: flowMotion,
                                           })
                                         : await executeFlowImageGeneration({
                                               userId: targetUserId,
                                               prompt: flowPrompt,
                                               aspectRatio: flowAspect,
                                               style: flowStyle,
                                           });

                                     const studioHtml = buildFlowStudioCanvasHtml(mediaRes);
                                     capturedHtmlReport = studioHtml;
                                     capturedFile = {
                                         title: isVideoCall ? 'Video Google Flow Studio' : 'Imagen Google Flow Studio',
                                         fileType: 'html',
                                         content: studioHtml,
                                         canvasId: `tenshi-flow-${targetUserId}-${Date.now()}`,
                                     };

                                     toolOutput = JSON.stringify({
                                         success: true,
                                         tipo: mediaRes.type,
                                         url: mediaRes.publicUrl,
                                         modelo: mediaRes.model,
                                         formato: mediaRes.aspectRatio,
                                         markdown_para_incluir_en_tu_respuesta: isVideoCall
                                             ? `[🎬 Reproducir Video MP4](${mediaRes.publicUrl})`
                                             : `![${flowPrompt.slice(0, 80)}](${mediaRes.publicUrl})`,
                                         instruccion: 'Incluye SIEMPRE el código markdown_para_incluir_en_tu_respuesta UNA SOLA VEZ en tu respuesta. PROHIBIDO agregar un segundo enlace [⬇ Descargar] repetido hacia la misma URL, ya que la tarjeta visual de WAPPY ya incluye la vista previa y el botón de descarga.',
                                     });
                                 } else if (call.name === 'wappy_mcp_sst' || call.name in TOOL_ROUTES || (call.name.startsWith('wappy_') && !['wappy_navegar', 'wappy_diligenciar_formulario', 'wappy_seleccionar_empresa', 'wappy_activar_empresa'].includes(call.name))) {
                                    const targetTool = call.name === 'wappy_mcp_sst' ? (call.args?.herramienta || call.args?.tool || 'wappy_resumen_general_360') : call.name;
                                    const targetArgs = call.name === 'wappy_mcp_sst' ? (call.args?.parametros || call.args?.args || call.args || {}) : (call.args || {});
                                    if (isGovernedTool(targetTool, targetArgs)) {
                                        const staged = await stageGovernedAction(targetTool, targetArgs, targetUserId, companyInfo?._id);
                                        capturedWidget = staged.widget;
                                        toolOutput = JSON.stringify(staged.toolResponse);
                                    } else {
                                        const res = await executeTenshiMcpTool(targetTool, targetArgs, targetUserId);
                                        if ((targetTool === 'wappy_delegar_orden_antigravity' || targetTool === 'delegar_orden_antigravity') && res?.ordenId) {
                                            capturedDelegatedOrder = {
                                                ordenId: res.ordenId,
                                                titulo: res.detalles?.titulo || targetArgs?.titulo || 'Orden Antigravity',
                                                formato: res.detalles?.formatoEntregable || targetArgs?.tipo_entregable || 'html',
                                                estado: res.estado || 'todo',
                                            };
                                        }
                                        if (!capturedWidget) {
                                            capturedWidget = buildGenerativeWidgetForTool(targetTool, targetArgs, res);
                                        }
                                        toolOutput = JSON.stringify(res);
                                    }
                                } else {
                                    break;
                                }
                            } catch (toolExecErr) {
                                logger.error(`[Tenshi Tool Error] Error ejecutando ${call.name}:`, toolExecErr);
                                toolOutput = JSON.stringify({ error: `Error ejecutando ${call.name}: ${toolExecErr.message}` });
                            }

                            try {
                                if (typeof toolOutput === 'string' && toolOutput.trim().startsWith('{')) {
                                    const parsed = JSON.parse(toolOutput);
                                    if (parsed.informeOriginalHtml) {
                                        capturedHtmlReport = parsed.informeOriginalHtml;
                                        capturedFile = {
                                            title: parsed.titulo || `Informe Oficial de ${parsed.aplicativo || 'SGSST'}`,
                                            fileType: 'html',
                                            content: parsed.informeOriginalHtml,
                                        };
                                    } else if (parsed.htmlCode) {
                                        capturedHtmlReport = parsed.htmlCode;
                                        capturedFile = {
                                            title: parsed.titulo || 'Informe Técnico Oficial',
                                            fileType: 'html',
                                            content: parsed.htmlCode,
                                        };
                                    } else if (parsed.informeCompleto && (parsed.informeCompleto.includes('<html') || parsed.informeCompleto.includes('<div') || parsed.informeCompleto.includes('<table') || parsed.informeCompleto.includes('<!DOCTYPE'))) {
                                        capturedHtmlReport = parsed.informeCompleto;
                                        capturedFile = {
                                            title: parsed.titulo || `Informe Oficial de ${parsed.aplicativo || 'SGSST'}`,
                                            fileType: 'html',
                                            content: parsed.informeCompleto,
                                        };
                                    } else if (parsed.content && (parsed.content.includes('<html') || parsed.content.includes('<!DOCTYPE') || parsed.content.includes('<table'))) {
                                        capturedHtmlReport = parsed.content;
                                        capturedFile = {
                                            title: parsed.title || 'Documento SG-SST',
                                            fileType: 'html',
                                            content: parsed.content,
                                        };
                                    }
                                } else if (typeof toolOutput === 'string' && (toolOutput.includes('<html') || toolOutput.includes('<!DOCTYPE'))) {
                                    capturedHtmlReport = toolOutput;
                                    capturedFile = {
                                        title: 'Documento Oficial SG-SST',
                                        fileType: 'html',
                                        content: toolOutput,
                                    };
                                }
                            } catch (e) { }

                            const rawCandidateParts = (candidate && candidate.content && Array.isArray(candidate.content.parts))
                                ? candidate.content.parts
                                : [];
                            let firstFuncTaken = false;
                            const filteredParts = rawCandidateParts.filter((p) => {
                                if (p && p.functionCall) {
                                    if (!firstFuncTaken && p.functionCall.name === call.name) {
                                        firstFuncTaken = true;
                                        return true;
                                    }
                                    return false;
                                }
                                return true;
                            });
                            const modelParts = filteredParts.length > 0 ? filteredParts : [{
                                functionCall: { name: call.name, args: call.args }
                            }];
                            currentContents.push({ role: 'model', parts: modelParts });

                            let parsedResponse;
                            if (typeof toolOutput === 'object' && toolOutput !== null) {
                                parsedResponse = { ...toolOutput };
                            } else if (typeof toolOutput === 'string' && toolOutput.trim().startsWith('{')) {
                                try {
                                    parsedResponse = JSON.parse(toolOutput);
                                } catch (e) {
                                    parsedResponse = { result: toolOutput };
                                }
                            } else {
                                parsedResponse = { result: String(toolOutput || 'Operación completada.') };
                            }

                            // Aligerar el payload antes de enviarlo de vuelta al LLM en functionResponse
                            // para evitar que documentos HTML de 100KB+ provoquen errores 503 por exceso de tokens
                            const lightResponse = (parsedResponse && typeof parsedResponse === 'object')
                                ? { ...parsedResponse }
                                : { result: String(parsedResponse || 'OK') };
                            if (lightResponse.informeOriginalHtml) {
                                delete lightResponse.informeOriginalHtml;
                                lightResponse.notaAdjunto = 'El informe HTML completo ya fue adjuntado automáticamente a la interfaz del chat para que el usuario lo visualice o descargue.';
                            }
                            if (lightResponse.htmlCode) {
                                delete lightResponse.htmlCode;
                                lightResponse.notaAdjunto = 'El documento HTML completo ya fue adjuntado automáticamente a la interfaz del chat.';
                            }
                            if (lightResponse.todosLosInformes && Array.isArray(lightResponse.todosLosInformes)) {
                                lightResponse.todosLosInformes = lightResponse.todosLosInformes.slice(0, 5).map(inf => ({
                                    titulo: inf.titulo,
                                    fecha: inf.fecha,
                                    resumen: typeof inf.resumen === 'string' ? inf.resumen.substring(0, 400) : undefined
                                }));
                            }
                            if (typeof lightResponse.informeCompleto === 'string' && lightResponse.informeCompleto.length > 3500) {
                                lightResponse.informeCompleto = lightResponse.informeCompleto
                                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim()
                                    .substring(0, 3500) + '... (resumido para síntesis rápida)';
                            }
                            if (typeof lightResponse.content === 'string' && lightResponse.content.length > 3500) {
                                lightResponse.content = lightResponse.content
                                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim()
                                    .substring(0, 3500) + '...';
                            }

                            if (capturedWidget) {
                                // Evitar que el LLM gaste 9s repitiendo 41 trabajadores en una segunda lista (wappy-card)
                                if (Array.isArray(lightResponse.trabajadores) && lightResponse.trabajadores.length > 4) {
                                    lightResponse.trabajadoresMuestra = lightResponse.trabajadores.slice(0, 3).map(w => ({
                                        nombre: w.nombre_completo || w.nombreCompleto || w.nombre,
                                        cedula: w.cedula,
                                        cargo: w.cargo,
                                        estado: w.estadoLaboral
                                    }));
                                    delete lightResponse.trabajadores;
                                }
                                lightResponse.instruccionCriticaWidget = 'IMPORTANTE: El widget interactivo oficial de React YA FUE ADJUNTADO automáticamente debajo de tu burbuja de chat con el listado completo, buscador y controles. PROHIBIDO generar bloques ```wappy-card``` o repetir toda la lista en texto. Responde únicamente con un resumen ejecutivo cálido de 2 a 3 líneas.';
                            }

                            currentContents.push({
                                role: 'user',
                                parts: [
                                    {
                                        functionResponse: {
                                            name: call.name,
                                            response: lightResponse
                                        }
                                    }
                                ]
                            });

                            try {
                                responseResult = await geminiModel.generateContent({ contents: currentContents });
                                candidate = responseResult.response.candidates && responseResult.response.candidates[0];
                                calls = responseResult.response.functionCalls();
                            } catch (synthErr) {
                                logger.warn(`[Tenshi Synthesis Fallback] Error sintetizando respuesta de herramienta ${call.name} (${synthErr.message}). Rescatando resultado directo...`);
                                // Si la herramienta ya se ejecutó con éxito pero el segundo llamado a Gemini dio 503,
                                // no perder el resultado ni lanzar error 503 al usuario: construir síntesis limpia en español.
                                let rescuedText = '';
                                if (lightResponse.error) {
                                    rescuedText = `Revisé el módulo solicitado: ${lightResponse.error}`;
                                } else if (lightResponse.titulo || lightResponse.informeCompleto) {
                                    const cleanExtract = String(lightResponse.informeCompleto || lightResponse.resumen || '')
                                        .replace(/<[^>]+>/g, ' ')
                                        .replace(/\s+/g, ' ')
                                        .trim()
                                        .substring(0, 700);
                                    rescuedText = `✅ **Revisión completada: ${lightResponse.titulo || 'Informe del Aplicativo'}**\n\n${cleanExtract ? `${cleanExtract}...\n\n` : ''}Ya tienes el documento técnico oficial adjunto aquí mismo en nuestro chat para que puedas abrirlo, revisarlo en detalle o descargarlo en PDF/Word.`;
                                } else if (lightResponse.mensaje || lightResponse.message || lightResponse.resumen) {
                                    rescuedText = String(lightResponse.mensaje || lightResponse.message || lightResponse.resumen);
                                } else if (capturedFile || capturedHtmlReport) {
                                    rescuedText = `✅ Listo, he revisado y cargado el **${capturedFile?.title || 'Informe Oficial SG-SST'}** directamente aquí en nuestro chat para tu revisión.`;
                                } else {
                                    rescuedText = `✅ He ejecutado la revisión solicitada (${call.name}). Los datos han sido procesados correctamente.`;
                                }
                                responseResult = {
                                    response: {
                                        text: () => rescuedText,
                                        candidates: [],
                                        functionCalls: () => null
                                    }
                                };
                                candidate = null;
                                calls = null;
                                break;
                            }
                        }

                        if (!capturedWidget && isWorkerListIntent) {
                            try {
                                const workersRes = await executeTenshiMcpTool('wappy_consultar_trabajadores', { filtro: 'todos' }, targetUserId);
                                capturedWidget = buildGenerativeWidgetForTool('wappy_consultar_trabajadores', { filtro: 'todos' }, workersRes);
                            } catch (wErr) {
                                logger.warn('[Tenshi Worker Widget Fallback] Error consultando trabajadores:', wErr.message);
                            }
                        }

                        if (!capturedWidget && isInlineWidgetIntent) {
                            const ndMatch = lastUserMsg.match(/deficiencia\s*(?:de\s*|:\s*)?(\d+)/i);
                            const neMatch = lastUserMsg.match(/exposici[oó]n\s*(?:de\s*|:\s*)?(\d+)/i);
                            const ncMatch = lastUserMsg.match(/consecuencia\s*(?:de\s*|:\s*)?(\d+)/i);
                            const isChecklist = lastUserLower.includes('checklist') || lastUserLower.includes('lista de chequeo');
                            capturedWidget = buildGenerativeWidgetForTool(
                                'wappy_renderizar_widget_interactivo',
                                isChecklist
                                    ? { tipo_widget: 'inspection_checklist', titulo: 'Lista de Chequeo Interactiva SG-SST' }
                                    : {
                                          tipo_widget: 'risk_calculator',
                                          titulo: 'Calculadora Interactiva GTC-45',
                                          peligro: lastUserMsg,
                                          nd: ndMatch ? Number(ndMatch[1]) : 6,
                                          ne: neMatch ? Number(neMatch[1]) : 3,
                                          nc: ncMatch ? Number(ncMatch[1]) : 25,
                                      },
                                { ok: true }
                            );
                        }

                        try {
                            responseText = responseResult.response.text();
                        } catch (textErr) {
                            responseText = '';
                        }

                        if (responseText) {
                            // SIEMPRE eliminar bloques wappy-card de Tenshi (Tenshi usa exclusivamente TenshiGenerativeWidget)
                            responseText = responseText
                                .replace(/```(?:wappy-card|card)[\s\S]*?```/gi, '')
                                .replace(/en el panel de la derecha|en el panel lateral/gi, 'aquí mismo dentro de nuestro chat')
                                .trim();
                        }

                        if (!responseText && capturedWidget?.widgetType === 'worker_census') {
                            const d = capturedWidget.data || {};
                            responseText = `¡Listo! Aquí tienes el censo actualizado de colaboradores de la empresa (**${d.totalRegistrados || 0} registrados**: **${d.totalActivos || 0} activos** y **${d.totalRetirados || 0} retirados**). Puedes filtrarlos por las pestañas **Todos**, **Activos** y **Retirados** o buscar por nombre, cédula y cargo directamente en la tarjeta interactiva:`;
                        }

                        if (responseText) {
                            // Limpiar LaTeX crudo ($6 \times 3 = 18$, \mathbf{450}) para que el texto sea 100% legible
                            responseText = responseText
                                .replace(/\\mathbf\{([^}]+)\}/g, '**$1**')
                                .replace(/\\textbf\{([^}]+)\}/g, '**$1**')
                                .replace(/\\times/g, '×')
                                .replace(/\\div/g, '÷')
                                .replace(/\\rightarrow|\\to/g, '→')
                                .replace(/\$([^$\n]+)\$/g, '$1');
                        }

                        if (!responseText || !responseText.trim()) {
                            const hasGuiAction = Boolean(requestedGuiAction || (requestedGuiActions && requestedGuiActions.length > 0));
                            const hasGeneratedArtifact = Boolean(capturedFile || capturedHtmlReport || capturedQrCode || capturedWidget);
                            if (hasGuiAction) {
                                responseText = requestedGuiAction?.message || "Entendido, procedo a realizar una acción en la pantalla...";
                            } else if (hasGeneratedArtifact) {
                                responseText = "Listo, he generado el recurso solicitado y ya lo tienes disponible aquí en pantalla.";
                            } else {
                                throw new Error(`El modelo "${currentModel}" devolvió una respuesta vacía sin texto ni acción GUI.`);
                            }
                        }
                        logger.info(`[Tenshi Backend] Final responseText: "${responseText}", guiAction: ${JSON.stringify(requestedGuiAction)}`);
                        lastError = null;
                        succeeded = true;
                        break; // Key rotation done — success
                    } catch (geminiError) {
                        lastError = geminiError;
                        const status = geminiError.status || (geminiError.response && geminiError.response.status) || 0;
                        const msg = (geminiError.message || '').toLowerCase();

                        // Key rotation: 403 / 429 / leaked / invalid key
                        const isRateLimit = status === 429 || msg.includes('429') ||
                            msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many requests');
                        const isQuotaExceeded = status === 403 || msg.includes('leaked') || msg.includes('forbidden');
                        const isInvalidKey = status === 400 && (msg.includes('api_key_invalid') || msg.includes('api key not valid'));

                        if (isRateLimit || isQuotaExceeded || isInvalidKey) {
                            logger.warn(`[Tenshi] Clave #${i + 1} rechazada (${status || 'quota'}). Rotando clave...`);
                            continue; // Try next key on same model
                        }

                        // Model fallback: 503 / 404 / overloaded / not found
                        const is503 = status === 503 || msg.includes('503') || msg.includes('overloaded') || msg.includes('service unavailable');
                        const is404 = status === 404 || msg.includes('404') || msg.includes('not found') || msg.includes('is not found for api version');

                        if (is503) {
                            if (i < apiKeys.length - 1) {
                                logger.warn(`[Tenshi] Modelo "${currentModel}" recibió 503 con clave #${i + 1}. Reintentando con clave #${i + 2}...`);
                                continue;
                            }
                            logger.warn(`[Tenshi] Modelo "${currentModel}" no disponible tras probar todas las claves (${status || '503'} - ${geminiError.message}). Cambiando a modelo fallback...`);
                            break;
                        }

                        if (is404) {
                            logger.warn(`[Tenshi] Modelo "${currentModel}" no encontrado (${status || '404'} - ${geminiError.message}). Cambiando a modelo fallback...`);
                            break;
                        }

                        logger.warn(`[Tenshi] Error con modelo "${currentModel}" y clave #${i + 1}: ${geminiError.message}. Probando siguiente modelo...`);
                        break;
                    }
                }
            }

            if (!succeeded && lastError) {
                if (capturedFile || capturedHtmlReport) {
                    responseText = `✅ He recuperado el **${capturedFile?.title || 'Informe Oficial SG-SST'}** y ya lo tienes disponible aquí mismo en nuestro chat para abrirlo o descargarlo.`;
                } else {
                    throw new Error(`El servicio de IA experimenta alta demanda en este momento. Por favor intenta nuevamente en unos segundos.`);
                }
            }

        } else if (config.provider === 'groq') {
            const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: config.model || 'llama-3.3-70b-versatile',
                messages: formattedMessages
            }, {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
            });
            responseText = groqRes.data.choices[0].message.content;

        } else if (config.provider === 'openai' || config.provider === 'ollama') {
            // For generic OpenAI compatible endpoints (like Wappy local Ollama)
            const baseURL = config.provider === 'ollama' ? 'http://localhost:11434/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
            const apiKey = config.provider === 'ollama' ? 'ollama' : process.env.OPENAI_API_KEY;

            const options = {
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
            };

            const oaiRes = await axios.post(baseURL, {
                model: config.model || 'gpt-4o',
                messages: formattedMessages
            }, options);
            responseText = oaiRes.data.choices[0].message.content;
        }

        const lastUserText = (messages[messages.length - 1]?.content || '').trim();
        const lastUserLower = lastUserText.toLowerCase();
        if (
            !requestedGuiAction &&
            (!requestedGuiActions || requestedGuiActions.length === 0) &&
            !lastUserText.startsWith('[RESULTADO_GUI]') &&
            /\b(estudio\s+de\s+puesto|evaluaci[oó]n\s+ergon[oó]mica|an[aá]lisis\s+ergon[oó]mico|an[aá]lisis\s+biomec[aá]nico|estudio\s+ergon[oó]mico|inspecci[oó]n\s+ergon[oó]mica|puesto\s+de\s+trabajo\s+ergon[oó]mico)/i.test(lastUserLower) &&
            /\b(necesito|quiero|deseo|hacer|realizar|iniciar|empezar|hazme|hagamos|ll[eé]vame|abrir|abre|en\s+vivo|con\s+la\s+fisio)/i.test(lastUserLower)
        ) {
            requestedGuiAction = {
                name: 'wappy_iniciar_estudio_ergonomico_vivo',
                accion: 'iniciar_estudio_ergonomico_vivo',
                args: {}
            };
        }

        if (requestedGuiAction?.name === 'wappy_iniciar_estudio_ergonomico_vivo') {
            responseText = '¡De una! Te llevo en este instante al **Análisis Biomecánico y Estudio de Puesto de Trabajo Ergonómico en Vivo** con nuestra **Fisioterapeuta Laboral** (con cámara, exoesqueleto MediaPipe 3D y protocolo de 3 fases). Al finalizar la evaluación, el informe técnico oficial quedará tanto en el chat principal como aquí mismo en tu chat de Tenshi listo para ver en pantalla o descargar.';
        } else if (requestedGuiAction?.name === 'wappy_abrir_chat_agente') {
            const specLabel = requestedGuiAction.args?.agente || 'el Agente Especialista';
            responseText = `¡De una! Te abro en este instante el chat dedicado en pantalla con **${specLabel}** y le envío tu consulta técnica estructurada.`;
        }

        const oneShotGuiActionNames = new Set([
            'wappy_iniciar_estudio_ergonomico_vivo',
            'wappy_abrir_chat_agente',
            'wappy_navegar',
            'wappy_abrir_curso',
            'wappy_abrir_articulo_blog',
            'wappy_diligenciar_formulario',
            'wappy_controlar_videollamada',
        ]);
        const guiActionName = requestedGuiAction?.name || requestedGuiAction?.action || '';

        if (
            responseText &&
            (!requestedGuiAction || oneShotGuiActionNames.has(guiActionName)) &&
            (!requestedGuiActions || requestedGuiActions.length === 0)
        ) {
            await TenshiMessage.create({
                user: req.user.id,
                role: 'assistant',
                content: responseText,
                htmlReport: capturedHtmlReport || undefined,
                qrCode: capturedQrCode || undefined,
                file: capturedFile || undefined,
                widget: capturedWidget || undefined,
            }).catch(e => console.error('Error saving assistant TenshiMessage:', e));
        }

        // Hook turn_finalizer (Auto-Aprendizaje de Habilidades en segundo plano con 0ms de impacto)
        if (lastUserText && targetUserId && !lastUserText.startsWith('[RESULTADO_GUI]')) {
            setImmediate(() => {
                autoSynthesizeProceduralRule(
                    lastUserText,
                    targetUserId,
                    companyInfo?._id || null,
                    companyInfo?.companyName || ''
                ).catch(() => {});
            });
        }

        // Respaldo simultáneo en el Chat del Agente Tenshi si se generó un archivo o reporte
        if ((capturedFile || capturedHtmlReport) && req.user?.id) {
            try {
                const { Conversation, Message } = require('~/db/models');
                const CanvasSession = require('~/models/CanvasSession');
                const { v4: uuidv4 } = require('uuid');
                const TENSHI_AGENT_ID = '3579240c-ac93-4f4f-b0e4-95d87fc1ee27';
                const fileTitle = capturedFile?.title || 'Informe Técnico SG-SST';

                let tenshiConvo = await Conversation.findOne({
                    user: String(req.user.id),
                    agent_id: TENSHI_AGENT_ID,
                }).sort({ updatedAt: -1 });

                const convoId = tenshiConvo ? tenshiConvo.conversationId : uuidv4();

                if (!tenshiConvo) {
                    tenshiConvo = await Conversation.create({
                        conversationId: convoId,
                        user: String(req.user.id),
                        title: fileTitle,
                        endpoint: 'agents',
                        agent_id: TENSHI_AGENT_ID,
                        tags: ['tenshi-report', 'sgsst'],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                } else {
                    await Conversation.updateOne(
                        { conversationId: convoId },
                        { $set: { title: fileTitle, updatedAt: new Date() } }
                    );
                }

                const fileLabel = capturedFile?.fileType === 'html' ? 'Aplicativo / Reporte HTML' : 'Documento SG-SST';
                await Message.create({
                    messageId: uuidv4(),
                    conversationId: convoId,
                    user: String(req.user.id),
                    sender: 'Tenshi',
                    text: `📁 **${fileLabel} generado**: *${fileTitle}*\n\n${responseText || ''}\n\nPuedes visualizarlo o descargarlo desde Canvas.`,
                    isCreatedByUser: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                await CanvasSession.findOneAndUpdate(
                    { conversationId: convoId },
                    {
                        $set: {
                            user: String(req.user.id),
                            title: fileTitle,
                            fileType: capturedFile?.fileType || 'html',
                            content: capturedFile?.rawContent ?? capturedFile?.content ?? capturedHtmlReport ?? '',
                            updatedAt: new Date(),
                        },
                        $setOnInsert: {
                            createdAt: new Date(),
                            version: 1,
                        }
                    },
                    { upsert: true, new: true }
                );
            } catch (syncErr) {
                console.warn('[Tenshi Route] Could not sync file to Agent Tenshi conversation:', syncErr.message);
            }
        }

        res.json({
            response: responseText,
            htmlReport: capturedHtmlReport,
            qrCode: capturedQrCode,
            file: capturedFile,
            widget: capturedWidget,
            delegatedOrder: capturedDelegatedOrder,
            guiAction: requestedGuiAction,
            guiActions: requestedGuiActions
        });
    } catch (error) {
        console.error('CRITICAL Error in Tenshi chat route:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
        }
        res.status(500).json({ error: 'Error generating Tenshi response', details: error.message });
    }
});

/**
 * GET /api/tenshi/skills
 * Devuelve las skills disponibles para Tenshi:
 * - Skills con scope: 'tenshi'
 * - Skills sin scope definido (scope: 'all')
 * Excluye las skills con scope: 'agents'
 */
router.get('/skills', async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const yaml = require('js-yaml');
  const SKILLS_DIR = path.join(__dirname, '../../config/skills');

  if (!fs.existsSync(SKILLS_DIR)) {
    return res.json([]);
  }

  try {
    const files = fs.readdirSync(SKILLS_DIR);
    const skills = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf8');
        const match = content.match(/^---([\s\S]*?)---([\s\S]*)$/);
        if (match) {
          try {
            const frontmatter = yaml.load(match[1]);
            const scope = frontmatter.scope || 'all';
            // Exclude skills scoped exclusively to agents chat panel
            if (scope === 'agents') continue;
            skills.push({
              id: file.replace('.md', ''),
              name: frontmatter.name || file.replace('.md', ''),
              description: frontmatter.description || '',
              triggers: frontmatter.triggers || [],
              scope,
            });
          } catch (e) {
            // ignore
          }
        }
      }
    }
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PUENTE PERMANENTE PARA TENSHI EN CELULAR (https://wappy.club/wappydots)
// ============================================================================
let wappydotsTunnelState = {
  active: false,
  publicUrl: null,
  lanUrl: 'http://127.0.0.1:3001',
  startedAt: null,
  updatedAt: null,
};

async function loadPersistedWappydotsTunnelState() {
  if (wappydotsTunnelState.publicUrl) {
    return wappydotsTunnelState;
  }
  try {
    if (mongoose.connection && mongoose.connection.db) {
      const doc = await mongoose.connection.db
        .collection('wappydots_tunnel_state')
        .findOne({ _id: 'primary_mac_tunnel' });
      if (doc && doc.publicUrl) {
        wappydotsTunnelState = {
          active: Boolean(doc.active),
          publicUrl: doc.publicUrl,
          lanUrl: doc.lanUrl || 'http://127.0.0.1:3001',
          startedAt: doc.startedAt || null,
          updatedAt: doc.updatedAt || null,
        };
      }
    }
  } catch (_e) {
    // ignore
  }
  return wappydotsTunnelState;
}

/**
 * POST /api/tenshi/wappydots-link
 * Recibe desde la Mac (cloudflare-tunnel.ts) la URL activa del túnel de Tenshi
 */
router.post('/wappydots-link', async (req, res) => {
  try {
    const { publicUrl, lanUrl, active, startedAt, updatedAt } = req.body || {};
    const cleanPublic = typeof publicUrl === 'string' && publicUrl.trim()
      ? publicUrl.trim().replace(/\/$/, '')
      : wappydotsTunnelState.publicUrl;
    const cleanLan = typeof lanUrl === 'string' && lanUrl.trim()
      ? lanUrl.trim().replace(/\/$/, '')
      : wappydotsTunnelState.lanUrl;

    wappydotsTunnelState = {
      active: active !== undefined ? Boolean(active) : Boolean(cleanPublic),
      publicUrl: cleanPublic || null,
      lanUrl: cleanLan || 'http://127.0.0.1:3001',
      startedAt: startedAt || wappydotsTunnelState.startedAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
    };

    if (mongoose.connection && mongoose.connection.db) {
      await mongoose.connection.db
        .collection('wappydots_tunnel_state')
        .updateOne(
          { _id: 'primary_mac_tunnel' },
          { $set: { ...wappydotsTunnelState } },
          { upsert: true },
        )
        .catch(() => {});
    }

    return res.json({
      ok: true,
      permanentUrl: 'https://wappy.club/wappydots',
      ...wappydotsTunnelState,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * GET /api/tenshi/wappydots-link
 * Devuelve la URL activa del túnel para que https://wappy.club/wappydots se conecte automáticamente
 */
router.get('/wappydots-link', async (_req, res) => {
  const state = await loadPersistedWappydotsTunnelState();
  return res.json({
    ok: true,
    permanentUrl: 'https://wappy.club/wappydots',
    ...state,
    directMobileUrl: state.publicUrl ? `${state.publicUrl}/wappydots` : `${state.lanUrl}/wappydots`,
  });
});

/**
 * ALL /api/tenshi/wappydots-proxy/*
 * Proxy de respaldo hacia el túnel activo de la Mac para evitar bloqueos de red móvil
 */
router.all('/wappydots-proxy/*', async (req, res) => {
  try {
    const state = await loadPersistedWappydotsTunnelState();
    const targetBase = state.publicUrl || state.lanUrl;
    if (!targetBase) {
      return res.status(503).json({
        ok: false,
        error: 'El túnel de Wappy Dots en tu Mac aún no ha reportado su enlace activo.',
      });
    }
    const subPath = req.params[0] || '';
    const queryString = req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';
    const targetUrl = `${targetBase.replace(/\/$/, '')}/${subPath.replace(/^\//, '')}${queryString}`;

    const isBinaryFile = subPath.includes('files/') || /\.(pdf|docx|xlsx|png|jpg|jpeg|zip)$/i.test(subPath);
    const upstreamRes = await axios({
      method: req.method,
      url: targetUrl,
      data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) ? req.body : undefined,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        Authorization: req.headers.authorization || 'Bearer wappy-tunnel',
      },
      responseType: isBinaryFile ? 'arraybuffer' : 'json',
      timeout: 90000,
      validateStatus: () => true,
    });

    if (upstreamRes.headers['content-type']) {
      res.setHeader('Content-Type', upstreamRes.headers['content-type']);
    }
    if (upstreamRes.headers['content-disposition']) {
      res.setHeader('Content-Disposition', upstreamRes.headers['content-disposition']);
    }
    return res.status(upstreamRes.status).send(upstreamRes.data);
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: `Error conectando con el túnel de tu Mac: ${error.message}`,
    });
  }
});

/**
 * POST /api/tenshi/transcribe-dictation
 * Arquitectura Wappy Dots en 4 pasos para transcripción multimodal de dictado con el Pool de 6 Claves Gemini:
 * 1. Recibe el audio grabado (audioBase64 o pcmChunksBase64 a 16kHz).
 * 2. Construye un WAV mono ligero a 16 kHz y verifica el filtro de silencio RMS (rms >= 0.0025).
 * 3. Inyecta el Diccionario Personalizado WAPPY (Tenshi, Antigravity, SG-SST, GTC 45, PESV, etc.) y llama a
 *    gemini-3.5-flash-lite (con rotación automática a gemini-3.8-flash y gemini-3.6-flash entre las 6 claves API).
 * 4. Devuelve el texto limpio, sin muletillas y con puntuación perfecta en español.
 */
router.post('/transcribe-dictation', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const {
      audioBase64,
      pcmChunksBase64,
      mimeType = 'audio/wav',
      fallbackText = '',
      customVocabulary = [],
    } = req.body || {};

    const { generateWithKeyRotation } = require('./sgsst/sgsstGemini');
    const {
      build16kMonoWavFromPcmChunks,
      applyDomainPhoneticCorrections,
      WAPPY_DICTATION_CUSTOM_VOCABULARY,
    } = require('./voice/voiceSession');

    let finalMimeType = mimeType || 'audio/wav';
    let finalAudioBase64 = typeof audioBase64 === 'string' ? audioBase64.replace(/^data:audio\/[^;]+;base64,/, '') : '';

    if (Array.isArray(pcmChunksBase64) && pcmChunksBase64.length > 0) {
      const pcmBuffers = pcmChunksBase64
        .filter((c) => typeof c === 'string' && c.length > 0)
        .map((c) => Buffer.from(c, 'base64'));
      const wavInfo = build16kMonoWavFromPcmChunks(pcmBuffers);
      if (wavInfo.silent || !wavInfo.wavBase64) {
        return res.json({ ok: true, text: '', silent: true, rms: wavInfo.rms });
      }
      finalAudioBase64 = wavInfo.wavBase64;
      finalMimeType = 'audio/wav';
    } else if (finalAudioBase64 && finalMimeType === 'audio/pcm') {
      const wavInfo = build16kMonoWavFromPcmChunks([Buffer.from(finalAudioBase64, 'base64')]);
      if (wavInfo.silent || !wavInfo.wavBase64) {
        return res.json({ ok: true, text: '', silent: true, rms: wavInfo.rms });
      }
      finalAudioBase64 = wavInfo.wavBase64;
      finalMimeType = 'audio/wav';
    }

    if (!finalAudioBase64 && !fallbackText) {
      return res.json({ ok: true, text: '', silent: true });
    }

    const vocabWords = [
      ...WAPPY_DICTATION_CUSTOM_VOCABULARY,
      ...(Array.isArray(customVocabulary) ? customVocabulary : []),
      ...(req.user?.name ? [req.user.name] : []),
    ].filter(Boolean);
    const vocabPrompt = `\nDiccionario de palabras clave y nombres propios a priorizar si suenan parecido: ${vocabWords.join(', ')}.`;

    const systemPrompt =
      `Eres el motor de transcripción de voz de ultra-alta precisión de WAPPY IA y Tenshi (estilo Wispr Flow / Wappy Dots). ` +
      `Tu única tarea es escuchar el archivo de audio adjunto y devolver EXACTAMENTE lo que el usuario dijo en español, ` +
      `con ortografía perfecta, signos de interrogación/exclamación correctos (¿...?, ¡...!), comas, puntos y mayúsculas adecuadas. ` +
      `Elimina muletillas involuntarias ('eh', 'este', 'mmm') o falsos comienzos tartamudeados, pero conserva el 100% del mensaje real. ` +
      `REGLA ANTI-ALUCINACIÓN ESTRICTA: Si en el audio NO hay ninguna voz humana clara hablando (solo silencio, respiración, soplidos, clics o ruido de fondo ininteligible), ` +
      `devuelve única y exclusivamente la palabra: __SILENCIO__ (ten absolutamente prohibido inventar saludos, preguntas o frases que no estén en el audio). ` +
      `NO respondas a la pregunta del usuario ni agregues comentarios: devuelve SOLO el texto transcrito.` +
      vocabPrompt;

    const userPrompt = fallbackText
      ? `Transcribe el audio adjunto con puntuación perfecta. Borrador fonético orientativo (puede tener errores; guíate por el audio): "${fallbackText}". Devuelve SOLO la transcripción final:`
      : `Transcribe el audio adjunto con puntuación perfecta. Devuelve SOLO la transcripción final:`;

    const parts = finalAudioBase64
      ? [
          {
            inlineData: {
              mimeType: finalMimeType,
              data: finalAudioBase64,
            },
          },
          { text: userPrompt },
        ]
      : [{ text: userPrompt }];

    const result = await generateWithKeyRotation(
      'gemini-3.5-flash-lite',
      userId,
      parts,
      {
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: 400, temperature: 0.1 },
      }
    );

    const rawOut = (result?.response?.text?.() || '')
      .replace(/^["'«»]+|["'«»]+$/g, '')
      .trim();

    if (
      !rawOut ||
      /(__SILENCIO__|\[DESCARTAR\]|sin\s+audio|no\s+hay\s+voz)/i.test(rawOut)
    ) {
      return res.json({ ok: true, text: '', silent: true });
    }

    const cleaned = applyDomainPhoneticCorrections(rawOut).trim();
    return res.json({
      ok: true,
      text: cleaned,
      model: 'gemini-3.5-flash-lite',
    });
  } catch (err) {
    logger.error('[Tenshi Dictation] Error in /transcribe-dictation:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error procesando dictado multimodal',
    });
  }
});

module.exports = router;
