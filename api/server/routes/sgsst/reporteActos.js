const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection, buildCompanyContextString } = require('./reportHeader');
const { logger } = require('~/config');

const router = express.Router();
const mongoose = require('mongoose');


// ─── HELPER: Google Gemini Fallback ───────────────────────────────────────
async function generateWithRetry(model, promptText, maxRetries = 3 /* fallback modes */) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(model.apiKey);
  const currentModelName = model.model.replace('models/', '');
  
  const fallbackOrder = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];
  
  let modelsToTry = [currentModelName];
  for (const m of fallbackOrder) {
    if (m !== currentModelName) modelsToTry.push(m);
  }
  
  let lastError;
  for (const modelName of modelsToTry) {
    if (!modelName) continue;
    try {
      if (modelName !== currentModelName) {
         console.warn(`[Gemini SDK] Cambiando a modelo de respaldo: ${modelName}...`);
      }
      const fallbackModel = genAI.getGenerativeModel({ 
          model: modelName, 
          generationConfig: model.generationConfig || {} 
      });
      return await fallbackModel.generateContent(promptText);
    } catch (err) {
      console.warn(`[Gemini SDK] Falló ${modelName}: ${err.message}`);
      lastError = err;
    }
  }
  
  throw new Error(`Todos los modelos generativos fallaron. Último error: ${lastError?.message || 'Desconocido'}`);
}

// ─── Mongoose Schema for Raw Data ──────────────────────────────────────
const ReporteActosDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    formData: { type: Object, default: {} },
    trabajadoresList: { type: Array, default: [] },
    responsablesList: { type: Array, default: [] },
    images: { type: Object, default: {} },
    updatedAt: { type: Date, default: Date.now },
});

ReporteActosDataSchema.index({ user: 1 }, { unique: true });

const ReporteActosData = mongoose.models.ReporteActosData || mongoose.model('ReporteActosData', ReporteActosDataSchema);

// ─── GET /data — Load saved reporte data ─────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const data = await ReporteActosData.findOne({ user: req.user.id });
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
        logger.error('[SGSST ReporteActos] Load error:', error);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});

