const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');


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
const MatrizLegalDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    statuses: { type: Array, default: [] },
    seguimientos: { type: Object, default: {} },
    activity: { type: String, default: '' },
    location: { type: String, default: '' },
    entityType: { type: String, default: 'private' },
    updatedAt: { type: Date, default: Date.now },
});

MatrizLegalDataSchema.index({ user: 1 }, { unique: true });

const MatrizLegalData = mongoose.models.MatrizLegalData || mongoose.model('MatrizLegalData', MatrizLegalDataSchema);

const mapSizeToLabel = (size) => {
    switch (size) {
        case 'small': return 'Microempresa (≤10 trabajadores)';
        case 'medium': return 'Pequeña (11-50 trabajadores)';
        case 'large': return 'Mediana/Grande (>50 trabajadores)';
        default: return 'No especificado';
    }
};

const mapRiskToLabel = (risk) => {
    return risk ? `Riesgo ${risk}` : 'No especificado';
};

// ─── GET /data — Load saved matriz legal data ─────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const data = await MatrizLegalData.findOne({ user: req.user.id });
        if (data) {
            return res.json({
                statuses: data.statuses || [],
                seguimientos: data.seguimientos || {},
                activity: data.activity || '',
                location: data.location || '',
                entityType: data.entityType || 'private'
            });
        }
        res.json({ statuses: [], seguimientos: {}, activity: '', location: '', entityType: 'private' });
    } catch (error) {
        logger.error('[SGSST MatrizLegal] Load error:', error);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});

// ─── POST /save — Save matriz legal data ─────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { statuses, seguimientos, activity, location, entityType } = req.body;

        await MatrizLegalData.findOneAndUpdate(
            { user: req.user.id },
            { $set: { statuses, seguimientos, activity, location, entityType, updatedAt: new Date() } },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (error) {
        logger.error('[SGSST MatrizLegal] Save error:', error);
        res.status(500).json({ error: 'Error al guardar datos' });
    }
});

