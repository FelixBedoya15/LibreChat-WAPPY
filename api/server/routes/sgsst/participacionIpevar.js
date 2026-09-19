const express = require('express');
const { generateWithKeyRotation, resolveApiKeys } = require('./sgsstGemini');
const mongoose = require('mongoose');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const GTC45WorkspaceSession = require('../../../models/GTC45WorkspaceSession');
const { buildStandardHeader, buildSignatureSection, buildCompanyContextString } = require('./reportHeader');
const { logger } = require('~/config');
const feedWorkerEvent = require('./feedWorkerHelper');

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

// ─── Mongoose Schema for Raw Data ───────────────────────────────────────
const ParticipacionIpevarDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
    participacionesList: { type: Array, default: [] },
    inboxPublico: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now },
}, { strict: false });

const ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData || mongoose.model('ParticipacionIpevarData', ParticipacionIpevarDataSchema);

// ─── GET /data — Load saved data and inbox ─────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const companyId = await getActiveCompanyId(req.user.id);
        const data = await ParticipacionIpevarData.findOne({ user: req.user.id, companyId: companyId });
        if (data) {
            return res.json({
                participacionesList: data.participacionesList || [],
                inboxPublico: data.inboxPublico || [],
                updatedAt: data.updatedAt,
            });
        }
        res.json({ participacionesList: [], inboxPublico: [] });
    } catch (error) {
        logger.error('[SGSST ParticipacionIPEVAR] Load error:', error);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});

// ─── GET /official-matrix-rows — Obtener peligros de la matriz oficial activa ──────
router.get('/official-matrix-rows', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = await getActiveCompanyId(userId);
        const officialConvoId = `official-${companyId || userId}`;

        let session = await GTC45WorkspaceSession.findOne({
            user: userId,
            ...(companyId ? { companyId } : {}),
            isOfficial: true,
        });

        if (!session) {
            session = await GTC45WorkspaceSession.findOne({ conversationId: officialConvoId });
        }

        if (!session || !Array.isArray(session.matrixRows)) {
            return res.json({ hasOfficial: false, rows: [] });
        }

        const rows = session.matrixRows.map((r, idx) => ({
            id: r.id || `row-${idx}`,
            cargo: r.cargo || '',
            proceso: r.proceso || '',
            zona: r.zona || '',
            actividad: r.actividad || '',
            tarea: r.tareas || r.tarea || '',
            peligro_clasificacion: r.peligro_clasificacion || '',
            peligro_descripcion: r.peligro_descripcion || '',
            interpretacion_nr: r.interpretacion_nr || '',
            nr: r.nr || 0,
            aceptabilidad: r.aceptabilidad || ''
        }));

        res.json({
            hasOfficial: true,
            officialTitle: session.officialTitle || 'Matriz IPEVAR SG-SST',
            rows
        });
    } catch (error) {
        logger.error('[SGSST ParticipacionIPEVAR] Get official rows error:', error);
        res.status(500).json({ error: 'Error al consultar filas de la matriz oficial' });
    }
});

