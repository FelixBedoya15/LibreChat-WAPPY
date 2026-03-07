const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { AuthKeys } = require('librechat-data-provider');
const { getUserKey } = require('../../services/PluginService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { logger } = require('~/config');

const router = express.Router();

router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const { formData, trabajadoresList, responsablesList, images, modelName } = req.body;

        const trabajadoresStr = trabajadoresList?.map(t => `${t.nombre || 'Sin nombre'} (CC: ${t.cedula || 'N/A'})`).join(', ') || '[PENDIENTE]';
        const responsablesStr = responsablesList?.map(r => `${r.nombre || 'Sin nombre'} - ${r.rol || 'Sin Rol'} (CC: ${r.cedula || 'N/A'})`).join(', ') || '[PENDIENTE]';

        let resolvedApiKey = null;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: AuthKeys.GOOGLE_API_KEY });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
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

        if (!resolvedApiKey) {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google.',
            });
        }

        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-1.5-pro-latest' });

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
Eres un Asistente especializado en la gestión de permisos de trabajo en alturas, con amplio conocimiento en la normatividad colombiana vigente (Resolución 4272 de 2021, Decreto 1072 de 2015, Resolución 0312 de 2019) y en los estándares internacionales de seguridad para la prevención de caídas.

Tu función es generar el documento de permiso de trabajo en alturas de forma completa, técnica y formal, basándote en la información y fotografías aportadas por el usuario.

**DATOS APORTADOS POR EL USUARIO:**
- Trabajadores implicados: ${trabajadoresStr}
- Descripción detallada: ${formData.actividad || '[PENDIENTE]'}
- Altura aproximada: ${formData.altura || '[PENDIENTE]'} metros
- Fecha: ${formData.fecha || '[PENDIENTE]'} (De ${formData.horaInicio || '[PENDIENTE]'} a ${formData.horaFin || '[PENDIENTE]'})
- Seguridad social vigente: ${formData.seguridadSocial || 'No definido'}
- Aptitud médica ocupacional: ${formData.aptitudMedica || 'No definido'}
- Certificación trabajo en alturas: ${formData.certificacionAlturas || 'No definido'}

**Sistemas y Equipos:**
- Sistema de Acceso: ${formData.sistemaAcceso || '[PENDIENTE]'}
- Puntos de Anclaje: ${formData.puntosAnclaje || '[PENDIENTE]'}
- Protección contra caídas: ${formData.proteccionCaidas || '[PENDIENTE]'}
- Elementos (EPP): ${formData.epp || '[PENDIENTE]'}
- Herramientas: ${formData.herramientas || '[PENDIENTE]'}
- Condiciones ambientales/eléctricas: ${formData.condicionesAmbientales || '[PENDIENTE]'}
- Procedimiento: ${formData.procedimiento || '[PENDIENTE]'}

**Responsables referidos:** ${responsablesStr}

**Descripciones fotográficas del usuario:**
1. Lugar de trabajo: ${formData.foto1Desc || 'Ninguna descripción provista'}
2. Sistema de acceso: ${formData.foto2Desc || 'Ninguna descripción provista'}
3. Trabajador con EPP: ${formData.foto3Desc || 'Ninguna descripción provista'}

(Nota: además, el usuario ha adjuntado imágenes reales de la actividad).

MUY IMPORTANTE: NO incluyas tablas de firmas, espacios de aceptación, ni nombres de representantes o responsables al final del documento, ya que el sistema los añadirá automáticamente de forma estandarizada. 

INSTRUCCIONES DE FORMATO: 
Tu respuesta DEBE ser EXCLUSIVAMENTE código HTML del cuerpo (body) sin usar etiquetas <!DOCTYPE>, <html>, <head> o <body>.
Integra y elabora extensivamente un "Análisis de Trabajo Seguro (ATS)" según el texto proporcionado antes, argumentado e indicando recomendaciones preventivas específicas, evaluación de riesgos y demás información exigida en permisos de esta naturaleza.

Usa tablas (<table>) con \`width="100%"\`, \`border-collapse: collapse;\`, \`border: 1px solid #ddd;\` donde corresponda. No uses Tailwind. Colores de la cabecera #004d99 y texto blanco.
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
