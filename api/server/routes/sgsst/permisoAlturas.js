const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { logger } = require('~/config');

const router = express.Router();
const mongoose = require('mongoose');

// ─── Mongoose Schema for Raw Data ──────────────────────────────────────
const PermisoAlturasDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formData: { type: Object, default: {} },
    trabajadoresList: { type: Array, default: [] },
    responsablesList: { type: Array, default: [] },
    images: { type: Object, default: {} },
    updatedAt: { type: Date, default: Date.now },
});

PermisoAlturasDataSchema.index({ user: 1 }, { unique: true });

const PermisoAlturasData = mongoose.models.PermisoAlturasData || mongoose.model('PermisoAlturasData', PermisoAlturasDataSchema);

// ─── GET /data — Load saved permiso alturas data ─────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const data = await PermisoAlturasData.findOne({ user: req.user.id });
        if (data) {
            return res.json({
                formData: data.formData || {},
                trabajadoresList: data.trabajadoresList || [],
                responsablesList: data.responsablesList || [],
                images: data.images || { foto1: null, foto2: null, foto3: null },
            });
        }
        res.json({ formData: {}, trabajadoresList: [], responsablesList: [], images: { foto1: null, foto2: null, foto3: null } });
    } catch (error) {
        logger.error('[SGSST PermisoAlturas] Load error:', error);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});

// ─── POST /save — Save permiso alturas data ─────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { formData, trabajadoresList, responsablesList, images } = req.body;
        await PermisoAlturasData.findOneAndUpdate(
            { user: req.user.id },
            { $set: { formData, trabajadoresList, responsablesList, images, updatedAt: Date.now() } },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        logger.error('[SGSST PermisoAlturas] Save error:', error);
        res.status(500).json({ error: 'Error al guardar datos' });
    }
});

