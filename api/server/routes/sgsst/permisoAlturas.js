const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection, buildCompanyContextString } = require('./reportHeader');
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
Eres un Experto Técnico Senior en Seguridad y Salud en el Trabajo (SST), especializado en la gestión de permisos para trabajos en alturas según la Resolución 4272 de 2021 (Colombia) y OSHA/ANSI.
Tu objetivo es redactar un **Permiso de Trabajo en Alturas EXHAUSTIVO, TÉCNICO Y RIGUROSO**.

**REGLA CRÍTICA SOBRE PERSONAL:** 
SOLO puedes incluir a las personas listadas a continuación. ESTÁ ESTRICTAMENTE PROHIBIDO inventar cargos como "Auxiliar de Patio" o "Vigía" si no están en estos datos:
- Trabajadores Autorizados: ${trabajadoresStr}
- Personal Responsable: ${responsablesStr}
- Responsable SG-SST: ${loadedCompanyInfo?.responsibleSST || 'No registrado'}
*(El Representante Legal registrado en la empresa NO debe incluirse en los listados ni matrices del permiso operativo).*

**REGLA GLOBAL DE CERO INVENCIONES (ANTI-ALUCINACIÓN):**
Bajo ninguna circunstancia puedes inventar, asumir o alucinar información, datos operativos, medidas, cálculos climáticos o estados de herramientas que NO se encuentren explícitamente en la "Actividad técnica" descrita por el usuario o no sean 100% evidentes en las fotografías.
- SÍ puedes (y debes) plantear **recomendaciones preventivas, controles de ingeniería/administrativos, EPP, medidas de rescate resolutivas y conclusiones normativas** basadas en los peligros deducidos.
- Pero SIEMPRE que un dato operativo base falte (ej. velocidad del viento, altura exacta, tipo de arnés) y no lo puedas ver, debes escribir literalmente la frase en gris: *<span style="color:#64748b; font-style:italic;">"No reportado en la solicitud operativa - Debe validarse en sitio antes de iniciar"</span>*. Nunca llenes espacios asumiendo que "hay clima soleado" o "el equipo está inspeccionado" si no consta en los datos.

**DATOS APORTADOS PARA LA ELABORACIÓN DEL PERMISO:**
- Fecha de ejecución: ${formData.fecha || '[PENDIENTE]'} | Horario: ${formData.horaInicio || '[PENDIENTE]'} a ${formData.horaFin || '[PENDIENTE]'}
- Verificación de Requisitos Legales Obligatorios:
    * Seguridad Social: ${formData.seguridadSocial === 'Sí' ? '✅ CUMPLE (VIGENTE)' : '❌ [PENDIENTE REDACTAR ACCIÓN]'}
    * Aptitud Médica en alturas: ${formData.aptitudMedica === 'Sí' ? '✅ CUMPLE (APTO)' : '❌ [PENDIENTE]'}
    * Certificación de Alturas: ${formData.certificacionAlturas === 'Sí' ? '✅ CUMPLE (VIGENTE)' : '❌ [PENDIENTE]'}
- Actividad técnica: ${formData.actividadGlobal || '[INFORMACIÓN PENDIENTE]'}
- Entorno: ${formData.foto1Desc || 'Sin descripción'} | Acceso: ${formData.foto2Desc || 'Sin descripción'} | EPP: ${formData.foto3Desc || 'Sin descripción'}

**INSTRUCCIONES DE ESTRUCTURA Y CONTENIDO OBLIGATORIO (Desarrolla con mucha profundidad técnica y usa tablas para TODO):**

