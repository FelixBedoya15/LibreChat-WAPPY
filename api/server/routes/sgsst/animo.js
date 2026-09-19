const express = require('express');
const { generateWithKeyRotation } = require('./sgsstGemini');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CompanyInfo = require('../../../models/CompanyInfo');
const MoodTelemetry = require('../../../models/MoodTelemetry');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { logger } = require('~/config');

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompany(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
    if (!active) active = await CompanyInfo.findOne({ user: userId }).lean();
    return active;
}

// ─── POST /generate — Generar Informe Ejecutivo de Riesgo Psicosocial ─────────
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const { filterDays = 30, analystNotes = '', modelName } = req.body;

        const company = await getActiveCompany(req.user.id);
        if (!company) {
            return res.status(400).json({ error: 'No se encontró la empresa activa para generar el informe.' });
        }

        // Construir consulta de telemetría filtrada por fecha si aplica
        const query = { companyId: company._id };
        if (filterDays && Number(filterDays) > 0) {
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - Number(filterDays));
            query.createdAt = { $gte: limitDate };
        }

        const telemetryData = await MoodTelemetry.find(query).sort({ createdAt: -1 }).lean();

        // Cálculo cuantitativo de métricas
        const total = telemetryData.length;
        let happy = 0;
        let neutral = 0;
        let sad = 0;
        const stressorsMap = {};
        const departmentMap = {};
        const executiveCases = [];

        const stressorNames = {
            sobrecarga: 'Sobrecarga de trabajo',
            liderazgo: 'Clima laboral / Liderazgo y Relaciones',
            entorno: 'Entorno físico / Herramientas de trabajo',
            personal: 'Asuntos personales o familiares',
            funciones: 'Falta de claridad en funciones y rol',
            fatiga: 'Fatiga física o agotamiento mental',
        };

        telemetryData.forEach(item => {
            if (item.mood === 'happy') happy++;
            else if (item.mood === 'neutral') neutral++;
            else if (item.mood === 'sad') sad++;

            if (Array.isArray(item.stressors)) {
                item.stressors.forEach(s => {
                    stressorsMap[s] = (stressorsMap[s] || 0) + 1;
                });
            }

            const depName = item.department?.trim() || 'General';
            if (!departmentMap[depName]) {
                departmentMap[depName] = { total: 0, happy: 0, neutral: 0, sad: 0 };
            }
            departmentMap[depName].total++;
            if (item.mood === 'happy') departmentMap[depName].happy++;
            else if (item.mood === 'neutral') departmentMap[depName].neutral++;
            else if (item.mood === 'sad') departmentMap[depName].sad++;

            // Extraer casos de seguimiento anónimos con recomendaciones (máximo 10)
            if (item.details && executiveCases.length < 10) {
                const clean = item.details.replace(/\n+/g, ' ').trim();
                executiveCases.push(`• [${new Date(item.createdAt).toLocaleDateString('es-CO')} - Área: ${depName}]: ${clean}`);
            }
        });

        const happyPct = total > 0 ? ((happy / total) * 100).toFixed(1) : '0';
        const neutralPct = total > 0 ? ((neutral / total) * 100).toFixed(1) : '0';
        const sadPct = total > 0 ? ((sad / total) * 100).toFixed(1) : '0';

        const topStressors = Object.entries(stressorsMap)
            .map(([id, count]) => ({
                id,
                label: stressorNames[id] || id,
                count,
                pct: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
            }))
            .sort((a, b) => b.count - a.count);

        const departmentStats = Object.entries(departmentMap)
            .map(([name, data]) => ({
                name,
                total: data.total,
                happy: data.happy,
                neutral: data.neutral,
                sad: data.sad,
                sadPct: data.total > 0 ? ((data.sad / data.total) * 100).toFixed(1) : '0'
            }))
            .sort((a, b) => b.total - a.total);

        // Clave API de Gemini
        let resolvedApiKey = null;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed['google'] || parsed.apiKey || parsed.GOOGLE_API_KEY;
            } catch {
                resolvedApiKey = storedKey;
            }
        } catch (err) {
            logger.debug('[SGSST Animo] No user Google key found:', err.message);
        }

        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (resolvedApiKey && typeof resolvedApiKey === 'string') {
            resolvedApiKey = resolvedApiKey.split(',')[0].trim();
        }

        if (!resolvedApiKey || resolvedApiKey === 'user_provided') {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google. Por favor, configúrala en el menú de opciones de IA.',
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

        const headerHTML = buildStandardHeader({
            title: 'INFORME EJECUTIVO Y DIAGNÓSTICO: TERMÓMETRO PSICOSOCIAL Y GESTIÓN DEL RIESGO PSICOSOCIAL',
            companyInfo: company,
            date: currentDate,
            norm: 'Resolución 2646 de 2008 / Resolución 2764 de 2022 (Batería Riesgo Psicosocial) / Decreto 1072 de 2015',
            responsibleName: req.user?.name,
        });

        const promptText = `
Eres un Psicólogo Ocupacional Especialista Senior y Auditor Líder en Seguridad y Salud en el Trabajo (SG-SST) en Colombia.
Tu labor es estructurar un **INFORME EJECUTIVO Y DIAGNÓSTICO DE RIESGO PSICOSOCIAL** con base en los datos recopilados por el aplicativo "Termómetro Psicosocial" de la empresa.

**MARCO NORMATIVO APLICABLE:**
- Resolución 2646 de 2008 (Identificación, evaluación, prevención, intervención y monitoreo permanente de la exposición a factores de riesgo psicosocial en el trabajo).
- Resolución 2764 de 2022 (Adopción de la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial).
- Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 - Sistema de Gestión de la Seguridad y Salud en el Trabajo).
- Ley 1010 de 2006 (Prevención del acoso laboral y fomento de ambientes laborales sanos).

**MÉTRICAS CUANTITATIVAS REALES REGISTRADAS (Últimos ${filterDays} días):**
- Total de Evaluaciones Registradas: ${total}
- Estado de Ánimo Positivo / Motivado: ${happy} respuestas (${happyPct}%)
- Estado de Ánimo Tranquilo / Normal: ${neutral} respuestas (${neutralPct}%)
- Estado de Ánimo Estresado / Agotado (Alerta): ${sad} respuestas (${sadPct}%)

**FACTORES DE RIESGO / ESTRESORES PREVALENTES:**
${topStressors.length > 0 ? topStressors.map(s => `- ${s.label}: ${s.count} reportes (${s.pct}%)`).join('\n') : '- Sin estresores reportados.'}

**DISTRIBUCIÓN POR ÁREA O DEPARTAMENTO:**
${departmentStats.length > 0 ? departmentStats.map(d => `- Área: ${d.name} | Total: ${d.total} | Positivo: ${d.happy} | Normal: ${d.neutral} | Alerta/Estrés: ${d.sad} (${d.sadPct}%)`).join('\n') : '- Sin discriminación por departamento registrada.'}

**CASOS DE SEGUIMIENTO Y RECOMENDACIONES CONFIDENCIALES REGISTRADAS:**
${executiveCases.length > 0 ? executiveCases.join('\n') : '- No se registran casos de seguimiento particulares en el periodo.'}

**NOTAS U OBSERVACIONES ADICIONALES DEL ANALISTA SST:**
${analystNotes ? analystNotes : 'Sin notas adicionales suministradas por el analista.'}

---
**ESTRUCTURA OBLIGATORIA DEL INFORME (Tu respuesta DEBE contener exclusivamente código HTML puro):**

1️⃣ **Diagnóstico Global y Evaluación Experta SG-SST**
Redacta un análisis técnico global sobre la salud emocional y psicosocial de la organización.
Enciérralo en este contenedor HTML exacto:
\`<div style="border-left: 4px solid #0f766e; background-color: #f0fdfa; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px; margin-top: -10px; font-size: 13.5px; color: #115e59; line-height: 1.6;"><strong>Evaluación Experta SG-SST:</strong> [TU TEXTO DE EVALUACIÓN GLOBAL TÉCNICA]</div>\`

2️⃣ **Matriz Cuantitativa de Telemetría Emocional**
Tabla con columnas: Indicador de Clima / Estado, Cantidad de Reportes, Porcentaje Relativo, Nivel de Riesgo Asociado, Criterio de Control SG-SST.

3️⃣ **Análisis Detallado de Factores de Riesgo Intralaboral y Extralaboral (Res. 2764/2022)**
Tabla con columnas: Factor de Riesgo Identificado, Incidencia en la Empresa, Dimensiones Afectadas (Carga mental, Relaciones, Demandas del puesto), Acciones de Intervención Prioritaria.

4️⃣ **Focalización por Áreas de Trabajo y Priorización de Intervención**
Tabla con columnas: Área / Departamento, Nivel de Exposición Crítica, Focos de Vulnerabilidad, Prioridad de Intervención (Alta, Media, Baja).

5️⃣ **Plan de Acción e Intervención Psicosocial Inmediato (Decreto 1072 de 2015)**
Tabla con columnas: Objetivo de la Acción, Actividad Específica (Talleres, Ajuste de Cargas, Liderazgo, Pausas), Población Objeto, Responsable (COPASST, Comité Convivencia, SST, Líder de Área), Periodicidad / Meta.

6️⃣ **Conclusiones y Recomendaciones para la Alta Dirección y Comité de Convivencia Laboral**
Puntos clave con lineamientos normativos y recomendaciones estratégicas para fortalecer el bienestar laboral y prevenir enfermedades laborales de origen psicosocial.

---
**INSTRUCCIONES CRÍTICAS DE DISEÑO HTML Y TABLAS:**
- Tu respuesta DEBE ser EXCLUSIVAMENTE en código HTML puro, sin bloques de código como \`\`\`html ni \`\`\`.
- Estructura base de TODAS las tablas:
  \`<table style="width: 100%; table-layout: auto; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 25px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">\`
- Encabezados de tabla (<th>):
  \`<th style="background-color: #0f172a; color: #ffffff; padding: 12px 14px; font-size: 13px; font-weight: 700; text-transform: uppercase; text-align: left; border-bottom: 1px solid #1e293b;">\`
- Celdas (<td>):
  \`<td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; font-size: 13px; color: #334155; vertical-align: top; background-color: #ffffff;">\`
- Badges para niveles de riesgo o prioridad:
  - Alto/Crítico: \`<span style="background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 11px;">Alto</span>\`
  - Medio: \`<span style="background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 11px;">Medio</span>\`
  - Bajo/Favorable: \`<span style="background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 11px;">Favorable / Bajo</span>\`
- NO incluyas tablas de firmas al final (el sistema agregará automáticamente la sección institucional de firmas).
- Mantén confidencialidad y anonimato absoluto: ningún nombre de trabajador ni conversación privada debe aparecer.
`;

        const result = await generateWithKeyRotation(model, req.user?.id || req.user, [{ text: promptText }]);
        const response = await result.response;
        const htmlBody = response.text().replace(/```html\n?/g, '').replace(/```/g, '').trim();

        let fullReport = headerHTML + '<div style="margin-top: 20px;">' + htmlBody + '</div>';

        if (company) {
            fullReport += buildSignatureSection(company);
        }

        res.json({ report: fullReport });
    } catch (error) {
        logger.error('[SGSST Animo] Error generating psychosocial report:', error);
        res.status(500).json({ error: error.message || 'Error al generar el informe de Termómetro Psicosocial' });
    }
});

module.exports = router;
