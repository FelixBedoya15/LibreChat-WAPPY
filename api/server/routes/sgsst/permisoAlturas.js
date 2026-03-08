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

        const companyContext = buildCompanyContextString(loadedCompanyInfo);

        const promptText = `
Eres un Experto Técnico Senior en Seguridad y Salud en el Trabajo (SST), especializado en la gestión, evaluación y aprobación de permisos para trabajos en alturas en estricto cumplimiento de la normativa colombiana (Resolución 4272 de 2021) y estándares internacionales (OSHA/ANSI).
Tu objetivo es redactar un **Permiso de Trabajo en Alturas EXHAUSTIVO, TÉCNICO Y RIGUROSO**. Está prohibido hacer resúmenes. Cada sección debe ser ampliamente desarrollada y argumentada técnicamente.

${companyContext}

**DATOS APORTADOS PARA LA ELABORACIÓN DEL PERMISO:**
- Fecha de ejecución: ${formData.fecha || '[PENDIENTE]'}
- Horario de la actividad: ${formData.horaInicio || '[PENDIENTE]'} a ${formData.horaFin || '[PENDIENTE]'}
- Trabajadores Autorizados: ${trabajadoresStr}
- Personal Responsable (Emisores/Coordinadores/Vigías): ${responsablesStr}
- Verificación de Requisitos Legales Obligatorios:
    * Seguridad Social (ARL/EPS/Pensión): ${formData.seguridadSocial === 'Sí' ? '✅ CUMPLE (VIGENCIA VERIFICADA)' : '❌ [PENDIENTE REDACTAR ACCIÓN CORRECTIVA]'}
    * Aptitud Médica Ocupacional (Con énfasis en alturas): ${formData.aptitudMedica === 'Sí' ? '✅ CUMPLE (APTO DOCUMENTADO)' : '❌ [PENDIENTE EVALUACIÓN MÉDICA]'}
    * Certificación de Trabajo en Alturas (Vigente): ${formData.certificacionAlturas === 'Sí' ? '✅ CUMPLE (CERTIFICACIÓN VÁLIDA)' : '❌ [PENDIENTE REENTRENAMIENTO]'}
- Actividad técnica reportada por el usuario: ${formData.actividadGlobal || '[INFORMACIÓN PENDIENTE: El usuario no ha descrito la tarea]'}
- Evidencias del área de trabajo (Para análisis de la IA):
    1. Entorno del Punto de Trabajo: ${formData.foto1Desc || 'Sin descripción'}
    2. Sistema de Acceso / Plataforma: ${formData.foto2Desc || 'Sin descripción'}
    3. Elementos de Protección Individual / EPP: ${formData.foto3Desc || 'Sin descripción'}

**INSTRUCCIONES DE ESTRUCTURA Y CONTENIDO OBLIGATORIO (Desarrolla con mucha profundidad técnica y usa tablas para TODO):**

1️⃣ **Información General y Vigencia**
Crea una tabla profesional con los datos de las fechas, horas, empresa, y ubicación. Luego, un párrafo denso describiendo la naturaleza e importancia de la tarea (${formData.actividadGlobal || 'descrita'}).

2️⃣ **Personal Involucrado y Competencia**
Tabla detallada con cada trabajador y responsable, listando no solo su nombre sino también el nivel de capacitación requerido y su rol activo dentro del esquema de prevención de caídas. Incluye el estado de sus requisitos (Aptitud, Seguridad Social, Certificados).

3️⃣ **Evaluación de Riesgos y Controles (Extremadamente Detallado)**
- **Análisis de Trabajo Seguro (ATS)**: Crea una tabla ATS exhaustiva. Analiza el trabajo paso a paso (mínimo 4 pasos). Por cada paso, identifica peligros detallados, riesgos consecuentes, y establece estrictos controles de ingeniería, controles administrativos y EPP.
- **Sistemas de Protección y Accesos**: Tabla analizando las plataformas de acceso descritas, los puntos de anclaje necesarios, líneas de vida y cálculos de requerimientos de claridad que apliquen. Realiza recomendaciones sobre el equipo de protección detectado en la Foto 2 y 3.
- **EPP**: Detalla los componentes del arnés, conectores y equipos de rescate.

4️⃣ **Plan de Respuesta y Emergencias**
Tabla y texto denso describiendo el Plan de Rescate aplicable a este trabajo en particular. Incluye procedimientos de auto-rescate, rescate asistido, sistemas de comunicación (radios, visual) y disponibilidad de botiquín de trauma (inmovilizadores, control de hemorragias).

5️⃣ **Condiciones Ambientales y Decisiones Operativas (GO / NO-GO)**
Analiza posibles variables climáticas, distancias de seguridad eléctricas y condiciones del viento.
**Dictamen Final:** Genera un dictamen altamente técnico determinando si el permiso se Cierra y Aprueba (si todo cumple) o si queda Suspendido (si existen requerimientos legales pendientes).

**INSTRUCCIONES DE FORMATO HTML Y DISEÑO:**
- Tu respuesta DEBE ser EXCLUSIVAMENTE en código HTML limpio (del <div> o cuerpo del texto, sin etiquetas <html> ni <body>).
- DEBES usar tablas estilizadas para todas las secciones.
- Estructura base de las tablas: \`<table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 25px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">\`
- Encabezados de tabla: \`<th style="background-color: #1e293b; color: #f8fafc; padding: 14px 16px; font-size: 14px; font-weight: 700; text-transform: uppercase; text-align: left; border-bottom: 2px solid #3b82f6;">\`
- Celdas: \`<td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; color: #334155; vertical-align: top; background-color: #ffffff;">\`
- NO uses CSS externo de Tailwind. Todo el CSS debe ser inline e impecable.
- NO agregues tablas de firmas ni botones; la plataforma los incluye por defecto.
- Esfuérzate al máximo en la longitud y la calidad de la redacción técnica.
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