// ─── POST /save — Save reporte data ─────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { formData, trabajadoresList, responsablesList, images } = req.body;
        await ReporteActosData.findOneAndUpdate(
            { user: req.user.id },
            { $set: { formData, trabajadoresList, responsablesList, images, updatedAt: Date.now() } },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        logger.error('[SGSST ReporteActos] Save error:', error);
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
            logger.debug('[SGSST Reporte Actos] No user Google key found, trying env vars:', err.message);
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
            logger.warn('Failed to load company info for reporte de actos');
        }

        const headerHTML = buildStandardHeader({
            title: 'REPORTE DE ACTOS Y CONDICIONES INSEGURAS',
            companyInfo: loadedCompanyInfo,
            date: currentDate,
            norm: 'Directrices SG-SST (Resolución 0312 de 2019 / Decreto 1072 de 2015)',
            responsibleName: req.user?.name,
        });

        const companyContext = buildCompanyContextString(loadedCompanyInfo);

        const promptText = `
Eres un Experto Técnico Senior en Seguridad y Salud en el Trabajo (SST), especializado en el diseño de Inspecciones de Seguridad e Investigación y Reporte de Actos o Condiciones Inseguras.
Tu objetivo es redactar un **REPORTE DE ACTO O CONDICIÓN INSEGURA EXHAUSTIVO Y TÉCNICO**.

**REGLA CRÍTICA SOBRE PERSONAL:** 
SOLO puedes incluir a las personas listadas a continuación. ESTÁ ESTRICTAMENTE PROHIBIDO inventar cargos o personal si no están en estos datos:
- Personal Reportante / Observado: ${trabajadoresStr}
- Supervisores / Adicionales: ${responsablesStr}
- Responsable SG-SST de la Empresa: ${loadedCompanyInfo?.responsibleSST || 'No registrado'}

**REGLA GLOBAL DE CERO INVENCIONES (ANTI-ALUCINACIÓN):**
Bajo ninguna circunstancia puedes inventar información operativa o condiciones que NO se encuentren explícitamente en la "Descripción del Hallazgo" dictada por el usuario o que no sean evidentes en las fotografías.
- SÍ puedes (y debes) plantear **recomendaciones correctivas, metodologías, EPP requeridos, causas probables (raíz), y conclusiones normativas** basadas en los datos suministrados.

**DATOS APORTADOS PARA LA ELABORACIÓN DEL REPORTE:**
- Fecha del Hallazgo: ${formData.fecha || '[PENDIENTE]'}
- Hora del Hallazgo: ${formData.horaInicio || '[PENDIENTE]'}
- Requisitos o Chequeos Internos:
    * Revisión SG-SST: ${formData.seguridadSocial === 'Sí' ? '✅ Aplicable / Registrado' : '❌ No aplicable'}
    * Medida de Acción Inmediata: ${formData.aptitudMedica === 'Sí' ? '✅ Tarea Suspendida Temporalmente' : '❌ Tarea Continúa - Riesgo Moderado'}
    * Requiere Intervención Urgente: ${formData.certificacionAlturas === 'Sí' ? '✅ Alta Prioridad' : '❌ Prioridad Rutinaria'}
- Descripción del Hallazgo Inseguro: ${formData.actividadGlobal || '[INFORMACIÓN PENDIENTE]'}
- Contexto visual y entorno: ${formData.foto1Desc || 'Sin descripción'} | ${formData.foto2Desc || 'Sin descripción'} | ${formData.foto3Desc || 'Sin descripción'}

**INSTRUCCIONES DE ESTRUCTURA Y CONTENIDO OBLIGATORIO (Desarrolla profundo y usa tablas para TODO):**

1️⃣ **Información Detallada del Hallazgo**
Tabla con: Fecha, Hora, Tipo de Novedad (Determina si es ACTO INSEGURO o CONDICIÓN INSEGURA según la descripción), y Resumen Técnico del evento.
Luego de la tabla, genera OBLIGATORIAMENTE un párrafo resaltado empleando el siguiente contenedor HTML (literal):
\`<div style="border-left: 4px solid #f59e0b; background-color: #fef3c7; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px; margin-top: -10px; font-size: 13.5px; color: #78350f; line-height: 1.6;"><strong>Nivel de Criticidad del Hallazgo:</strong> [TU ANÁLISIS SOBRE EL GRADO DE SEVERIDAD DEL ACTO/CONDICIÓN, EL POTENCIAL ACCIDENTE QUE PODRÍA OCASIONAR Y EL ENFOQUE DE INTERVENCIÓN NECESARIO]</div>\`

2️⃣ **Personal Involucrado y Reportante**
Tabla con los nombres y cédulas aportados. Si es acto inseguro, describe el rol de las personas listadas.

3️⃣ **Matriz de Identificación de Peligros Asociados (Basada en GTC 45)**
Crea una tabla con base en el hallazgo detallado definiendo: Descripción del Peligro, Clasificación (Físico, Químico, Mecánico, Biomecánico, de Seguridad, etc.), Fuente Generadora, y Consecuencia Potencial (A qué accidente o enfermedad puede llevar).

4️⃣ **Análisis de Causas Sistémicas (Inmediatas y Básicas)**
Crea una tabla investigando exhaustivamente el "¿Por qué?" pasó esto:
Columnas: Acto o Condición Insegura Identificada, Causas Inmediatas (Fallas humanas o del entorno directo), Causas Básicas / Raíz (Fallas sistémicas, de capacitación, presupuesto o estandarización).

5️⃣ **Plan de Acción y Controles (Jerarquía de Controles)**
Propón una lista muy extensa de controles ordenados por Jerarquía.
Tabla con: Medida de Control Recomendada, Nivel jerárquico (Eliminación, Sustitución, Ingeniería, Administrativo, EPP), y Prioridad de Ejecución.

6️⃣ **Informe Analítico de Seguridad (Recomendaciones y Conclusiones del Experto)**
**REGLA OBLIGATORIA:** Debe ser EXTREMADAMENTE EXTENSO Y PROFUNDO.
Escribe un análisis meticuloso del hallazgo, su relación con la cultura organizacional y la falta de estandarización. Sugiere inspecciones futuras, re-entrenamientos o cambios operativos mecánicos y físicos concretos para solucionar el hallazgo de raíz.

7️⃣ **Dictamen Final (Bloque Gráfico Independiente)**
Cajón visual usando un \`<div style="border: 2px solid #ea580c; border-radius: 8px; padding: 25px; text-align: center; margin-top: 35px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); background-color: #fff7ed;">\`
- Dentro, título \`<h4 style="color: #ea580c; font-size: 16px; font-weight: bold; text-transform: uppercase;">DICTAMEN Y SEGUIMIENTO SG-SST</h4>\`
- Botón \`<div style="display: inline-block; background-color: #ea580c; color: white; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 15px 0;">REQUIERE PLAN DE ACCIÓN Y CIERRE</div>\`
- Texto base indicando obligatoriedad de socialización en comité COPASST.

**INSTRUCCIONES DE DISEÑO HTML Y TABLAS:**
- Tu respuesta DEBE ser EXCLUSIVAMENTE en código HTML.
- Estructura base de TODAS las tablas: \`<table style="width: 100%; table-layout: fixed; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 25px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">\`
- Encabezados de tabla (<th>): \`<th style="background-color: #0f172a; color: #ffffff; padding: 12px 14px; font-size: 13px; font-weight: 700; text-transform: uppercase; text-align: left; border-bottom: 1px solid #1e293b;">\`
- Celdas (<td>): \`<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; font-size: 13px; color: #334155; vertical-align: top; background-color: #ffffff;">\`
- NO agregues tablas de firmas ni botones; la plataforma los incluye automáticamente al final.
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
                        parts.push({ text: `(Fotografía Adjunta ${index + 1}: ${key})` });
                    }
                }
            });
        }

        const result = await generateWithRetry(model, parts);
        const response = await result.response;
        const htmlBody = response.text().replace(/```html\n ? /g, '').replace(/```\n?/g, '').trim();

        // Incorporate the images in the final report HTML
        let imagesHtml = '';
        if (images.foto1 || images.foto2 || images.foto3) {
            imagesHtml = `
                <div style="margin-top: 30px; margin-bottom: 30px;">
                    <h3 style="color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 5px;">ANEXO: ARCHIVO FOTOGRÁFICO DEL HALLAZGO</h3>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
            `;

            const labels = ['Evidencia Panorámica', 'Detalle del Acto/Condición', 'Perspectiva Adicional'];
            ['foto1', 'foto2', 'foto3'].forEach((k, i) => {
                if (images[k]) {
                    imagesHtml += `
                        <div style="flex: 1; min-width: 250px; border: 1px solid #ddd; padding: 10px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <img src="${images[k]}" style="width: 100%; height: auto; max-width: 300px; border-radius: 4px; object-fit: contain; margin-bottom: 10px;" alt="Evidencia ${i + 1}" />
                            <strong style="color: #0f172a; font-size: 14px; display: block;">${labels[i]}</strong>
                            <span style="font-size: 12px; color: #555;">Capturada en sitio para inspección</span>
                        </div>
                    `;
                }
            });

            imagesHtml += `</div></div>`;
        }

        let extraSignatures = '';
        if (trabajadoresList?.length || responsablesList?.length) {
            extraSignatures += '<div style="margin-top: 50px; page-break-inside: avoid;">';
            extraSignatures += '<h4 style="text-align: center; color: #1e293b; margin-bottom: 20px;">FIRMAS - REPORTE DE ACTOS Y CONDICIONES INSEGURAS</h4>';
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
                if (t.nombre) addSig(t.nombre, 'Personal Reportante / Observado', 'reportante', t.cedula || 'N/A');
            });
            responsablesList?.forEach(r => {
                if (r.nombre) addSig(r.nombre, r.rol || 'Responsable Inmediato', 'responsable', r.cedula || 'N/A');
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
        logger.error('[SGSST Reporte Actos] Generation error:', error);
        res.status(500).json({ error: 'Error al generar Reporte de Actos y Condiciones' });
    }
});

module.exports = router;