router.post('/generate', requireJwtAuth, async (req, res) => {

    try {
        const { activity, location, entityType, modelName, statuses = [], seguimientos = {}, compliancePercentage = 0 } = req.body;

        if (!activity) {
            return res.status(400).json({ error: 'La actividad económica es obligatoria.' });
        }

        // 1. Get API Key
        let resolvedApiKey;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
            } catch (parseErr) {
                resolvedApiKey = storedKey;
            }
        } catch (err) {
            logger.debug('[SGSST Matriz] No user Google key found, trying env vars');
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

        // 2. Get Company Info
        let companyInfoBlock = '';
        let loadedCompanyInfo = null;
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            loadedCompanyInfo = ci;
            if (ci && ci.companyName) {
                companyInfoBlock = buildCompanyContextString(ci);
            }
        } catch (error) {
            logger.error('[SGSST Matriz] Error fetching company info', error);
        }

        const genAI = new GoogleGenerativeAI(resolvedApiKey);

        // Translate the statuses array back into full items
        const processedItems = statuses.map(s => {
            return {
                ...s,
                statusLabel: s.status === 'cumple' ? 'CUMPLE' : s.status === 'no_cumple' ? 'NO CUMPLE' : s.status === 'no_aplica' ? 'NO APLICA' : 'PENDIENTE',
                observacion: seguimientos[s.itemId] || ''
            };
        });

        const itemsLogText = processedItems.map(item =>
            `- Norma: ${item.norma} | Artículo: ${item.articulo}
  Req: ${item.descripcion}
  Evidencia: ${item.evidencia}
  ESTADO MARCADO: ${item.statusLabel}
  OBSERVACIÓN: ${item.observacion}`
        ).join('\n\n');

        // 3. Construct Prompt
        const promptText = `
Eres un abogado experto en Seguridad y Salud en el Trabajo (SG-SST) en Colombia.
Tu tarea es generar el informe final de la **MATRIZ LEGAL** de la empresa, estructurado en base a la evaluación cualitativa que acaba de realizar el usuario.

**Contexto de la Organización:**
- Actividad Económica Específica: ${activity}
- Ubicación: ${location || 'Nacional'}
- Tipo de Entidad: ${entityType === 'public' ? 'Pública' : entityType === 'mixed' ? 'Mixta' : 'Privada'}
${companyInfoBlock}

A continuación, te presento el resultado EXACTO de la evaluación de la matriz legal ítem por ítem:

${itemsLogText}

**Instrucciones ESTRICTAS:**
1. Redacta un **resumen ejecutivo** inicial basado en los niveles de cumplimiento encontrados (qué % cumple, qué % no cumple).
2. Presenta un **Indicador General de Cumplimiento**. Usa un recuadro HTML destacado indicando "Cumplimiento Legal: ${compliancePercentage || 0}%". 
3. Proporciona una serie de recomendaciones gerenciales para abordar los ítems con estado "NO CUMPLE". Haz mención a estos problemas de manera general o agrupada.
4. **NO VUELVAS A ESCRIBIR UNA TABLA CON LOS ÍTEMS**. El sistema añadirá el anexo detallado automáticamente. Tu trabajo es solo la narrativa ejecutiva y analítica.

**Formato HTML del Entregable:**
Primero, incluye EXACTAMENTE el siguiente encabezado HTML al inicio del informe:
${buildStandardHeader({
            title: 'MATRIZ DE REQUISITOS LEGALES SG-SST Evaluada',
            companyInfo: loadedCompanyInfo,
            date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
            norm: 'Decreto 1072 de 2015 / Res. 0312 de 2019',
        })}

Después del encabezado, el resumen ejecutivo, el Indicador de Cumplimiento (${compliancePercentage || 0}%) y las recomendaciones para la alta dirección.

¡El documento debe renderizarse como HTML válido!
`;

        // 4. Generate Content
        const selectedModel = modelName || 'gemini-3-flash-preview';
        const model = genAI.getGenerativeModel({ model: selectedModel });

        const result = await generateWithRetry(model, promptText);
        const response = await result.response;
        const text = response.text();

        // 5. Clean Output & append table
        let cleanedMatrix = text
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Generar tabla manual en HTML
        let tableRowsHTML = processedItems.map((item, idx) => {
            const statusColor = item.statusLabel === 'CUMPLE' ? '#22c55e' : item.statusLabel === 'NO CUMPLE' ? '#ef4444' : item.statusLabel === 'NO APLICA' ? '#64748b' : '#3b82f6';
            const statusBg = item.statusLabel === 'CUMPLE' ? '#f0fdf4' : item.statusLabel === 'NO CUMPLE' ? '#fef2f2' : item.statusLabel === 'NO APLICA' ? '#f8fafc' : '#eff6ff';

            return `
  <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; page-break-inside: avoid;">
    <div style="background-color: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-weight: 700; color: #004d99; font-size: 15px;">
        <span style="color: #64748b;">${idx + 1}.</span> ${item.norma} - ${item.articulo}
      </div>
      <div style="background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
        ${item.statusLabel}
      </div>
    </div>

    <div style="padding: 20px;">
      <div style="margin-bottom: 16px;">
        <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Requisito Específico</span>
        <span style="color: #1e293b; font-size: 14px;">${item.descripcion || '-'}</span>
      </div>

      <div style="margin-bottom: 16px;">
        <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Evidencia de Cumplimiento</span>
        <span style="color: #334155; font-size: 13px;">${item.evidencia || '-'}</span>
      </div>

      ${item.observacion ? `
      <div style="background-color: ${statusBg}; border: 1px solid ${statusColor}40; border-radius: 8px; padding: 12px;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: ${statusColor}; text-transform: uppercase; margin-bottom: 4px;">Seguimiento / Observaciones (Usuario)</span>
        <span style="color: #0f172a; font-size: 13px;">${item.observacion}</span>
      </div>` : ''}
    </div>
  </div>`;
        }).join('\\n');
        let finalContent = `${cleanedMatrix}\n<div class="mt-12">\n<h3 style="color: #004d99; font-size: 20px; margin: 0 0 15px 0; font-weight: 700; border-bottom: 2px solid #004d99; padding-bottom: 8px;">Anexo: Detalle de Criterios Ley / Matriz Evaluada</h3>\n${tableRowsHTML}</div>`;

        if (loadedCompanyInfo) {
            finalContent += buildSignatureSection(loadedCompanyInfo);
        }

        res.json({ matrix: finalContent });

    } catch (error) {
        console.error('[SGSST Matriz] Generation error:', error);
        res.status(500).json({ error: `Error generando matriz: ${error.message} ` });
    }
});

module.exports = router;
