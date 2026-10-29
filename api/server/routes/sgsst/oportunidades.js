const express = require('express');
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const ContextoData = require('~/models/ContextoData');
const OportunidadesData = require('~/models/OportunidadesData');
const KanbanTask = require('~/models/KanbanTask');
const { generateWithKeyRotation } = require('./sgsstGemini');
const { gatherCompanyFullContext } = require('./contexto');
const {
  buildStandardHeader,
  buildCompanyContextString,
  buildSignatureSection,
} = require('./reportHeader');

const router = express.Router();

/**
 * Obtener empresa activa del usuario
 */
async function getActiveCompany(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
  if (!active) active = await CompanyInfo.findOne({ user: userId }).lean();
  return active;
}

/**
 * Extrae JSON limpio desde texto de respuesta de Gemini
 */
function parseGeminiJson(rawText) {
  let cleaned = String(rawText || '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Calcula automáticamente el nivel de riesgo del sistema según Impacto x Probabilidad (Matriz 3x3 ISO 45001 Cl. 6.1.1)
 */
function computeSystemRiskLevel(impacto = 'Alto', probabilidad = 'Media') {
  const imp = String(impacto || 'Alto').trim().toLowerCase();
  const prob = String(probabilidad || 'Media').trim().toLowerCase();

  const impScore = imp.startsWith('alt') ? 3 : imp.startsWith('med') ? 2 : 1;
  const probScore = prob.startsWith('alt') ? 3 : prob.startsWith('med') ? 2 : 1;
  const product = impScore * probScore;

  if (product >= 9) return 'Crítico';
  if (product >= 6) return 'Alto';
  if (product >= 3) return 'Medio';
  return 'Bajo';
}

/**
 * GET /api/sgsst/oportunidades/data
 * Carga las oportunidades SST, riesgos del sistema, informe previo y métricas del ecosistema Somos SST.
 */
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [doc, ctxDoc, fullContext] = await Promise.all([
      OportunidadesData.findOne(filter).lean(),
      ContextoData.findOne(filter).lean(),
      gatherCompanyFullContext(userId, companyId),
    ]);

    const ecosystemMetrics = {
      ...fullContext.ecosystemMetrics,
      contextoFactorsCount: Array.isArray(ctxDoc?.dofaList) ? ctxDoc.dofaList.length : 0,
      stakeholdersCount: Array.isArray(ctxDoc?.stakeholders) ? ctxDoc.stakeholders.length : 0,
      oportunidadesCount: Array.isArray(doc?.oportunidades) ? doc.oportunidades.length : 0,
      riesgosSistemaCount: Array.isArray(doc?.riesgosSistema) ? doc.riesgosSistema.length : 0,
    };

    return res.json({
      oportunidades: doc?.oportunidades || [],
      riesgosSistema: doc?.riesgosSistema || [],
      lastGeneratedReport: doc?.lastGeneratedReport || '',
      company,
      ecosystemMetrics,
    });
  } catch (error) {
    logger.error('[SGSST Oportunidades] Load data error:', error);
    res.status(500).json({ error: 'Error al cargar los datos de oportunidades y riesgos del sistema.' });
  }
});

/**
 * POST /api/sgsst/oportunidades/data
 * Guarda las oportunidades SST y riesgos del sistema editados por el usuario.
 */
