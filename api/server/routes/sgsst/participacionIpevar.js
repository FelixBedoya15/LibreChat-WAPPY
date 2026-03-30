const express = require('express');
const { generateWithKeyRotation, resolveApiKeys } = require('./sgsstGemini');
const mongoose = require('mongoose');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection, buildCompanyContextString } = require('./reportHeader');
const { logger } = require('~/config');

const router = express.Router();

// ─── Mongoose Schema for Participacion IPEVAR Trabajadores  ──────────────────
const ParticipacionIpevarDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formData: { type: Object, default: {} },
    trabajadoresList: { type: Array, default: [] },
    responsablesList: { type: Array, default: [] },
    images: { type: Object, default: {} },
    video: { type: String, default: null },
    inboxPublico: { type: Array, default: [] },
    consolidadoReport: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
});

ParticipacionIpevarDataSchema.index({ user: 1 }, { unique: true });

const ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData || mongoose.model('ParticipacionIpevarData', ParticipacionIpevarDataSchema);

// ─── GET /data — Load saved data and inbox ─────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const data = await ParticipacionIpevarData.findOne({ user: req.user.id });
        if (data) {
            return res.json({
                formData: data.formData || {},
                trabajadoresList: data.trabajadoresList || [],
                responsablesList: data.responsablesList || [],
                images: data.images || {},
                video: data.video || null,
                inboxPublico: data.inboxPublico || [],
                consolidadoReport: data.consolidadoReport || '',
            });
        }
        res.json({ formData: {}, trabajadoresList: [], responsablesList: [], images: {}, inboxPublico: [], consolidadoReport: '' });
    } catch (error) {
        logger.error('[SGSST ParticipacionIPEVAR] Load error:', error);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});

// ─── POST /save — Save current form ─────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { formData, trabajadoresList, responsablesList, images, video } = req.body;
        await ParticipacionIpevarData.findOneAndUpdate(
            { user: req.user.id },
            { $set: { formData, trabajadoresList, responsablesList, images, video, updatedAt: Date.now() } },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        logger.error('[SGSST ParticipacionIPEVAR] Save error:', error);
        res.status(500).json({ error: 'Error al guardar datos' });
    }
});

// ─── POST /inbox/dismiss — Remove an item from the public inbox ───
router.post('/inbox/dismiss', requireJwtAuth, async (req, res) => {
    try {
        const { reportId } = req.body;
        const doc = await ParticipacionIpevarData.findOne({ user: req.user.id });
        if (doc && doc.inboxPublico) {
            doc.inboxPublico = doc.inboxPublico.filter(item => String(item.id) !== String(reportId));
            await doc.save();
        }
        res.json({ success: true, inboxPublico: doc.inboxPublico || [] });
    } catch (error) {
        logger.error('[SGSST ParticipacionIPEVAR] Inbox dismiss error:', error);
        res.status(500).json({ error: 'Error al descartar reporte' });
    }
});