// ─── POST /apply-to-matrix — Aprobar reporte e integrar en la Matriz IPEVAR ────────
router.post('/apply-to-matrix', requireJwtAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = await getActiveCompanyId(userId);
        const { reportId, action, targetRowId, matrixData } = req.body;

        if (!matrixData) {
            return res.status(400).json({ error: 'Datos del peligro requeridos' });
        }

        const officialConvoId = `official-${companyId || userId}`;

        let session = await GTC45WorkspaceSession.findOne({
            user: userId,
            ...(companyId ? { companyId } : {}),
            isOfficial: true,
        });

        if (!session) {
            session = await GTC45WorkspaceSession.findOne({ conversationId: officialConvoId });
        }

        if (!session) {
            session = new GTC45WorkspaceSession({
                conversationId: officialConvoId,
                user: userId,
                companyId,
                matrixRows: [],
                chartConclusions: {},
                isOfficial: true,
                officialTitle: 'Matriz IPEVAR SG-SST',
                promotedAt: new Date(),
            });
        }

        let resultingRowId = targetRowId;

        if (action === 'update_existing' && targetRowId) {
            const rowIndex = session.matrixRows.findIndex(r => r.id === targetRowId);
            if (rowIndex === -1) {
                return res.status(404).json({ error: 'Peligro no encontrado en la matriz oficial' });
            }
            const row = session.matrixRows[rowIndex];

            if (matrixData.peligros) {
                const workerAporte = `[Aporte de Colaborador ${matrixData.trabajadorNombre || ''}]: ${matrixData.peligros}`;
                if (!row.peligro_descripcion?.includes(matrixData.peligros)) {
                    row.peligro_descripcion = row.peligro_descripcion ? `${row.peligro_descripcion}\n${workerAporte}` : workerAporte;
                }
            }
            if (matrixData.sugeridoEliminacion && !row.medida_eliminacion?.includes(matrixData.sugeridoEliminacion)) {
                row.medida_eliminacion = row.medida_eliminacion ? `${row.medida_eliminacion} | ${matrixData.sugeridoEliminacion}` : matrixData.sugeridoEliminacion;
            }
            if (matrixData.sugeridoIngenieria && !row.medida_ingenieria?.includes(matrixData.sugeridoIngenieria)) {
                row.medida_ingenieria = row.medida_ingenieria ? `${row.medida_ingenieria} | ${matrixData.sugeridoIngenieria}` : matrixData.sugeridoIngenieria;
            }
            if (matrixData.sugeridoAdministrativo && !row.medida_administrativa?.includes(matrixData.sugeridoAdministrativo)) {
                row.medida_administrativa = row.medida_administrativa ? `${row.medida_administrativa} | ${matrixData.sugeridoAdministrativo}` : matrixData.sugeridoAdministrativo;
            }
            if (matrixData.sugeridoEPP && !row.medida_eppu?.includes(matrixData.sugeridoEPP)) {
                row.medida_eppu = row.medida_eppu ? `${row.medida_eppu} | ${matrixData.sugeridoEPP}` : matrixData.sugeridoEPP;
            }
            if (matrixData.efectosPosibles && !row.efectos_posibles?.includes(matrixData.efectosPosibles)) {
                row.efectos_posibles = row.efectos_posibles ? `${row.efectos_posibles} | ${matrixData.efectosPosibles}` : matrixData.efectosPosibles;
            }

            session.matrixRows[rowIndex] = row;
        } else {
            // Default: create_new
            const sev = matrixData.severidadPercibida || 'Media';
            let nd = 6, ne = 2, nc = 25;
            if (sev === 'Crítica') {
                nd = 10; ne = 4; nc = 60;
            } else if (sev === 'Alta') {
                nd = 6; ne = 3; nc = 25;
            } else if (sev === 'Baja') {
                nd = 2; ne = 2; nc = 10;
            }
            const np = nd * ne;
            const interpretacion_np = np >= 24 ? 'Muy Alto (MA)' : np >= 10 ? 'Alto (A)' : np >= 6 ? 'Medio (M)' : 'Bajo (B)';
            const nr = np * nc;
            const interpretacion_nr = nr >= 600 ? 'I' : nr >= 150 ? 'II' : nr >= 40 ? 'III' : 'IV';
            const aceptabilidad = nr >= 600 ? 'No Aceptable' : nr >= 150 ? 'No Aceptable o Aceptable con Control Específico' : nr >= 40 ? 'Mejorable' : 'Aceptable';

            const newId = `row-part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            resultingRowId = newId;

            const newRow = {
                id: newId,
                cargo: matrixData.cargo || 'Personal Operativo',
                proceso: matrixData.proceso || 'Operativo',
                zona: matrixData.zona || 'Área de trabajo',
                actividad: matrixData.actividad || matrixData.tarea || 'Labor general',
                tareas: matrixData.tarea || 'Tarea identificada',
                rutinaria: matrixData.rutinaria || 'Sí',
                peligro_clasificacion: matrixData.peligroClasificacion || 'Condiciones de Seguridad',
                peligro_descripcion: matrixData.peligros || 'Peligro identificado en participación comunitaria',
                efectos_posibles: matrixData.efectosPosibles || 'Lesiones osteomusculares / Golpes / Traumatismos',
                controles_fuente: matrixData.controlesExistentes || 'Ninguno reportado',
                controles_medio: 'Ninguno reportado',
                controles_individuo: matrixData.controlesExistentes || 'Uso básico de EPP',
                nd,
                ne,
                np,
                interpretacion_np,
                nc,
                nr,
                interpretacion_nr,
                aceptabilidad,
                medida_eliminacion: matrixData.sugeridoEliminacion || '',
                medida_sustitucion: '',
                medida_ingenieria: matrixData.sugeridoIngenieria || '',
                medida_administrativa: matrixData.sugeridoAdministrativo || '',
                medida_eppu: matrixData.sugeridoEPP || '',
                factores_reduccion: `Aporte participativo de ${matrixData.trabajadorNombre || 'colaborador'}: control con impacto directo en fuente/medio para prevenir ${matrixData.efectosPosibles || 'accidentes o enfermedades'}.`,
                nro_expuestos: 1,
                peor_consecuencia: matrixData.efectosPosibles || 'Accidente de trabajo con incapacidad',
                requisito_legal: 'Sí'
            };

            session.matrixRows.push(newRow);
        }

        session.markModified('matrixRows');
        await session.save();

        // Actualizar el estado del reporte en ParticipacionIpevarData
        const partDoc = await ParticipacionIpevarData.findOne({ user: userId, companyId });
        if (partDoc) {
            if (Array.isArray(partDoc.participacionesList)) {
                partDoc.participacionesList = partDoc.participacionesList.map(p => {
                    if (String(p.id) === String(reportId)) {
                        p.status = 'applied_to_matrix';
                        p.matrixAction = action;
                        p.matrixRowId = resultingRowId;
                        p.appliedAt = new Date();
                    }
                    return p;
                });
                partDoc.markModified('participacionesList');
            }
            if (Array.isArray(partDoc.inboxPublico)) {
                partDoc.inboxPublico = partDoc.inboxPublico.map(item => {
                    if (String(item.id) === String(reportId)) {
                        item.status = 'applied_to_matrix';
                        item.matrixAction = action;
                        item.matrixRowId = resultingRowId;
                        item.appliedAt = new Date();
                    }
                    return item;
                });
                partDoc.markModified('inboxPublico');
            }
            await partDoc.save();
        }

        // Premiar al colaborador (+150 pts de gamificación en Hoja de Vida Bio-Individual)
        if (matrixData.trabajadorCedula) {
            try {
                await feedWorkerEvent(
                    userId,
                    matrixData.trabajadorCedula,
                    'participacion_ipevar',
                    `Aprobación e Integración en Matriz IPEVAR Oficial: ${matrixData.peligros ? matrixData.peligros.substring(0, 60) : 'Peligro'}`,
                    150,
                    'approved'
                );
            } catch (feedErr) {
                logger.warn('[SGSST ParticipacionIPEVAR] Worker event feed error:', feedErr.message);
            }
        }

        res.json({
            success: true,
            message: action === 'update_existing' 
                ? 'Peligro actualizado exitosamente en la Matriz IPEVAR Oficial.' 
                : 'Nuevo peligro integrado exitosamente a la Matriz IPEVAR Oficial.',
            targetRowId: resultingRowId,
            action
        });
    } catch (error) {
        logger.error('[SGSST ParticipacionIPEVAR] Apply to matrix error:', error);
        res.status(500).json({ error: 'Error al integrar peligro a la matriz oficial' });
    }
});

// ─── POST /save — Save current form ─────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { participacionesList } = req.body;
        const companyId = await getActiveCompanyId(req.user.id);

        await ParticipacionIpevarData.findOneAndUpdate(
            { user: req.user.id, companyId: companyId },
            { $set: { participacionesList, companyId, updatedAt: Date.now() } },
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
        const companyId = await getActiveCompanyId(req.user.id);
        const doc = await ParticipacionIpevarData.findOne({ user: req.user.id, companyId });
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
        const companyId = await getActiveCompanyId(req.user.id);
        const doc = await ParticipacionIpevarData.findOne({ user: req.user.id, companyId });
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
        const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();
        const finalModelName = modelName || preferredModel;
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: finalModelName });

        const currentDate = new Date().toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

        let loadedCompanyInfo = null;
        try {
            loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean()
                || await CompanyInfo.findOne({ user: req.user.id }).lean();
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

        const result = await generateWithKeyRotation(model, req.user?.id || req.user, parts);
        const response = await result.response;
        const htmlBody = response.text().replace(/\`\`\`html\\n ?/g, '').replace(/\`\`\`/g, '').trim();

        let fullReport = headerHTML + '<div style="margin-top: 20px;">' + htmlBody + '</div>';

        if (loadedCompanyInfo) {
            fullReport += buildSignatureSection(loadedCompanyInfo);
        }

        const companyId = await getActiveCompanyId(req.user.id);

        // Auto-save the generated report
        await ParticipacionIpevarData.findOneAndUpdate(
            { user: req.user.id, companyId },
            { $set: { consolidadoReport: fullReport, updatedAt: Date.now() } },
            { upsert: true, new: true }
        );

        // ── Auto-Feed Bio-Individual (Hoja de Vida) ──
        if (trabajadoresList && trabajadoresList.length > 0) {
            const shortDesc = formData?.tarea ? formData.tarea.substring(0, 80) + '...' : 'Participación IPEVAR';
            for (const t of trabajadoresList) {
                if (t.cedula) {
                    await feedWorkerEvent(req.user.id || req.user, t.cedula, 'participacion_ipevar', shortDesc, 100, 'generate');
                }
            }
        }

        res.json({ report: fullReport });
    } catch (error) {
        logger.error('[SGSST Participacion IPEVAR] Generation error:', error);
        res.status(500).json({ error: 'Error al generar Pre-Matriz de Participación' });
    }
});

module.exports = router;