router.post('/data', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const {
      oportunidades,
      riesgosSistema,
      lastGeneratedReport,
      conversationId,
      messageId,
    } = req.body;

    const normalizedRiesgos = Array.isArray(riesgosSistema)
      ? riesgosSistema.map((r, idx) => ({
          ...r,
          id: r.id || `rs_${Date.now()}_${idx}`,
          nivelRiesgo:
            r.nivelRiesgo || computeSystemRiskLevel(r.impactoSistema, r.probabilidad),
        }))
      : [];

    const normalizedOportunidades = Array.isArray(oportunidades)
      ? oportunidades.map((o, idx) => ({
          ...o,
          id: o.id || `op_${Date.now()}_${idx}`,
        }))
      : [];

    const updated = await OportunidadesData.findOneAndUpdate(
      { user: userId, ...(companyId ? { companyId } : {}) },
      {
        $set: {
          oportunidades: normalizedOportunidades,
          riesgosSistema: normalizedRiesgos,
          ...(lastGeneratedReport !== undefined ? { lastGeneratedReport } : {}),
          ...(conversationId ? { conversationId } : {}),
          ...(messageId ? { messageId } : {}),
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('[SGSST Oportunidades] Save data error:', error);
    res.status(500).json({ error: 'Error al guardar las oportunidades y riesgos del sistema.' });
  }
});

/**
 * POST /api/sgsst/oportunidades/generate-ai
 * Recolecta todo el contexto de la organización y genera con IA las Oportunidades de SST (ISO 45001 Cl. 6.1.2.3)
 * y los Riesgos Estratégicos del Sistema (ISO 45001 Cl. 6.1.1).
 */
router.post('/generate-ai', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { modelName } = req.body;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [context, ctxDoc] = await Promise.all([
      gatherCompanyFullContext(userId, companyId),
      ContextoData.findOne(filter).lean(),
    ]);

    const comp = context.company || {};
    const em = context.ecosystemMetrics;
    const companyContextStr = buildCompanyContextString(comp);

    const dofaSummary = Array.isArray(ctxDoc?.dofaList) && ctxDoc.dofaList.length > 0
      ? ctxDoc.dofaList.map((d) => `- [${String(d.type).toUpperCase()}] ${d.description} (Acción: ${d.strategicAction || 'N/A'})`).join('\n')
      : 'No se ha compilado matriz DOFA aún.';

    const peligrosStr = context.peligrosSummary.length > 0
      ? context.peligrosSummary.slice(0, 8).map((p) => `- [${p.proceso}] ${p.clasificacion}: ${p.descripcion} (${p.nivelRiesgo})`).join('\n')
      : 'En proceso de valoración GTC-45.';

    const diagStr = `Puntaje Res. 0312: ${em.diagnosticoScore}% (${em.diagnosticoLevel}). Brechas pendientes: ${em.diagnosticoGaps} (${context.diagnosticoGapItems.join(', ') || 'Ninguna crítica'}).`;

    const promptText = `Eres el Especialista Sénior en Planificación Estratégica SG-SST de WAPPY, experto en ISO 45001:2018 (Cláusulas 6.1.1 Riesgos para el Sistema de Gestión y 6.1.2.3 Evaluación de Oportunidades para la SST), Decreto 1072 de 2015 (Art. 2.2.4.6.15 y 2.2.4.6.17) y Resolución 0312 de 2019 en Colombia.

Tu misión es formular la Matriz de Oportunidades de Mejora en SST (5 a 6 oportunidades de alto impacto) y la Matriz de Riesgos Estratégicos del Sistema SG-SST (5 a 6 riesgos que podrían impedir que el SG-SST alcance sus resultados previstos), 100% articuladas con la realidad de la empresa.

=== PERFIL DE LA EMPRESA ===
${companyContextStr}

=== ESTADO DEL ECOSISTEMA SOMOS SST ===
- ${diagStr}
- Trabajadores activos: ${em.totalWorkers} · Cargos: ${em.totalCargos} · Comités activos: ${em.comitesActivos} · Brigadistas: ${em.brigadistasCount}.
- Acciones ACPM/Kanban pendientes: ${em.acpmPending} de ${em.acpmTotal}.

=== CONTEXTO DOFA / PESTEL IDENTIFICADO (CL. 4.1) ===
${dofaSummary}

=== PELIGROS PRIORITARIOS GTC-45 ===
${peligrosStr}

=== INSTRUCCIONES ESTRICTAS ===
1. Genera entre 5 y 6 "oportunidades" (ISO 45001 Cl. 6.1.2.3: oportunidades para adaptar el trabajo a los trabajadores, eliminar peligros, ergonomía, digitalización con IA, apoyo técnico ARL ${comp.arl || ''}, cultura preventiva, bienestar psicosocial):
   - "titulo": Nombre claro y ejecutivo de la oportunidad de mejora en SST.
   - "categoria": Una de: "Ergonomía y Adaptación del Trabajo", "Digitalización e IA en SST", "Eliminación y Sustitución de Peligros", "Cultura Preventiva y Liderazgo", "Salud Mental y Clima Laboral", "Alianzas ARL y Capacitación", "Seguridad Vial / Operativa".
   - "origenSst": Módulo fuente ("Contexto DOFA", "Diagnóstico 0312", "Matriz GTC-45", "Huella Biocéntrica", "COPASST / Participación").
   - "beneficioEsperado": Impacto directo en reducción de ATEL, ausentismo o madurez del SG-SST.
   - "impactoPrioridad": "Alto" | "Medio" | "Bajo"
   - "viabilidad": "Alta" | "Media" | "Baja"
   - "recursosRequeridos": Recursos técnicos, humanos o financieros necesarios.
   - "indicadorExito": KPI medible (ej. "% de reducción de incidentes", "100% de cobertura").
   - "responsable": Cargo responsable.
   - "plazo": "Inmediato (30 días)" | "Corto Plazo (1-3 meses)" | "Mediano Plazo (3-6 meses)" | "Largo Plazo (6-12 meses)".
   - "estado": "Planificada" | "En Evaluación" | "En Ejecución".

2. Genera entre 5 y 6 "riesgosSistema" (ISO 45001 Cl. 6.1.1: riesgos estratégicos/administrativos/operativos para la eficacia del SG-SST, ej. sanciones MinTrabajo por brechas 0312, rotación de personal sin inducción, subregistro de incidentes, limitaciones presupuestales, incumplimiento de contratistas, fallas en respuesta a emergencias):
   - "amenaza": Descripción técnica del riesgo para el SG-SST.
   - "fuenteContexto": Origen ("Brecha Res. 0312", "Amenaza Externa DOFA", "Debilidad Interna", "Requisito Legal Cl. 4.2", "Matriz GTC-45").
   - "impactoSistema": "Alto" | "Medio" | "Bajo"
   - "probabilidad": "Alta" | "Media" | "Baja"
   - "controlExistente": Controles actuales en la organización.
   - "medidaMitigacion": Plan de tratamiento concreto para blindar el SG-SST.
   - "responsableMonitoreo": Cargo responsable.
   - "plazo": "Inmediato (30 días)" | "Corto Plazo (1-3 meses)" | "Mediano Plazo (3-6 meses)".
   - "estadoControl": "En Tratamiento" | "Abierto" | "Monitoreado".

RESPONDE ÚNICA Y EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO SIN TEXTO ADICIONAL:
{
  "oportunidades": [
    {
      "id": "op_1",
      "titulo": "...",
      "categoria": "Digitalización e IA en SST",
      "origenSst": "Contexto DOFA",
      "beneficioEsperado": "...",
      "impactoPrioridad": "Alto",
      "viabilidad": "Alta",
      "recursosRequeridos": "...",
      "indicadorExito": "...",
      "responsable": "Responsable SG-SST",
      "plazo": "Corto Plazo (1-3 meses)",
      "estado": "Planificada"
    }
  ],
  "riesgosSistema": [
    {
      "id": "rs_1",
      "amenaza": "...",
      "fuenteContexto": "Brecha Res. 0312",
      "impactoSistema": "Alto",
      "probabilidad": "Media",
      "controlExistente": "...",
      "medidaMitigacion": "...",
      "responsableMonitoreo": "Responsable SG-SST",
      "plazo": "Inmediato (30 días)",
      "estadoControl": "En Tratamiento"
    }
  ]
}`;

    const modelToUse = modelName || 'gemini-2.5-flash';
    const result = await generateWithKeyRotation(modelToUse, userId, promptText);
    const rawText = (await result.response).text();

    let parsed;
    try {
      parsed = parseGeminiJson(rawText);
    } catch (parseErr) {
      logger.error('[SGSST Oportunidades] JSON parse error:', parseErr.message);
      return res.status(500).json({
        error: 'La IA no devolvió un formato JSON estructurado válido. Por favor, reintenta.',
      });
    }

    const oportunidades = Array.isArray(parsed.oportunidades)
      ? parsed.oportunidades.map((o, idx) => ({
          id: o.id || `op_${Date.now()}_${idx}`,
          titulo: o.titulo || 'Oportunidad de mejora SST',
          categoria: o.categoria || 'Prevención y Control Operacional',
          origenSst: o.origenSst || 'Contexto Organizacional',
          beneficioEsperado: o.beneficioEsperado || '',
          impactoPrioridad: ['Alto', 'Medio', 'Bajo'].includes(o.impactoPrioridad)
            ? o.impactoPrioridad
            : 'Alto',
          viabilidad: ['Alta', 'Media', 'Baja'].includes(o.viabilidad) ? o.viabilidad : 'Alta',
          recursosRequeridos: o.recursosRequeridos || 'Presupuesto SG-SST / ARL',
          indicadorExito: o.indicadorExito || '100% de ejecución',
          responsable: o.responsable || 'Responsable SG-SST',
          plazo: o.plazo || 'Corto Plazo (1-3 meses)',
          estado: o.estado || 'Planificada',
          sentToKanban: false,
        }))
      : [];

    const riesgosSistema = Array.isArray(parsed.riesgosSistema)
      ? parsed.riesgosSistema.map((r, idx) => {
          const impactoSistema = ['Alto', 'Medio', 'Bajo'].includes(r.impactoSistema)
            ? r.impactoSistema
            : 'Alto';
          const probabilidad = ['Alta', 'Media', 'Baja'].includes(r.probabilidad)
            ? r.probabilidad
            : 'Media';
          return {
            id: r.id || `rs_${Date.now()}_${idx}`,
            amenaza: r.amenaza || 'Riesgo estratégico del SG-SST',
            fuenteContexto: r.fuenteContexto || 'Contexto Organizacional',
            impactoSistema,
            probabilidad,
            nivelRiesgo: computeSystemRiskLevel(impactoSistema, probabilidad),
            controlExistente: r.controlExistente || 'Controles básicos del SG-SST',
            medidaMitigacion: r.medidaMitigacion || '',
            responsableMonitoreo: r.responsableMonitoreo || 'Responsable SG-SST',
            plazo: r.plazo || 'Corto Plazo (1-3 meses)',
            estadoControl: r.estadoControl || 'En Tratamiento',
            sentToKanban: false,
          };
        })
      : [];

    await OportunidadesData.findOneAndUpdate(
      filter,
      {
        $set: {
          oportunidades,
          riesgosSistema,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const ecosystemMetrics = {
      ...context.ecosystemMetrics,
      contextoFactorsCount: Array.isArray(ctxDoc?.dofaList) ? ctxDoc.dofaList.length : 0,
      stakeholdersCount: Array.isArray(ctxDoc?.stakeholders) ? ctxDoc.stakeholders.length : 0,
      oportunidadesCount: oportunidades.length,
      riesgosSistemaCount: riesgosSistema.length,
    };

    return res.json({
      success: true,
      oportunidades,
      riesgosSistema,
      ecosystemMetrics,
      message: 'Matriz de Oportunidades SST y Riesgos del Sistema generada exitosamente con IA.',
    });
  } catch (error) {
    logger.error('[SGSST Oportunidades] Error in generate-ai:', error);
    res.status(500).json({ error: error.message || 'Error al generar oportunidades y riesgos con IA.' });
  }
});

/**
 * POST /api/sgsst/oportunidades/suggest-item
 * Autocompleta con IA una Oportunidad SST o un Riesgo del Sistema individual a partir de una idea/título.
 */
router.post('/suggest-item', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mode = 'oportunidad', inputData = {}, modelName } = req.body;
    const company = await getActiveCompany(userId);
    const companyContextStr = buildCompanyContextString(company || {});
    const modelToUse = modelName || 'gemini-2.5-flash';

    if (mode === 'oportunidad') {
      const draftTitle = inputData.titulo || 'Mejora en prevención de riesgos laborales';
      const categoria = inputData.categoria || 'Ergonomía y Adaptación del Trabajo';
      const prompt = `Eres un Consultor Sénior SG-SST experto en ISO 45001:2018 (Cláusula 6.1.2.3 Oportunidades para la SST).
Contexto de la empresa:
${companyContextStr}

El usuario está registrando la siguiente Oportunidad de SST: "${draftTitle}" (Categoría: ${categoria}).
Completa todos los campos técnicos en formato JSON válido:
{
  "item": {
    "titulo": "Título ejecutivo perfeccionado...",
    "categoria": "${categoria}",
    "origenSst": "Diagnóstico 0312 / Contexto DOFA",
    "beneficioEsperado": "Beneficio tangible en reducción de siniestralidad, ergonomía o cumplimiento...",
    "impactoPrioridad": "Alto",
    "viabilidad": "Alta",
    "recursosRequeridos": "Recursos necesarios (ej. horas de asesoría ARL, presupuesto SST)...",
    "indicadorExito": "Indicador medible de éxito (KPI)...",
    "responsable": "Responsable SG-SST",
    "plazo": "Corto Plazo (1-3 meses)",
    "estado": "Planificada"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({ success: true, item: parsed.item || parsed });
    }

    if (mode === 'riesgo') {
      const draftAmenaza = inputData.amenaza || 'Riesgo de incumplimiento normativo en el SG-SST';
      const prompt = `Eres un Consultor Sénior SG-SST experto en ISO 45001:2018 (Cláusula 6.1.1 Riesgos para el Sistema de Gestión SST).
Contexto de la empresa:
${companyContextStr}

El usuario desea estructurar el siguiente Riesgo del Sistema SG-SST: "${draftAmenaza}".
Devuelve ÚNICAMENTE un objeto JSON válido con todos sus controles y plan de mitigación:
{
  "item": {
    "amenaza": "Descripción técnica del riesgo estratégico para el SG-SST...",
    "fuenteContexto": "Contexto Organizacional / Res. 0312",
    "impactoSistema": "Alto",
    "probabilidad": "Media",
    "nivelRiesgo": "Alto",
    "controlExistente": "Controles actuales implementados...",
    "medidaMitigacion": "Plan de acción preventivo/correctivo detallado...",
    "responsableMonitoreo": "Responsable SG-SST",
    "plazo": "Inmediato (30 días)",
    "estadoControl": "En Tratamiento"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      const item = parsed.item || parsed;
      item.nivelRiesgo = computeSystemRiskLevel(item.impactoSistema, item.probabilidad);
      return res.json({ success: true, item });
    }

    return res.status(400).json({ error: 'Modo no válido.' });
  } catch (error) {
    logger.error('[SGSST Oportunidades] Error in suggest-item:', error);
    res.status(500).json({ error: error.message || 'Error al autocompletar con IA.' });
  }
});

/**
 * POST /api/sgsst/oportunidades/sync-from-contexto
 * Importa y sincroniza hallazgos reales desde ContextoData (DOFA/Cruces/Stakeholders),
 * DiagnosticoData (Estándares 0312 pendientes) y MatrizPeligrosData (Peligros críticos GTC-45).
 */
router.post('/sync-from-contexto', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const [ctxDoc, fullContext] = await Promise.all([
      ContextoData.findOne(filter).lean(),
      gatherCompanyFullContext(userId, companyId),
    ]);

    let oportDoc = await OportunidadesData.findOne(filter);
    if (!oportDoc) {
      oportDoc = new OportunidadesData({
        user: userId,
        companyId,
        oportunidades: [],
        riesgosSistema: [],
      });
    }

    const norm = (str) => String(str || '').trim().toLowerCase();
    const existingOpTitles = new Set(oportDoc.oportunidades.map((o) => norm(o.titulo)));
    const existingRiskTitles = new Set(oportDoc.riesgosSistema.map((r) => norm(r.amenaza)));

    let addedOportunidades = 0;
    let addedRiesgos = 0;

    // 1. Desde ContextoData (DOFA + Cruces)
    if (ctxDoc) {
      for (const item of ctxDoc.dofaList || []) {
        if (item.type === 'oportunidad' && item.description) {
          const key = norm(item.description);
          if (!existingOpTitles.has(key)) {
            oportDoc.oportunidades.push({
              id: `op_sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              titulo: item.description,
              categoria: item.category || 'Innovación y Entorno SST',
              origenSst: `Contexto DOFA (${item.originModule || 'Cl. 4.1'})`,
              beneficioEsperado:
                item.strategicAction || 'Aprovechamiento de oportunidad externa para fortalecer el SG-SST.',
              impactoPrioridad: String(item.impact || 'alto').toLowerCase() === 'alto' ? 'Alto' : 'Medio',
              viabilidad: 'Alta',
              recursosRequeridos: 'Gestión SG-SST / Apoyo ARL',
              indicadorExito: '100% de actividades ejecutadas según plan',
              responsable: item.responsible || 'Responsable SG-SST',
              plazo: 'Corto Plazo (1-3 meses)',
              estado: 'Planificada',
            });
            existingOpTitles.add(key);
            addedOportunidades++;
          }
        } else if ((item.type === 'amenaza' || item.type === 'debilidad') && item.description) {
          const key = norm(item.description);
          if (!existingRiskTitles.has(key)) {
            const impact = String(item.impact || 'alto').toLowerCase() === 'alto' ? 'Alto' : 'Medio';
            const prob = item.type === 'debilidad' ? 'Alta' : 'Media';
            oportDoc.riesgosSistema.push({
              id: `rs_sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              amenaza: item.description,
              fuenteContexto: `Contexto DOFA (${item.type === 'amenaza' ? 'Amenaza Externa' : 'Debilidad Interna'})`,
              impactoSistema: impact,
              probabilidad: prob,
              nivelRiesgo: computeSystemRiskLevel(impact, prob),
              controlExistente: 'Seguimiento en SG-SST',
              medidaMitigacion:
                item.strategicAction || 'Establecer plan de acción correctivo/preventivo en el PTA.',
              responsableMonitoreo: item.responsible || 'Responsable SG-SST',
              plazo: 'Inmediato (30 días)',
              estadoControl: 'En Tratamiento',
            });
            existingRiskTitles.add(key);
            addedRiesgos++;
          }
        }
      }

      const foDo = [
        ...(ctxDoc.crossStrategies?.fo || []),
        ...(ctxDoc.crossStrategies?.do || []),
      ];
      for (const strat of foDo) {
        const cleanStrat = String(strat || '').trim();
        if (cleanStrat && !existingOpTitles.has(norm(cleanStrat))) {
          oportDoc.oportunidades.push({
            id: `op_fo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            titulo: cleanStrat,
            categoria: 'Estrategia Cruzada FO/DO',
            origenSst: 'Cruces Estratégicos DOFA (Cl. 4.1)',
            beneficioEsperado: 'Potenciación de fortalezas internas con oportunidades del entorno.',
            impactoPrioridad: 'Alto',
            viabilidad: 'Alta',
            recursosRequeridos: 'Plan de Trabajo Anual SG-SST',
            indicadorExito: 'Estrategia implementada en el período',
            responsable: 'Responsable SG-SST',
            plazo: 'Mediano Plazo (3-6 meses)',
            estado: 'Planificada',
          });
          existingOpTitles.add(norm(cleanStrat));
          addedOportunidades++;
        }
      }
    }

    // 2. Desde Diagnóstico 0312 (Brechas normativas -> Riesgos del Sistema)
    for (const gap of (fullContext.diagnosticoGapItems || []).slice(0, 3)) {
      const gapTitle = `Brecha en Estándar Mínimo Res. 0312/2019: ${gap}`;
      if (!existingRiskTitles.has(norm(gapTitle))) {
        oportDoc.riesgosSistema.push({
          id: `rs_0312_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          amenaza: gapTitle,
          fuenteContexto: 'Autoevaluación Res. 0312/2019',
          impactoSistema: 'Alto',
          probabilidad: 'Alta',
          nivelRiesgo: 'Crítico',
          controlExistente: 'Identificado en autoevaluación anual',
          medidaMitigacion: `Diseñar y documentar evidencia de cumplimiento para el estándar ${gap} dentro del Plan de Mejora 0312.`,
          responsableMonitoreo: 'Responsable SG-SST',
          plazo: 'Inmediato (30 días)',
          estadoControl: 'En Tratamiento',
        });
        existingRiskTitles.add(norm(gapTitle));
        addedRiesgos++;
      }
    }

    // 3. Desde Matriz GTC-45 (Peligros críticos -> Oportunidades de intervención en fuente/medio)
    const criticalHazards = (fullContext.peligrosSummary || []).filter((p) =>
      /\b(I|II)\b|cr[ií]tico|alto|no aceptable/i.test(String(p.nivelRiesgo || ''))
    );
    for (const haz of criticalHazards.slice(0, 3)) {
      const opTitle = `Intervención prioritaria y control de ingeniería para peligro ${haz.clasificacion}: ${haz.descripcion} (${haz.proceso})`;
      if (!existingOpTitles.has(norm(opTitle))) {
        oportDoc.oportunidades.push({
          id: `op_gtc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          titulo: opTitle,
          categoria: 'Eliminación y Sustitución de Peligros',
          origenSst: 'Matriz IPEVR GTC-45',
          beneficioEsperado: `Reducción directa del nivel de riesgo (${haz.nivelRiesgo}) en el proceso ${haz.proceso}.`,
          impactoPrioridad: 'Alto',
          viabilidad: 'Media',
          recursosRequeridos: 'Controles de ingeniería / PVE / Capacitación específica',
          indicadorExito: '100% de controles implementados y revaloración del riesgo a nivel Aceptable',
          responsable: 'Responsable SG-SST',
          plazo: 'Corto Plazo (1-3 meses)',
          estado: 'Planificada',
        });
        existingOpTitles.add(norm(opTitle));
        addedOportunidades++;
      }
    }

    oportDoc.updatedAt = new Date();
    await oportDoc.save();

    const addedCount = addedOportunidades + addedRiesgos;
    return res.json({
      success: true,
      oportunidades: oportDoc.oportunidades,
      riesgosSistema: oportDoc.riesgosSistema,
      addedCount,
      addedOportunidades,
      addedRiesgos,
      message:
        addedCount > 0
          ? `Se sincronizaron ${addedOportunidades} oportunidades y ${addedRiesgos} riesgos estratégicos desde el ecosistema Somos SST.`
          : 'Todos los hallazgos del Contexto, Diagnóstico 0312 y GTC-45 ya se encuentran sincronizados.',
    });
  } catch (error) {
    logger.error('[SGSST Oportunidades] Error in sync-from-contexto:', error);
    res.status(500).json({ error: 'Error al sincronizar desde el ecosistema Somos SST.' });
  }
});

/**
 * POST /api/sgsst/oportunidades/send-to-kanban
 * Convierte una Oportunidad SST o Riesgo del Sistema en una tarea accionable en el Centro de Control Kanban / ACPM.
 */
router.post('/send-to-kanban', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id ? String(company._id) : undefined;

    const {
      itemId,
      itemType = 'oportunidad',
      title,
      description,
      priority = 'alta',
      actionType = 'mejora',
      assignedTo = 'Responsable SG-SST',
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'El título de la acción es requerido.' });
    }

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const refId = itemId ? String(itemId) : `op_kan_${Date.now()}`;

    let task = await KanbanTask.findOne({
      user: userId,
      ...(companyId ? { companyId } : {}),
      referenceId: refId,
    });

    if (task) {
      task.title = String(title).trim();
      task.description = String(description || '').trim();
      task.priority = priority;
      task.actionType = actionType;
      task.assignedTo = assignedTo;
      await task.save();
    } else {
      task = await KanbanTask.create({
        user: userId,
        companyId,
        title: String(title).trim(),
        description: String(description || '').trim(),
        status: 'todo',
        dueDate,
        type: 'other',
        priority: ['alta', 'media', 'baja', 'high', 'medium', 'low'].includes(priority) ? priority : 'alta',
        actionType: ['correctiva', 'preventiva', 'mejora'].includes(actionType)
          ? actionType
          : itemType === 'riesgo'
            ? 'preventiva'
            : 'mejora',
        sourceModule: 'Riesgos del Sistema y Oportunidades SST (ISO 45001 Cl. 6.1)',
        assignedTo,
        referenceId: refId,
        referenceName: itemType === 'riesgo' ? 'Riesgo del Sistema SG-SST' : 'Oportunidad de Mejora SST',
      });
    }

    // Marcar sentToKanban: true en OportunidadesData
    if (itemId) {
      const oportDoc = await OportunidadesData.findOne({
        user: userId,
        ...(company?._id ? { companyId: company._id } : {}),
      });
      if (oportDoc) {
        let modified = false;
        oportDoc.oportunidades.forEach((o) => {
          if (o.id === itemId) {
            o.sentToKanban = true;
            modified = true;
          }
        });
        oportDoc.riesgosSistema.forEach((r) => {
          if (r.id === itemId) {
            r.sentToKanban = true;
            modified = true;
          }
        });
        if (modified) {
          oportDoc.markModified('oportunidades');
          oportDoc.markModified('riesgosSistema');
          await oportDoc.save();
        }
      }
    }

    return res.json({
      success: true,
      task,
      message: `Acción "${task.title}" enviada exitosamente al Centro de Control Kanban / ACPM.`,
    });
  } catch (error) {
    logger.error('[SGSST Oportunidades] Error sending to Kanban:', error);
    res.status(500).json({ error: 'Error al enviar al Centro de Control Kanban.' });
  }
});

/**
 * POST /api/sgsst/oportunidades/generate-report
 * Construye el Informe Técnico Oficial de Riesgos del Sistema y Oportunidades SST (ISO 45001 Cl. 6.1)
 * con estilos inline hexadecimales planos compatibles con Word/PDF (html-docx), Mapa de Calor 3x3 y firmas digitales.
 */
router.post('/generate-report', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const context = await gatherCompanyFullContext(userId, companyId);
    const em = context.ecosystemMetrics;

    const { oportunidades = [], riesgosSistema = [] } = req.body;

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const headerHtml = buildStandardHeader({
      title: 'MATRIZ Y PLAN DE GESTIÓN DE RIESGOS DEL SISTEMA Y OPORTUNIDADES SST',
      companyInfo: company,
      date: currentDate,
      norm: 'ISO 45001:2018 Cláusulas 6.1.1 y 6.1.2.3 · Dec. 1072/2015 Art. 2.2.4.6.15 y 2.2.4.6.17 · Res. 0312/2019',
      responsibleName: req.user?.name,
    });

    // Filas de Oportunidades SST
    const oportunidadesRows = oportunidades.length > 0
      ? oportunidades
          .map(
            (o, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11px; color: #1e293b;">
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">
            ${o.titulo}
            <div style="font-size: 9.5px; font-weight: normal; color: #64748b; margin-top: 2px;">
              Categoría: <strong>${o.categoria || 'SST'}</strong> · Origen: ${o.origenSst || 'Contexto'}
            </div>
          </td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${o.beneficioEsperado || 'Mejora continua del SG-SST'}</td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top; text-align: center;">
            <strong>Impacto:</strong> ${o.impactoPrioridad || 'Alto'}<br/>
            <span style="font-size: 10px; color: #059669;">Viabilidad: ${o.viabilidad || 'Alta'}</span>
          </td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">
            ${o.recursosRequeridos || 'Presupuesto SST'}
            <div style="font-size: 9.5px; color: #0f766e; margin-top: 3px;"><strong>KPI:</strong> ${o.indicadorExito || '100% ejecutado'}</div>
          </td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">
            <strong>${o.responsable || 'Responsable SG-SST'}</strong><br/>
            <span style="font-size: 10px; color: #475569;">${o.plazo || 'Corto Plazo'} · ${o.estado || 'Planificada'}</span>
          </td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="5" style="padding: 14px; text-align: center; color: #94a3b8; border: 1px solid #cbd5e1;">No se han registrado oportunidades de SST</td></tr>`;

    // Conteo para Mapa de Calor 3x3 (Probabilidad x Impacto)
    const countCell = (prob, imp) =>
      riesgosSistema.filter(
        (r) =>
          String(r.probabilidad || 'Media').toLowerCase().startsWith(prob) &&
          String(r.impactoSistema || 'Alto').toLowerCase().startsWith(imp)
      ).length;

    // Filas de Riesgos del Sistema
    const riesgosRows = riesgosSistema.length > 0
      ? riesgosSistema
          .map((r, idx) => {
            const lvl = r.nivelRiesgo || computeSystemRiskLevel(r.impactoSistema, r.probabilidad);
            const badgeColor =
              lvl === 'Crítico'
                ? '#dc2626'
                : lvl === 'Alto'
                  ? '#d97706'
                  : lvl === 'Medio'
                    ? '#0284c7'
                    : '#059669';
            return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11px; color: #1e293b;">
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #1e293b; vertical-align: top;">
            ${r.amenaza}
            <div style="font-size: 9.5px; font-weight: normal; color: #64748b; margin-top: 2px;">
              Fuente: <strong>${r.fuenteContexto || 'Contexto SG-SST'}</strong>
            </div>
          </td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; background-color: ${badgeColor}; color: #ffffff; font-weight: 700; font-size: 10px;">
              ${lvl.toUpperCase()}
            </span>
            <div style="font-size: 9.5px; color: #475569; margin-top: 3px;">
              Imp: ${r.impactoSistema || 'Alto'} · Prob: ${r.probabilidad || 'Media'}
            </div>
          </td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${r.controlExistente || 'Seguimiento periódico'}</td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top; color: #0f766e; font-weight: 600;">${r.medidaMitigacion || 'Implementar plan de acción'}</td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">
            <strong>${r.responsableMonitoreo || 'Responsable SG-SST'}</strong><br/>
            <span style="font-size: 10px; color: #475569;">${r.plazo || 'Inmediato'} · ${r.estadoControl || 'En Tratamiento'}</span>
          </td>
        </tr>`;
          })
          .join('')
      : `<tr><td colspan="5" style="padding: 14px; text-align: center; color: #94a3b8; border: 1px solid #cbd5e1;">No se han registrado riesgos estratégicos del sistema</td></tr>`;

    const reportBody = `
<div style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; line-height: 1.6; max-width: 100%;">

  <!-- 1. OBJETO Y MARCO NORMATIVO -->
  <div style="margin-bottom: 22px; padding: 14px 18px; background-color: #f0fdfa; border-left: 4px solid #0f766e;">
    <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 13.5px; font-weight: 800; text-transform: uppercase;">
      1. Objeto y Enfoque Basado en Riesgos y Oportunidades (ISO 45001 Cláusula 6.1)
    </h3>
    <p style="margin: 0; font-size: 11.5px; color: #334155; line-height: 1.5;">
      El presente documento establece las acciones para abordar los <strong>Riesgos Estratégicos del Sistema de Gestión (ISO 45001:2018 Cl. 6.1.1)</strong> y las <strong>Oportunidades para la Seguridad y Salud en el Trabajo (ISO 45001:2018 Cl. 6.1.2.3)</strong> de <strong>${company?.companyName || 'la Organización'}</strong>, asegurando que el SG-SST alcance sus resultados previstos, prevenga efectos no deseados y logre la mejora continua conforme al <strong>Decreto 1072 de 2015</strong> y la <strong>Resolución 0312 de 2019</strong>.
    </p>
  </div>

  <!-- 2. RESUMEN EJECUTIVO DE ARTICULACIÓN -->
  <div style="margin-bottom: 24px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      2. Indicadores de Entrada del Ecosistema Somos SST
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">
      <tr style="background-color: #f8fafc;">
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 18px; font-weight: 800; color: #0f766e;">${oportunidades.length}</div>
          <div style="font-size: 10px; color: #475569; text-transform: uppercase;">Oportunidades SST (Cl. 6.1.2.3)</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 18px; font-weight: 800; color: #dc2626;">${riesgosSistema.length}</div>
          <div style="font-size: 10px; color: #475569; text-transform: uppercase;">Riesgos del Sistema (Cl. 6.1.1)</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 18px; font-weight: 800; color: #0284c7;">${em.diagnosticoScore}%</div>
          <div style="font-size: 10px; color: #475569; text-transform: uppercase;">Cumplimiento Res. 0312</div>
        </td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; width: 25%; text-align: center;">
          <div style="font-size: 18px; font-weight: 800; color: #d97706;">${em.peligrosCriticos} / ${em.totalPeligros}</div>
          <div style="font-size: 10px; color: #475569; text-transform: uppercase;">Peligros Críticos GTC-45</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- 3. MATRIZ DE OPORTUNIDADES PARA LA SST (CLÁUSULA 6.1.2.3) -->
  <div style="margin-bottom: 26px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      3. Matriz de Oportunidades para la Mejora del Desempeño SST (Cláusula 6.1.2.3)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 24%; text-align: left;">Oportunidad de SST</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 24%; text-align: left;">Beneficio Esperado</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 14%; text-align: center;">Impacto / Viabilidad</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 20%; text-align: left;">Recursos e Indicador (KPI)</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 18%; text-align: left;">Responsable y Plazo</th>
        </tr>
      </thead>
      <tbody>
        ${oportunidadesRows}
      </tbody>
    </table>
  </div>

  <!-- 4. MAPA DE CALOR 3x3 DE RIESGOS DEL SISTEMA -->
  <div style="margin-bottom: 26px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      4. Mapa de Calor de Riesgos Estratégicos del Sistema (Probabilidad × Impacto)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1; text-align: center;">
      <thead>
        <tr style="background-color: #1e293b; color: #ffffff;">
          <th style="padding: 8px; border: 1px solid #cbd5e1; width: 25%;">PROBABILIDAD \\ IMPACTO</th>
          <th style="padding: 8px; border: 1px solid #cbd5e1; width: 25%;">IMPACTO BAJO (1)</th>
          <th style="padding: 8px; border: 1px solid #cbd5e1; width: 25%;">IMPACTO MEDIO (2)</th>
          <th style="padding: 8px; border: 1px solid #cbd5e1; width: 25%;">IMPACTO ALTO (3)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 800; background-color: #f8fafc;">PROBABILIDAD ALTA (3)</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background-color: #e0f2fe; color: #0369a1; font-weight: 700;">MEDIO (${countCell('alt', 'baj')} riesgos)</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background-color: #fef3c7; color: #b45309; font-weight: 700;">ALTO (${countCell('alt', 'med')} riesgos)</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background-color: #fee2e2; color: #b91c1c; font-weight: 800;">CRÍTICO (${countCell('alt', 'alt')} riesgos)</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 800; background-color: #f8fafc;">PROBABILIDAD MEDIA (2)</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background-color: #ecfdf5; color: #047857; font-weight: 700;">BAJO (${countCell('med', 'baj')} riesgos)</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background-color: #e0f2fe; color: #0369a1; font-weight: 700;">MEDIO (${countCell('med', 'med')} riesgos)</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background-color: #fef3c7; color: #b45309; font-weight: 700;">ALTO (${countCell('med', 'alt')} riesgos)</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 800; background-color: #f8fafc;">PROBABILIDAD BAJA (1)</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background-color: #ecfdf5; color: #047857; font-weight: 700;">BAJO (${countCell('baj', 'baj')} riesgos)</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background-color: #ecfdf5; color: #047857; font-weight: 700;">BAJO (${countCell('baj', 'med')} riesgos)</td>
          <td style="padding: 10px; border: 1px solid #cbd5e1; background-color: #e0f2fe; color: #0369a1; font-weight: 700;">MEDIO (${countCell('baj', 'alt')} riesgos)</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 5. MATRIZ DE RIESGOS DEL SISTEMA SG-SST (CLÁUSULA 6.1.1) -->
  <div style="margin-bottom: 28px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      5. Matriz de Riesgos Estratégicos del Sistema SG-SST y Controles de Mitigación (Cláusula 6.1.1)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 24%; text-align: left;">Riesgo / Amenaza al Sistema</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 14%; text-align: center;">Valoración</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 20%; text-align: left;">Control Existente</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 24%; text-align: left;">Plan de Mitigación y Tratamiento</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 18%; text-align: left;">Responsable y Estado</th>
        </tr>
      </thead>
      <tbody>
        ${riesgosRows}
      </tbody>
    </table>
  </div>

</div>
`;

    let signaturesHtml = '';
    if (company) {
      signaturesHtml = buildSignatureSection(company);
    }

    const fullReportHtml = `${headerHtml}\n${reportBody}\n${signaturesHtml}`;

    await OportunidadesData.findOneAndUpdate(
      { user: userId, ...(companyId ? { companyId } : {}) },
      {
        $set: {
          lastGeneratedReport: fullReportHtml,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      html: fullReportHtml,
    });
  } catch (error) {
    logger.error('[SGSST Oportunidades] Error generating report:', error);
    res.status(500).json({ error: error.message || 'Error al generar el informe técnico oficial.' });
  }
});

module.exports = router;