router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const { formData, trabajadoresList, responsablesList, images, modelName } = req.body;

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
            logger.debug('[SGSST Permiso Alturas] No user Google key found, trying env vars:', err.message);
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

        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

        const currentDate = new Date().toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

        let loadedCompanyInfo = null;
        try {
            loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
        } catch (e) {
            logger.warn('Failed to load company info for permiso');
        }

        const headerHTML = buildStandardHeader({
            title: 'PERMISO DE TRABAJO EN ALTURAS',
            companyInfo: loadedCompanyInfo,
            date: currentDate,
            norm: 'Resolución 4272 de 2021',
            responsibleName: req.user?.name,
        });

        const promptText = `
🧠 PROMPT DEFINITIVO – ASISTENTE DE PERMISOS DE TRABAJO EN ALTURAS
Eres un Asistente especializado en la gestión de permisos de trabajo en alturas, con amplio conocimiento en la normatividad colombiana vigente (Resolución 4272 de 2021, Decreto 1072 de 2015, Resolución 0312 de 2019, entre otras) y en los estándares internacionales de seguridad para la prevención de caídas.
Tu función es diligenciar permisos de trabajo en alturas de forma completa, clara y práctica, utilizando TABLAS PROFESIONALES para cada sección, guiando al usuario paso a paso hasta que el permiso pueda ser aprobado de manera segura.

⚙️ FUNCIONAMIENTO GENERAL (REGLAS MAESTRAS)
1. El asistente siempre entregará el permiso en su respuesta, incluso si faltan datos o fotografías.
2. Si faltan datos obligatorios, el permiso NO será aprobado, y el asistente mostrará claramente al final de la respuesta:
🚫 “Este permiso aún NO está aprobado.”
3. Marcado de estados:
   - Campos vacíos: <strong style="color: red;">[PENDIENTE]</strong>
   - Observaciones sin datos: <strong style="color: #eab308;">⚠️ [INFORMACIÓN PENDIENTE: ...]</strong>
4. Evaluación de Aprobación:
   - Todo completo y sin riesgos críticos residuales → <strong style="color: green;">🟢 PERMISO APROBADO PARA EJECUCIÓN.</strong>
   - Riesgos críticos presentes → <strong style="color: red;">🚫 Permiso NO aprobado hasta que se mitiguen.</strong> (Entregar acciones correctivas concretas).
5. Tono: Profesional, humano y preventivo (Coordinador HSE experimentado).

DATOS APORTADOS POR EL USUARIO PARA EL DILIGENCIAMIENTO:
- Empresa: ${loadedCompanyInfo?.companyName || 'N/A'}
- Trabajadores implicados: ${trabajadoresStr}
- Fecha: ${formData.fecha || '[PENDIENTE]'} (Horario: ${formData.horaInicio || '[PENDIENTE]'} a ${formData.horaFin || '[PENDIENTE]'})
- Seguridad social vigente: ${formData.seguridadSocial || 'Sí'} (Si no se especifica, asume que el usuario marcó "Sí" en el selector)
- Aptitud médica ocupacional: ${formData.aptitudMedica || 'Sí'}
- Certificación trabajo en alturas: ${formData.certificacionAlturas || 'Sí'}
- Actividad técnica reportada: ${formData.actividadGlobal || '[No se proporcionó descripción técnica]'}
- Responsables: ${responsablesStr}
- Descripciones de fotos:
  1. Lugar: ${formData.foto1Desc || 'Sin descripción técnica'}
  2. Sistema acceso: ${formData.foto2Desc || 'Sin descripción técnica'}
  3. Trabajador EPP: ${formData.foto3Desc || 'Sin descripción técnica'}

ESTRUCTURA OBLIGATORIA (DEBES USAR TABLAS HTML PARA TODO):

1️⃣ Información General (Tabla con campos: Nombre Trabajador, Tipo Trabajo, Altura, Fecha/Hora, SS, Aptitud, Certificación).
2️⃣ Fotografías de la Actividad (Tabla con columnas: Descripción y Estado/Análisis Técnico detallado de lo que el usuario describe en las fotos).
3️⃣ Descripción de la Actividad (Usa una lista numerada interna en una celda de tabla para los pasos: Preparación, Inspección, Ejecución, Cierre).
4️⃣ Verificación de Sistemas y Equipos (Tabla: Ítem, Revisión ✅/❌/🚫, Observaciones Técnicas).
5️⃣ Seguridad Eléctrica y Condiciones Externas (Tabla: Requisito, Cumplimiento, Observaciones).
6️⃣ Análisis de Trabajo Seguro (ATS): TABLA EXTENSA (Paso, Peligro, Riesgo, Probabilidad, Severidad, Nivel de Riesgo, Medidas de Control).
7️⃣ Identificación de Riesgos Detectados: Analiza técnicamente cada etapa (Preparación, Inspección, Ejecución, Cierre) en una tabla detallada indicando consecuencias y controles.
8️⃣ Observaciones Generales: Tabla con Decisión GO/NO-GO, evaluación de riesgos residuales y estado del plan de rescate.
9️⃣ Responsables (Mencionar los nombres aportados en formato tabla).
🔟 Estado del Permiso (Aplicar reglas maestras con emoticonos y colores).

MUY IMPORTANTE:
- NO incluyas tablas de firmas reales ni botones al final.
- NO incluyas etiquetas <img> dentro del texto generado.
- Usa tablas (<table>) con width="100%", style="border-collapse: collapse; border: 1px solid #ddd; margin-bottom: 20px;".
- Los encabezados de tabla (<th>) deben tener background-color: #004d99; color: white; padding: 10px; font-size: 14px; text-align: left;.
- Las celdas (<td>) deben tener padding: 8px; border: 1px solid #eee; font-size: 13px;.
`;

        const parts = [
            { text: promptText },
        ];

        if (images) {
            Object.keys(images).forEach((key, index) => {
                const b64 = images[key];
                if (b64) {
                    const match = b64.match(/^data:(image\/\w+);base64,(.+)$/);
                    if (match && match.length === 3) {
                        parts.push({
                            inlineData: {
                                data: match[2],
                                mimeType: match[1]
                            }
                        });
                        // Adding context to the model to know what image it is observing
                        parts.push({ text: `(Foto ${index + 1}: ${key})` });
                    }
                }
            });
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const htmlBody = response.text().replace(/```html\n ? /g, '').replace(/```\n?/g, '').trim();

        // Incorporate the images in the final report HTML
        let imagesHtml = '';
        if (images.foto1 || images.foto2 || images.foto3) {
            imagesHtml = `
                <div style="margin-top: 30px; margin-bottom: 30px;">
                    <h3 style="color: #004d99; border-bottom: 2px solid #004d99; padding-bottom: 5px;">ANEXO: DOCUMENTACIÓN FOTOGRÁFICA DE LA ACTIVIDAD</h3>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
            `;

            const labels = ['Lugar de Trabajo', 'Sistema de Acceso', 'Trabajador con EPP'];
            ['foto1', 'foto2', 'foto3'].forEach((k, i) => {
                if (images[k]) {
                    imagesHtml += `
                        <div style="flex: 1; min-width: 250px; border: 1px solid #ddd; padding: 10px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <img src="${images[k]}" style="width: 100%; height: auto; max-width: 300px; border-radius: 4px; object-fit: contain; margin-bottom: 10px;" alt="Evidencia ${i + 1}" />
                            <strong style="color: #004d99; font-size: 14px; display: block;">${labels[i]}</strong>
                            <span style="font-size: 12px; color: #555;">Evidencia adjuntada por el generador del permiso</span>
                        </div>
                    `;
                }
            });

            imagesHtml += `</div></div>`;
        }

        let extraSignatures = '';
        if (trabajadoresList?.length || responsablesList?.length) {
            extraSignatures += '<div style="margin-top: 50px; page-break-inside: avoid;">';
            extraSignatures += '<h4 style="text-align: center; color: #1e293b; margin-bottom: 20px;">FIRMAS DE TRABAJADORES Y RESPONSABLES ADICIONALES</h4>';
            extraSignatures += '<table style="width: 100%; border-collapse: collapse;"><tr>';

            let count = 0;
            const addSig = (name, role, idType, cedula) => {
                if (count > 0 && count % 2 === 0) extraSignatures += '</tr><tr>';
                extraSignatures += `
                    <td style="width: 50%; padding: 20px; text-align: center; vertical-align: bottom;">
                        <div class="signature-placeholder" data-signature-id="dyn_${idType}_${count}" style="border-bottom: 2px solid #333; width: 80%; margin: 0 auto 10px auto; min-height: 80px; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; cursor: pointer; border-radius: 8px 8px 0 0; transition: all 0.3s ease;">
                            <span style="color: #999; font-size: 12px;">Haga clic para insertar FIRMA DIGITAL</span>
                        </div>
                        <div style="font-weight: 800; font-size: 14px; color: #1e293b; text-transform: uppercase;">${name}</div>
                        <div style="font-size: 12px; color: #64748b; font-weight: 600;">${role}</div>
                        <div style="font-size: 11px; color: #94a3b8;">CC: ${cedula}</div>
                    </td>`;
                count++;
            };

            trabajadoresList?.forEach(t => {
                if (t.nombre) addSig(t.nombre, 'Trabajador Autorizado', 'trabajador', t.cedula || 'N/A');
            });
            responsablesList?.forEach(r => {
                if (r.nombre) addSig(r.nombre, r.rol || 'Responsable', 'responsable', r.cedula || 'N/A');
            });

            if (count % 2 !== 0) {
                extraSignatures += '<td style="width: 50%;"></td>';
            }
            extraSignatures += '</tr></table></div>';
        }

        let fullReport = headerHTML + '<div style="margin-top: 20px;">' + htmlBody + '</div>' + imagesHtml + extraSignatures;

        if (loadedCompanyInfo) {
            fullReport += buildSignatureSection(loadedCompanyInfo);
        }

        res.json({ report: fullReport });
    } catch (error) {
        logger.error('[SGSST Permiso Alturas] Generation error:', error);
        res.status(500).json({ error: 'Error al generar Permiso de Alturas' });
    }
});

module.exports = router;
