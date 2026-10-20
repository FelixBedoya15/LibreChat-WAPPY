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
    if (!userQuery || userQuery.length < 5) return '';
    let context = '';

    // 1. Try Vector DB (App RAG System) with ultra-fast 500ms timeout
    if (process.env.RAG_API_URL) {
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
                timeout: 500
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

    // 2. Fallback to MongoDB Smart Search (Text Index)
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
            createdAt: m.createdAt,
        })));
    } catch (error) {
        console.error('Error fetching Tenshi history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/message', requireJwtAuth, async (req, res) => {
    try {
        const { role = 'assistant', content, htmlReport, file, qrCode, image, media } = req.body;
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
        });
        res.json(newMsg);
    } catch (error) {
        console.error('Error creating Tenshi message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
                fullCompanyAndMemoryBlock += `### 🏢 INFORMACIÓN DE LA EMPRESA ACTIVA DEL USUARIO (DATOS OFICIALES SG-SST):\n` +
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
                fullCompanyAndMemoryBlock += `### 🏢 INFORMACIÓN DE LA EMPRESA ACTIVA:\nNo se ha registrado una empresa en el Gestor SG-SST aún.\n\n`;
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
                fullCompanyAndMemoryBlock += `### 🧠 MEMORIAS REGISTRADAS DEL USUARIO (BASE DE CONOCIMIENTO PERMANENTE / MEMORIA WAPPY):\n`;
                for (const [k, v] of uniqueMemMap.entries()) {
                    fullCompanyAndMemoryBlock += `📌 [${k}]:\n${v}\n\n`;
                }
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

        const skillsList = (config.skills && config.skills.length > 0) ? config.skills : ['*'];
        const { instructions: skillInstructions, activeTools, activeSkillNames } = getActiveSkillsData(userQuery, skillsList);
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

Hola, estás conversando con el usuario: ${req.user.name || req.user.username || 'Usuario'}

### 🕒 ZONA HORARIA Y FECHA ACTUAL EN VIVO (COLOMBIA):
- País y Zona Horaria Oficial: Colombia (America/Bogota, UTC-5).
- Fecha y Hora Actual en Colombia: ${nowColombiaStr}.
- REGLA ESTRICTA DE AGENDAMIENTO: Toda hora o fecha que el usuario mencione ("hoy", "mañana", "a las 3pm", "a las 8am", etc.) debe interpretarse e ingresarse SIEMPRE en HORA COLOMBIA (America/Bogota, UTC-5). NUNCA uses UTC ni horarios extranjeros. Al enviar fechas a herramientas como 'google_calendar' o 'wappy_gestionar_agenda', envía la fecha y hora con el offset '-05:00' (ejemplo: '2026-10-16T15:00:00-05:00').

MANUAL DE FUNCIONAMIENTO DE WAPPY IA:
${manualContent}

${blogStr ? `ÚLTIMAS PUBLICACIONES DEL BLOG:\n${blogStr}\n` : ''}
${courseStr ? `CURSOS DE FORMACIÓN DISPONIBLES:\n${courseStr}\n` : ''}
${ticketContext ? `CONOCIMIENTO DINÁMICO (Contexto extraído por RAG):\n${ticketContext}\n` : ''}
${fullCompanyAndMemoryBlock}
${recentConvosBlock}

### 🎯 ROL Y PERSONALIDAD DE TENSHI
Eres Tenshi, la IA estrella, guía oficial y orquestadora de WAPPY IA. Administras la plataforma central Somos SST (ubicada en /sgsst). Tu personalidad es alegre, carismática, empática, muy espontánea y respetuosa, utilizando modismos paisas colombianos naturales ("parce", "listo", "qué más pues", "bacano", "de una", "hágale").

### ⚡ DIRECTIVAS CRÍTICAS DE VELOCIDAD, ORQUESTACIÓN Y HERRAMIENTAS:
1. **RESPUESTAS INMEDIATAS A PREGUNTAS TEÓRICAS/CONCEPTUALES**: Si el usuario te hace preguntas conceptuales, definiciones teóricas (ej: "¿qué es SST?", "¿qué es un ATS?", "¿cuáles son las obligaciones del empleador?"), saludos o preguntas generales, RESPONDE DIRECTAMENTE EN TEXTO en 1 solo turno de forma concisa y alegre. ¡ESTÁ PROHIBIDO invocar herramientas como 'somos_sst' o 'resumen_empresa' para responder preguntas teóricas!
2. **ORQUESTACIÓN TOTAL Y AUTONOMÍA CON ROL DE AGENTE EXPERTO VS LLAMADO DE AGENTES**:
   - Eres la Directora de Orquesta Central de WAPPY.
   - SI EL USUARIO SOLO HACE LA PREGUNTA O CONSULTA TÉCNICA (ej: dolor lumbar, cómo calificar un accidente, qué hacer con el benceno, qué vientos son seguros para alturas, etc.): TENSHI ACTIVA DE INMEDIATO SU SKILL CON EL ROL DE AGENTE EXPERTO CORRESPONDIENTE (Médico Laboral, Abogado Laboral, Ingeniero Químico SST, Especialista en Alturas y Clima, etc.) y responde él mismo de forma integral, técnica y fundamentada usando sus herramientas y base de datos, sin desviar al usuario ni abrir un chat innecesario.
   - SI EL USUARIO PIDE EXPLÍCITAMENTE CONECTARSE O LLAMAR A UN AGENTE (ej: "conéctame con el médico", "llama al abogado", "pásame al especialista", "quiero el dictamen del médico laboral"): Tenshi tiene restaurada al 100% su capacidad para invocar 'consultar_agente_especializado' (para obtener su dictamen técnico en segundo plano y explicarlo en el chat de Tenshi) o invocar 'wappy_abrir_chat_agente' si el usuario pide ver el chat dedicado o nuevo chat en pantalla ("abre un chat con X").
   - ESTUDIO DE PUESTO DE TRABAJO ERGONÓMICO EN VIVO CON LA FISIOTERAPEUTA ('wappy_iniciar_estudio_ergonomico_vivo'):
     * SIEMPRE que el usuario te diga: "necesito realizar un estudio de puesto de trabajo ergonómico", "quiero hacer un estudio de puesto de trabajo", "hagamos una evaluación ergonómica", "análisis ergonómico en vivo", "llévame al estudio ergonómico con la fisio":
     * INVOCA DE INMEDIATO 'wappy_iniciar_estudio_ergonomico_vivo'.
     * Esta herramienta abrirá automáticamente el Análisis en Vivo por Cámara y Voz con la Fisioterapeuta Laboral (con exoesqueleto 3D MediaPipe, protocolo de 3 fases, matriz CIE-11 y 12 ejercicios de pausas activas), y al finalizar dejará el informe oficial tanto en el chat principal como en tu propio chat de Tenshi listo para ver en pantalla o descargar.
   - NUEVAS APIS ESPECIALIZADAS DE AGENTES:
     * 'wappy_consultar_quimico_pubchem': Consulta oficial a PubChem (NIH) para CID, pictogramas SGA, palabra de advertencia (Peligro/Atención) y frases de peligro H y consejos P (Decreto 1496 de 2018).
     * 'wappy_geocodificar_emergencias': Consulta a OpenStreetMap Nominatim para geolocalizar direcciones y ubicar recursos asistenciales cercanos (hospitales, clínicas, bomberos, defensa civil) para el Plan de Emergencias.
     * 'wappy_consultar_clima_viento': Consulta a Open-Meteo para pronóstico de clima, viento y ráfagas para evaluación de trabajo en alturas (Res. 4272/2021).
3. **GENERACIÓN Y ENTREGA DE INFORMES EN EL CHAT DE TENSHI ('wappy_crear_informe' y 'canvas_tool')**:
   - Cuando el usuario te pida crear, redactar o entregar un informe técnico, INVOCA 'wappy_crear_informe' o 'canvas_tool' con formato HTML, Word o Excel y contenido técnico formal (citando Decreto 1072 de 2015, Res. 0312 de 2019, hallazgos y plan de mejora).
   - El informe se entrega directamente en el chat de Tenshi con visualizador y botones de descarga.
4. **DOCUMENTOS EN WORD Y APLICATIVOS INTERACTIVOS EN CANVAS ('canvas_tool')**:
   - Si el usuario te pide: "créame un documento en Word", "hazme un documento en Word", INVOCA 'canvas_tool' con fileType: 'text' redactando el documento formal completo en el lienzo.
   - Si el usuario te pide: "créame un aplicativo", "hazme un aplicativo", "crea un dashboard", "calculadora interactiva", "simulador", INVOCA 'canvas_tool' con fileType: 'html'.
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
   - Si el usuario te pide: "conéctate con Antigravity", "mira tal carpeta en mi computador", "hazme una investigación con Antigravity", "que Antigravity cree un documento (Word, Excel, PDF, presentación, HTML) y me lo mande al chat":
   - SI LA TAREA INVOLUCRA GOOGLE DRIVE O BÚSQUEDA WEB: ¡Tú mismo puedes resolverla directamente con 'google_drive' y 'web_search'!
   - PARA TAREAS QUE REQUIERAN ACCEDER A CARPETAS DEL COMPUTADOR PERSONAL DEL USUARIO O PROCESAMIENTO PESADO LOCAL: Invoca de inmediato 'wappy_delegar_orden_antigravity' con la instrucción, carpeta/recurso y formato de entregable deseado (word, excel, pdf, presentacion, html).
   - Explícale al usuario con entusiasmo que la orden quedó registrada en la cola de Antigravity con su ID de seguimiento, y que en cuanto Antigravity lo procese en la máquina, el entregable se reflejará directamente en este chat.`;

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
                .filter(m => m && !m.includes('live') && !m.includes('native-audio') && !m.includes('transcribe'));

            // Modelos de texto permitidos y vigentes en WAPPY: gemini-3.5-flash-lite (ultra-rápido prioritario) y gemini-3.6-flash (fallback)
            const allowedTextModels = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];
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
                description: 'Delegación y Orquestación Multi-Agente: Consulta a un Agente Especialista del sistema (Médico Laboral, Psicólogo SST, Abogado Laboral, Auditor, etc.) para resolver dudas técnicas complejas.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        nombre_especialista: { type: 'STRING', description: 'Nombre exacto del agente especialista a consultar.' },
                        consulta_completa: { type: 'STRING', description: 'Consulta técnica detallada.' }
                    },
                    required: ['nombre_especialista', 'consulta_completa']
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
                            description: "Nombre clave del módulo, hito o aplicativo. Hitos 1 al 8: 'diagnostico' (0312), 'participacion_ipevar', 'matriz_ipevar_oficial', 'matriz_pesv_oficial', 'matriz_compatibilidad_oficial', 'vulnerabilidad', 'plan_emergencias', 'responsable', 'politica', 'objetivos', 'legal', 'rhs', 'rit', 'perfil_cargo', 'perfil_socio', 'condiciones_salud', 'copasst', 'cocolab', 'comite_pesv', 'brigada_emergencias', 'animo', 'metodo_owas', 'estudio_puesto', 'peligros', 'permiso_alturas', 'analisis_trabajo_seguro', 'epp_delivery', 'vehicles_pesv', 'heights_lifecycle', 'chemical_registry', 'equipos_emergencia', 'reporte_actos', 'capacitaciones', 'simulacros_emergencia', 'ruta_aprendizaje', 'app_builder', 'estadisticas', 'investigacion_atel', 'control_acpm', 'auditoria', 'alta_direccion', 'investigacion_profunda', 'predictivo'. Aplicativos y Dashboards: 'sgsst', 'planes', 'academia', 'training_admin', 'rutas', 'ruta_admin', 'blog', 'blog_admin', 'events_meet', 'events_meet_admin', 'marketplace' (/marketplace tienda productos SST), 'marketplace_admin', 'agents' (/agents catálogo especialistas IA), 'control' (Kanban), 'animo_dashboard', 'live' (/c/new), 'chat_sst', 'roadmap', 'contactanos', 'comunidad', 'matriz', 'embajadores', 'embajadores_dashboard', 'tenshi_admin', 'search', 'privacy', 'terms', 'about'. Portales públicos: 'public_reportar', 'public_animo', 'public_estudio_puesto', 'public_ipevar', 'public_alta_direccion', 'public_atel', 'public_colaborador', 'public_comites', 'public_convivencia', 'public_votaciones', 'public_inspecciones', 'public_brigadistas'."
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
                description: 'Lee, añade, evalúa o actualiza riesgos viales en la Matriz PESV (Plan Estratégico de Seguridad Vial - Res. 20223040040595).',
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
                description: 'Lee, añade, evalúa o actualiza inventarios de productos químicos en la Matriz de Compatibilidad y Almacenamiento Seguro SGA.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'consultar_contexto_sgsst, leer, escribir, borrar' },
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
                                    pictogramas_sga: { type: 'ARRAY', items: { type: 'STRING' } },
                                    cantidad_almacenada: { type: 'STRING' },
                                    ubicacion: { type: 'STRING' },
                                    tiene_fds: { type: 'STRING' },
                                    tiene_rotulo: { type: 'STRING' },
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
                description: 'Crea, lista, actualiza, ejecuta o elimina automatizaciones de tareas periódicas en segundo plano (/sgsst/automatizaciones).',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        accion: { type: 'STRING', description: 'crear, listar, actualizar, eliminar, ejecutar_ahora, ver_logs' },
                        nombre: { type: 'STRING', description: 'Nombre claro de la automatización.' },
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
                        automatizacion_id: { type: 'STRING', description: 'ID de la automatización para actualizar/eliminar/ejecutar.' },
                        nuevo_estado: { type: 'STRING', description: 'active o inactive' }
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
                description: 'Suite oficial de operaciones y consultas MCP del SG-SST de WAPPY (las 41 herramientas). Permite consultar o alimentar de forma autónoma: diagnóstico 360°, empresa, trabajadores, matriz GTC45, matriz PESV, matriz legal, estándares 0312, comités (COPASST, Convivencia, Brigadas), químicos SGA, vehículos, EPP, reportes de actos y condiciones, perfiles de cargo, casos ATEL, cronograma y tareas, capacitaciones, auditorías y automatizaciones.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        herramienta: {
                            type: 'STRING',
                            description: 'Nombre de la herramienta MCP a ejecutar (ej: wappy_resumen_general_360, wappy_consultar_matriz_gtc45, wappy_consultar_comites, etc.).'
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
                            description: 'Tipo de documento o entregable que Antigravity debe generar: word, excel, pdf, presentacion, html o informe.'
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
                description: "Genera artefactos de estudio en Google NotebookLM: podcast ('audio'), cuestionario ('quiz'), informe ('report'), fichas ('flashcards') o mapa conceptual ('mind_map').",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        cuaderno: { type: "STRING", description: "Nombre o ID del cuaderno." },
                        tipo_artefacto: { type: "STRING", description: "Tipo de contenido: audio, quiz, report, flashcards o mind_map." },
                        instrucciones: { type: "STRING", description: "Instrucciones de enfoque o temas prioritarios." }
                    },
                    required: ["cuaderno", "tipo_artefacto"]
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
                canvasDeclaration,
                operarGUIDeclaration,
                diligenciarFormularioDeclaration,
                seleccionarEmpresaDeclaration,
                wappyActivarEmpresaDeclaration,
                wappyActualizarEmpresaDeclaration,
                gestionarMemoriaDeclaration,
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

            const toolsToAttach = [...baseFunctionDeclarations];
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

            const lastMsgObj = messages[messages.length - 1];
            const lastUserMsg = lastMsgObj?.content || 'Hola';
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
                            generationConfig: { temperature: 0.7 }
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
                                    const toolInstance = new CanvasTool({ req });
                                    toolOutput = await toolInstance._call(call.args);
                                    try {
                                        const parsed = typeof toolOutput === 'string' ? JSON.parse(toolOutput) : toolOutput;
                                        if (parsed?.success) {
                                            const fileType = call.args?.fileType || 'html';
                                            const title = call.args?.title || 'Documento SG-SST';
                                            const content = call.args?.content || '';
                                            capturedFile = {
                                                title,
                                                fileType,
                                                content,
                                                canvasId: `tenshi-canvas-${targetUserId}-${Date.now()}`
                                            };
                                            if (fileType === 'html' || content.includes('<html') || content.includes('<!DOCTYPE')) {
                                                capturedHtmlReport = content;
                                            }
                                        }
                                    } catch (_) {}
                                } else if (call.name === 'matriz_ipevar') {
                                    const MatrizIPEVAR = require('../../app/clients/tools/structured/MatrizIPEVAR');
                                    toolOutput = await new MatrizIPEVAR({ req })._call(call.args);
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
                                    requestedGuiAction = {
                                        name: 'wappy_navegar',
                                        accion: 'navegar',
                                        modulo: 'training',
                                        ruta: targetRoute,
                                        args: { ruta: targetRoute, modulo: 'training' }
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
                                    requestedGuiAction = {
                                        name: 'wappy_navegar',
                                        accion: 'navegar',
                                        modulo: 'blog',
                                        ruta: targetRoute,
                                        args: { ruta: targetRoute, modulo: 'blog' }
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
                                    requestedGuiAction = {
                                        action: 'wappy_controlar_videollamada',
                                        accion: rawAccion,
                                    };
                                    toolOutput = JSON.stringify({
                                        success: true,
                                        accion: rawAccion,
                                        message: rawAccion === 'activar_camara'
                                            ? 'Cámara y videollamada activadas con éxito.'
                                            : rawAccion === 'apagar_camara'
                                            ? 'Cámara apagada con éxito.'
                                            : 'Llamada finalizada y colgada a petición del usuario.'
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
                                    const res = await executeTenshiMcpTool('wappy_retirar_trabajador', argsToSend, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_actualizar_trabajador') {
                                    const rawArgs = call.args || {};
                                    const target = rawArgs.idOrCedula || rawArgs.id || rawArgs.cedula || rawArgs.nombre || rawArgs.identificacion || rawArgs.target || '';
                                    const argsToSend = { ...rawArgs, idOrCedula: target, id: target };
                                    const res = await executeTenshiMcpTool('wappy_actualizar_trabajador', argsToSend, targetUserId);
                                    toolOutput = JSON.stringify(res);
                                } else if (call.name === 'wappy_consultar_trabajadores') {
                                    const res = await executeTenshiMcpTool('wappy_consultar_trabajadores', call.args || {}, targetUserId);
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
                                 } else if (call.name === 'wappy_mcp_sst' || call.name in TOOL_ROUTES || (call.name.startsWith('wappy_') && !['wappy_navegar', 'wappy_diligenciar_formulario', 'wappy_seleccionar_empresa', 'wappy_activar_empresa'].includes(call.name))) {
                                    const targetTool = call.name === 'wappy_mcp_sst' ? (call.args?.herramienta || call.args?.tool || 'wappy_resumen_general_360') : call.name;
                                    const targetArgs = call.name === 'wappy_mcp_sst' ? (call.args?.parametros || call.args?.args || call.args || {}) : (call.args || {});
                                    const res = await executeTenshiMcpTool(targetTool, targetArgs, targetUserId);
                                    if ((targetTool === 'wappy_delegar_orden_antigravity' || targetTool === 'delegar_orden_antigravity') && res?.ordenId) {
                                        capturedDelegatedOrder = {
                                            ordenId: res.ordenId,
                                            titulo: res.detalles?.titulo || targetArgs?.titulo || 'Orden Antigravity',
                                            formato: res.detalles?.formatoEntregable || targetArgs?.tipo_entregable || 'html',
                                            estado: res.estado || 'todo',
                                        };
                                    }
                                    toolOutput = JSON.stringify(res);
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

                        try {
                            responseText = responseResult.response.text();
                        } catch (textErr) {
                            responseText = '';
                        }

                        if (!responseText || !responseText.trim()) {
                            const hasGuiAction = Boolean(requestedGuiAction || (requestedGuiActions && requestedGuiActions.length > 0));
                            const hasGeneratedArtifact = Boolean(capturedFile || capturedHtmlReport || capturedQrCode);
                            if (hasGuiAction) {
                                responseText = "Entendido, procedo a realizar una acción en la pantalla...";
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
        }

        if (responseText && (!requestedGuiAction || requestedGuiAction.name === 'wappy_iniciar_estudio_ergonomico_vivo') && (!requestedGuiActions || requestedGuiActions.length === 0)) {
            await TenshiMessage.create({
                user: req.user.id,
                role: 'assistant',
                content: responseText,
                htmlReport: capturedHtmlReport || undefined,
                qrCode: capturedQrCode || undefined,
                file: capturedFile || undefined,
            }).catch(e => console.error('Error saving assistant TenshiMessage:', e));
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
                            content: capturedFile?.content || capturedHtmlReport || '',
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

module.exports = router;