1️⃣ **Información Operativa del Trabajo**
NO generes títulos principales como "PERMISO DE TRABAJO", pues ya existe en el encabezado. TAMPOCO repitas Razón Social, NIT o Nivel de Riesgo, el encabezado ya lo tiene.
Crea una tabla con SOLO: Fecha, Horario, Ubicación/Área específica, **Sistema de Acceso**, **Altura de Trabajo estimada** y Descripción amplia de la tarea.
Luego de la tabla, genera OBLIGATORIAMENTE un párrafo resaltado empleando el siguiente contenedor (literal):
\`<div style="border-left: 4px solid #3b82f6; background-color: #f8fafc; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px; margin-top: -10px; font-size: 13.5px; color: #334155; line-height: 1.6;"><strong>Naturaleza Crítica de la Tarea:</strong> [TU ANÁLISIS EXHAUSTIVO SOBRE POR QUÉ ESTA LABOR SUPERA EL UMBRAL DE LA RESOLUCIÓN, LOS PELIGROS ADICIONALES INTRODUCIDOS Y EL ENFOQUE DE GESTIÓN DE RIESGO APLICABLE]</div>\`

2️⃣ **Personal Involucrado y Competencia**
Tabla detallada EXCLUSIVAMENTE con los trabajadores y responsables listados (NO INVENTES OTROS, y NO incluyas al representante legal). Incluye rol en la labor, y validación legal (SS, Aptitud, Certificado).

3️⃣ **Análisis de Trabajo Seguro (ATS) Detallado**
Crea una tabla ATS sumamente exhaustiva. **REGLA ABSOLUTA:** Cero resúmenes. Estás obligado a desarrollar **TODOS los pasos necesarios (pueden ser 6, 10, 12 o más) dependiendo de la complejidad de la tarea descrita**. NUNCA te limites a menos.
Columnas del ATS: Paso a Paso detallado de la tarea, Riesgo asociado a ESE paso, Consecuencias, y Controles (Ingeniería, Administrativos, EPP requeridos para ese paso).

4️⃣ **Matriz de Identificación de Peligros (Basada en GTC 45)**
Crea una tabla extensa para la identificación de peligros estructurada según la GTC 45 Colombiana. 
**CRÍTICO:** Esta tabla DEBE ir obligatoriamente DESPUÉS del ATS. La columna "ZONA/PROCESO" debe dividirse usando los MISMOS pasos de la tarea que acabas de definir en el ATS (Paso a paso de la tarea).
Columnas obligatorias: ZONA/PROCESO (Paso de la Tarea), Peligro (Descripción y Clasificación - Físico, Químico, Biomecánico, Condiciones de Seguridad, etc.), Efectos Posibles.

5️⃣ **Sistemas de Protección, Acceso y EPP**
Tabla analizando detalladamente: 1. Plataformas/Sistemas de acceso (Analizando Foto 2), 2. Puntos de anclaje/Líneas de vida requeridas, 3. Elementos de Protección Personal obligatorios (Casco con barbuquejo, arnés cuerpo entero, eslingas, gafas, guantes - Analizando Foto 3). 

6️⃣ **Plan de Respuesta y Emergencias**
Tabla describiendo el Plan de Rescate aplicable. Especifica el procedimiento, el equipamiento de rescate requerido, sistemas de comunicación y elementos de trauma disponibles en sitio.

7️⃣ **Condiciones Ambientales**
Analiza las variables climáticas. **INSTRUCCIÓN ESTRICTA:** No inventes ANÁLISIS CLIMÁTICO ni CRITERIOS DE SUSPENSIÓN (como "cielo despejado" o velocidades de viento). Si esta información no está explícitamente en el texto del usuario o es imposible deducirla de la foto con 100% de seguridad, escribe LITERALMENTE en la tabla: *"No reportado en la solicitud operativa - Debe validarse en sitio antes de iniciar"*.

8️⃣ **Dictamen Final (Bloque Gráfico Independiente)**
Debes colocar el Dictamen Final por aparte, totalmente separado de la tabla de Condiciones Ambientales.
Crea un cajón visual elegante usando un \`<div style="border: 2px solid #004d99; border-radius: 8px; padding: 25px; text-align: center; margin-top: 35px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); background-color: #f8fafc;">\`
- Dentro del div, pon un título \`<h4 style="color: #004d99; font-size: 16px; font-weight: bold; text-transform: uppercase; margin-top: 0; margin-bottom: 15px;">DICTAMEN FINAL DEL EXPERTO SST</h4>\`
- Luego, un texto explicativo indicando que, basándose en la información suministrada, el responsable SST aprueba (o suspende si hay faltas graves) la labor.
- Luego, un bloque grande tipo botón: \`<div style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 15px 0;">APROBADO PARA EJECUCIÓN</div>\` (Usa rojo \`#dc2626\` y texto "PERMISO DENEGADO" si el permiso tiene requisitos legales incumplidos).
- Por último, un texto en cursiva y letra pequeña (ej: \`font-size: 11px; color: #64748b;\`): *"Este permiso pierde validez inmediata si las condiciones meteorológicas cambian o si ocurre un incidente durante la labor. Debe permanecer de forma visible en el área de trabajo."*

**INSTRUCCIONES DE DISEÑO HTML Y TABLAS:**
- Tu respuesta DEBE ser EXCLUSIVAMENTE en código HTML limpio (del <div> o cuerpo del texto).
- Estructura base de TODAS las tablas: \`<table style="width: 100%; table-layout: fixed; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 25px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">\`
- Encabezados de tabla (<th>): \`<th style="background-color: #004d99; color: #ffffff; padding: 12px 14px; font-size: 13px; font-weight: 700; text-transform: uppercase; text-align: left; border-bottom: 1px solid #003366; word-wrap: break-word;">\`
- Celdas (<td>): \`<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; font-size: 13px; color: #334155; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; background-color: #ffffff;">\`
- Asegúrate de usar porcentajes de ancho adecuados si usas la propiedad width en <th> o <td> (ej: width="20%").
- NO agregues tablas de firmas ni botones; la plataforma los incluye por defecto.
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