// ─── POST /inbox/mark-processed — Mark an item as processed  ───
router.post('/inbox/mark-processed', requireJwtAuth, async (req, res) => {
    try {
        const { reportId } = req.body;
        const doc = await ParticipacionIpevarData.findOne({ user: req.user.id });
        if (doc && doc.inboxPublico) {
            doc.inboxPublico = doc.inboxPublico.map(item => {
                if (String(item.id) === String(reportId)) {
                    item.status = 'processed';
                }
                return item;
            });
            doc.markModified('inboxPublico');
            await doc.save();
        }
        res.json({ success: true, inboxPublico: doc.inboxPublico || [] });
    } catch (error) {
        logger.error('[SGSST ParticipacionIPEVAR] Inbox mark-processed error:', error);
        res.status(500).json({ error: 'Error al marcar reporte como procesado' });
    }
});

 // ─── POST /generate — Create the Pre-Matrix from Form Data ─────────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const { formData, trabajadoresList, responsablesList, images, video, modelName } = req.body;

        const trabajadoresStr = trabajadoresList?.map(t => `${t.nombre || 'Sin nombre'} (CC: ${t.cedula || 'N/A'})`).join(', ') || '[PENDIENTE]';
        const responsablesStr = responsablesList?.map(r => `${r.nombre || 'Sin nombre'} - ${r.rol || 'Sin Rol'} (CC: ${r.cedula || 'N/A'})`).join(', ') || '[PENDIENTE]';

        let resolvedApiKey = null;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed['google'] || parsed.apiKey || parsed.GOOGLE_API_KEY;
            } catch (pErr) {
                resolvedApiKey = storedKey;
            }
        } catch (err) {
            logger.debug('[SGSST ParticipacionIPEVAR] No user Google key found, trying env vars:', err.message);
        }

        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (resolvedApiKey && typeof resolvedApiKey === 'string') {
            resolvedApiKey = resolvedApiKey.split(',')[0].trim();
        }

        if (!resolvedApiKey || resolvedApiKey === 'user_provided') {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del menú principal e intenta nuevamente.',
            });
        }

        const personalization = req.user?.personalization?.geminiModels;
        const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim();
        const finalModelName = modelName || preferredModel;
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: finalModelName });

        const currentDate = new Date().toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

        let loadedCompanyInfo = null;
        try {
            loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
        } catch (e) {
            logger.warn('Failed to load company info for participacion ipevar');
        }

        const headerHTML = buildStandardHeader({
            title: 'ANÁLISIS DE REPORTE: PARTICIPACIÓN IPEVAR DE TRABAJADORES',
            companyInfo: loadedCompanyInfo,
            date: currentDate,
            norm: 'Directrices SG-SST (Decreto 1072 de 2015, Art. 2.2.4.6.15 - Participación en identificación de peligros)',
            responsibleName: req.user?.name,
        });

        const promptText = `
Eres un Experto Técnico Senior en Seguridad y Salud en el Trabajo (SST).
Tu objetivo es analizar el reporte de participación e identificación de peligros (IPEVAR) presentado por un trabajador, y generar un **Documento de Análisis Técnico para Pre-Matriz**.

**INFORMACIÓN SUMINISTRADA POR FORMULARIO:**
- Trabajador(es) expuesto(s): ${trabajadoresStr}
- Responsable(s) de área: ${responsablesStr}
- Labor o Tarea Evaluada: ${formData?.tarea || 'N/A'}
- Peligros Identificados: ${formData?.peligros || 'N/A'}
- Controles Existentes observados: ${formData?.controlesExistentes || 'Ninguno'}
- ¿El trabajador considera suficientes los controles?: ${formData?.suficientes ? 'Sí' : 'No'}
- Controles sugeridos Ingeniería: ${formData?.sugeridoIngenieria || 'N/A'}
- Controles sugeridos Administrativo: ${formData?.sugeridoAdministrativo || 'N/A'}
- Controles sugeridos EPP: ${formData?.sugeridoEPP || 'N/A'}
- Notas adicionales (Analista SST / Dictado de Voz): ${formData?.actividadGlobal || 'Sin notas'}
- EVIDENCIA ADJUNTA: Se han adjuntado fotografías y, opcionalmente, un video corto (máximo 10 segundos) que muestra la tarea o el peligro en tiempo real. Analiza detalladamente tanto las imágenes como el video para dar un dictamen técnico preciso.

**INSTRUCCIONES DE ESTRUCTURA Y CONTENIDO OBLIGATORIO (Tu respuesta DEBE contener exclusivamente código HTML):**

1️⃣ **Evaluación y Traducción Técnica (GTC 45 u otra normativa)**
Redacta un párrafo profesional que tome la percepción del trabajador y la convierta en vocabulario técnico formal. Describe la exposición al riesgo en términos claros para insertar luego en una matriz de peligros.
Enciérralo en este contenedor HTML exacto:
\`<div style="border-left: 4px solid #0f766e; background-color: #f0fdfa; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px; margin-top: -10px; font-size: 13.5px; color: #115e59; line-height: 1.6;"><strong>Evaluación Experta SG-SST:</strong> [TU TEXTO]</div>\`

2️⃣ **Ficha de Identificación de Peligros (Para Pre-Matriz)**
Genera una tabla con dos columnas (Aspecto, Detalle Técnico):
Incluye los siguientes campos: Clasificación del Peligro, Efectos Posibles, Peor Consecuencia, Nivel de Deficiencia Estimado, Observaciones de Controles Existentes.

3️⃣ **Análisis y Viabilidad de Controles Sugeridos**
Genera una tabla con 3 columnas (Tipo de Control Sugerido, Propuesta del Trabajador, Viabilidad y Acción Práctica).
Fila 1: Ingeniería, Fila 2: Administrativo, Fila 3: EPP. Agrega una fila 4 si consideras un control faltante necesario.

**INSTRUCCIONES DE DISEÑO HTML Y TABLAS:**
- Tu respuesta DEBE ser EXCLUSIVAMENTE en código HTML puro, sin bloques markdown como \`\`\`html.
- Estructura base de TODAS las tablas: \`<table style="width: 100%; table-layout: auto; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 25px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">\`
- Encabezados de tabla (<th>): \`<th style="background-color: #0f172a; color: #ffffff; padding: 12px 14px; font-size: 13px; font-weight: 700; text-transform: uppercase; text-align: left; border-bottom: 1px solid #1e293b;">\`
- Celdas (<td>): \`<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; font-size: 13px; color: #334155; vertical-align: top; background-color: #ffffff;">\`
- NO incluyas tablas de firmas.
`;

        const parts = [{ text: promptText }];
        
        // Incluir las imágenes si existen (hasta 3)
        ['foto1', 'foto2', 'foto3'].forEach((imgKey, idx) => {
            const b64 = images?.[imgKey];
            if (b64) {
                const match = b64.match(/^data:(image\/\w+);base64,(.+)$/);
                if (match && match.length === 3) {
                    parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
                    parts.push({ text: `(Fotografía de Referencia #${idx + 1} adjunta al reporte)` });
                }
            }
        });
        
        // Incluir video si existe
        if (video) {
            const match = video.match(/^data:(video\/\w+);base64,(.+)$/);
            if (match && match.length === 3) {
                parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
                parts.push({ text: `(Video corto de evidencia adjunto al reporte - Analizar comportamiento y entorno)` });
            }
        }

        const result = await generateWithKeyRotation(model, req.user?.id || req.user, parts, { useWebSearch: true });
        const response = await result.response;
        const htmlBody = response.text().replace(/\`\`\`html\\n ?/g, '').replace(/\`\`\`/g, '').trim();

        let fullReport = headerHTML + '<div style="margin-top: 20px;">' + htmlBody + '</div>';

        if (loadedCompanyInfo) {
            fullReport += buildSignatureSection(loadedCompanyInfo);
        }

        // Auto-save the generated report
        await ParticipacionIpevarData.findOneAndUpdate(
            { user: req.user.id },
            { $set: { consolidadoReport: fullReport, updatedAt: Date.now() } },
            { upsert: true, new: true }
        );

        res.json({ report: fullReport });
    } catch (error) {
        logger.error('[SGSST Participacion IPEVAR] Generation error:', error);
        res.status(500).json({ error: 'Error al generar Pre-Matriz de Participación' });
    }
});

module.exports = router;
