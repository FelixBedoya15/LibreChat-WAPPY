const express = require('express');
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const ContextoData = require('~/models/ContextoData');
const OportunidadesData = require('~/models/OportunidadesData');
const KanbanTask = require('~/models/KanbanTask');
const SgsstWorker = require('~/models/SgsstWorker');
const { generateWithKeyRotation } = require('./sgsstGemini');
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
 * Extrae un objeto JSON limpio de la respuesta de texto de Gemini
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
 * Metodología de recolección de información integral de la empresa
 * Consolida datos de perfil, diagnóstico 0312, peligros GTC-45, trabajadores, cargos, comités, Kanban ACPM y oportunidades.
 */
async function gatherCompanyFullContext(userId, companyId) {
  const baseFilter = { user: userId, ...(companyId ? { companyId } : {}) };

  // 1. Perfil corporativo de la empresa
  let company = null;
  if (companyId) {
    company = await CompanyInfo.findById(companyId).lean();
  }
  if (!company) {
    company = await getActiveCompany(userId);
  }

  // 2. Diagnóstico de Estándares Mínimos (Resolución 0312 de 2019)
  let diagnostico = null;
  let diagnosticoScore = 0;
  let diagnosticoLevel = 'Sin evaluar';
  let diagnosticoGaps = 0;
  let diagnosticoGapItems = [];
  try {
    const DiagnosticoData =
      mongoose.models.DiagnosticoData || require('~/models/DiagnosticoData');
    diagnostico = await DiagnosticoData.findOne(baseFilter).lean();
    if (diagnostico) {
      diagnosticoScore = Number(diagnostico.score || 0);
      diagnosticoLevel = diagnostico.complianceLevel || (diagnosticoScore >= 86 ? 'Aceptable' : diagnosticoScore >= 61 ? 'Moderadamente Aceptable' : 'Crítico');
      if (Array.isArray(diagnostico.statusData)) {
        const gaps = diagnostico.statusData.filter(
          (s) => s.status === 'no_cumple' || s.status === 'pendiente'
        );
        diagnosticoGaps = gaps.length;
        diagnosticoGapItems = gaps.slice(0, 8).map((g) => `${g.code || ''} ${g.name || g.itemId || ''}`.trim());
      }
    }
  } catch (err) {
    logger.debug('[Contexto] DiagnosticoData lookup failed:', err.message);
  }

  // 3. Matriz de Peligros y Valoración de Riesgos (GTC-45)
  let peligrosSummary = [];
  try {
    try { require('./matrizPeligros'); } catch (_) {}
    const MatrizPeligrosData = mongoose.models.MatrizPeligrosData;
    if (MatrizPeligrosData) {
      const matriz = await MatrizPeligrosData.findOne(baseFilter).lean();
      if (matriz && Array.isArray(matriz.procesos)) {
        matriz.procesos.forEach((p) => {
          if (Array.isArray(p.peligros)) {
            p.peligros.forEach((pel) => {
              peligrosSummary.push({
                proceso: p.proceso || 'General',
                actividad: p.actividad || 'General',
                clasificacion: pel.clasificacion || pel.tipoPeligro || 'Sin clasificar',
                descripcion: pel.descripcionPeligro || pel.descripcion || 'Sin descripción',
                nivelRiesgo: pel.interpretacionNR || pel.nivelRiesgo || pel.aceptabilidad || 'No valorado',
              });
            });
          }
        });
      }
    }
    if (peligrosSummary.length === 0) {
      const GTC45WorkspaceSession =
        mongoose.models.GTC45WorkspaceSession || require('~/models/GTC45WorkspaceSession');
      const gtcSession = await GTC45WorkspaceSession.findOne(baseFilter).lean();
      if (gtcSession && Array.isArray(gtcSession.rows)) {
        gtcSession.rows.forEach((r) => {
          peligrosSummary.push({
            proceso: r.proceso || 'General',
            actividad: r.actividad || 'Operativa',
            clasificacion: r.peligro_clasificacion || 'Biológico / Biomecánico',
            descripcion: r.peligro_descripcion || 'Peligro operativo',
            nivelRiesgo: r.interpretacion_nr || r.aceptabilidad || 'Medio',
          });
        });
      }
    }
  } catch (err) {
    logger.debug('[Contexto] MatrizPeligrosData lookup failed:', err.message);
  }

  const totalPeligros = peligrosSummary.length;
  const peligrosCriticos = peligrosSummary.filter((p) =>
    /\b(I|II)\b|cr[ií]tico|alto|no aceptable/i.test(String(p.nivelRiesgo || ''))
  ).length;

  // 4. Trabajadores (Huella Biocéntrica) y Perfiles de Cargo
  let totalWorkers = 0;
  let totalCargos = 0;
  try {
    totalWorkers = await SgsstWorker.countDocuments({
      ...baseFilter,
      estadoLaboral: { $ne: 'Retirado' },
    });
    if (!totalWorkers && company?.workerCount) {
      totalWorkers = Number(company.workerCount) || 0;
    }
    try { require('./perfilesCargo'); } catch (_) {}
    const PerfilCargoData = mongoose.models.PerfilCargoData;
    if (PerfilCargoData) {
      const cargosDoc = await PerfilCargoData.findOne(baseFilter).lean();
      totalCargos = Array.isArray(cargosDoc?.perfilesList) ? cargosDoc.perfilesList.length : 0;
    }
  } catch (err) {
    logger.debug('[Contexto] Workers/Cargos lookup failed:', err.message);
  }

  // 5. Comités reglamentarios (COPASST, Convivencia, Brigada)
  let copasstMembersCount = 0;
  let convivenciaMembersCount = 0;
  let brigadaCount = 0;
  try {
    const SgsstCopasst = mongoose.models.SgsstCopasst || require('~/models/SgsstCopasst');
    if (SgsstCopasst) {
      const cop = await SgsstCopasst.findOne(baseFilter).lean();
      copasstMembersCount = cop?.members?.length || (cop?.president ? 2 : 0);
    }
    const SgsstConvivencia = mongoose.models.SgsstConvivencia || require('~/models/SgsstConvivencia');
    if (SgsstConvivencia) {
      const ccl = await SgsstConvivencia.findOne(baseFilter).lean();
      convivenciaMembersCount = ccl?.members?.length || 0;
    }
    const SgsstBrigadista = mongoose.models.SgsstBrigadista || require('~/models/SgsstBrigadista');
    if (SgsstBrigadista) {
      brigadaCount = await SgsstBrigadista.countDocuments(baseFilter);
    }
  } catch (err) {
    logger.debug('[Contexto] Committees lookup failed:', err.message);
  }
  const comitesActivos = (copasstMembersCount > 0 ? 1 : 0) + (convivenciaMembersCount > 0 ? 1 : 0);

  // 6. Centro de Control Kanban / ACPM
  let acpmTotal = 0;
  let acpmPending = 0;
  try {
    const kanbanFilter = {
      user: userId,
      ...(companyId ? { companyId: { $in: [companyId, String(companyId)] } } : {}),
    };
    const tasks = await KanbanTask.find(kanbanFilter).select('status').lean();
    acpmTotal = tasks.length;
    acpmPending = tasks.filter((t) => t.status !== 'done' && t.status !== 'dismissed').length;
  } catch (err) {
    logger.debug('[Contexto] KanbanTask lookup failed:', err.message);
  }

  // 7. Oportunidades y Riesgos Estratégicos del Sistema (Cl. 6.1)
  let oportunidadesCount = 0;
  let riesgosSistemaCount = 0;
  try {
    const oportDoc = await OportunidadesData.findOne(baseFilter).lean();
    oportunidadesCount = Array.isArray(oportDoc?.oportunidades) ? oportDoc.oportunidades.length : 0;
    riesgosSistemaCount = Array.isArray(oportDoc?.riesgosSistema) ? oportDoc.riesgosSistema.length : 0;
  } catch (err) {
    logger.debug('[Contexto] OportunidadesData lookup failed:', err.message);
  }

  // 8. Análisis de Vulnerabilidad y Amenazas de Emergencia
  let amenazasEmergencia = [];
  try {
    try { require('./analisisVulnerabilidad'); } catch (_) {}
    const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData;
    if (AnalisisVulnerabilidadData) {
      const av = await AnalisisVulnerabilidadData.findOne(baseFilter).lean();
      if (av?.formData?.amenazasList) {
        amenazasEmergencia = av.formData.amenazasList.map(
          (a) => `${a.amenaza || 'Amenaza'} (${a.nivelAmenaza || 'No evaluada'})`
        );
      }
    }
  } catch (err) {
    logger.debug('[Contexto] Vulnerabilidad lookup failed:', err.message);
  }

  const ecosystemMetrics = {
    diagnosticoScore,
    diagnosticoLevel,
    diagnosticoGaps,
    totalPeligros,
    peligrosCriticos,
    totalWorkers,
    totalCargos,
    comitesActivos,
    brigadistasCount: brigadaCount,
    acpmTotal,
    acpmPending,
    oportunidadesCount,
    riesgosSistemaCount,
  };

  return {
    company,
    diagnostico,
    diagnosticoGapItems,
    peligrosSummary,
    copasstMembersCount,
    convivenciaMembersCount,
    brigadaCount,
    amenazasEmergencia,
    ecosystemMetrics,
  };
}

/**
 * GET /api/sgsst/contexto/data
 * Carga la matriz DOFA, partes interesadas, estrategias guardadas y métricas del ecosistema Somos SST.
 */
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const [data, context] = await Promise.all([
      ContextoData.findOne({
        user: userId,
        ...(companyId ? { companyId } : {}),
      }).lean(),
      gatherCompanyFullContext(userId, companyId),
    ]);

    if (data) {
      return res.json({
        dofaList: data.dofaList || [],
        stakeholders: data.stakeholders || [],
        crossStrategies: data.crossStrategies || { fo: [], do: [], fa: [], da: [] },
        lastGeneratedReport: data.lastGeneratedReport || '',
        company,
        ecosystemMetrics: context.ecosystemMetrics,
      });
    }

    return res.json({
      dofaList: [],
      stakeholders: [],
      crossStrategies: { fo: [], do: [], fa: [], da: [] },
      lastGeneratedReport: '',
      company,
      ecosystemMetrics: context.ecosystemMetrics,
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Load data error:', error);
    res.status(500).json({ error: 'Error al cargar los datos de contexto y partes interesadas.' });
  }
});

/**
 * POST /api/sgsst/contexto/data
 * Guarda los datos de DOFA y Partes Interesadas editados por el usuario.
 */
router.post('/data', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const { dofaList, stakeholders, crossStrategies, lastGeneratedReport, conversationId, messageId } = req.body;

    const updated = await ContextoData.findOneAndUpdate(
      { user: userId, ...(companyId ? { companyId } : {}) },
      {
        $set: {
          dofaList: Array.isArray(dofaList) ? dofaList : [],
          stakeholders: Array.isArray(stakeholders) ? stakeholders : [],
          crossStrategies: crossStrategies || { fo: [], do: [], fa: [], da: [] },
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
    logger.error('[SGSST Contexto] Save data error:', error);
    res.status(500).json({ error: 'Error al guardar la información de contexto.' });
  }
});

/**
 * POST /api/sgsst/contexto/generate-matrix
 * Recolecta la información de la empresa y genera autónomamente con IA
 * la Matriz DOFA/PESTEL de SST, las partes interesadas (Stakeholders) y los cruces estratégicos.
 */
router.post('/generate-matrix', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { modelName } = req.body;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    // Recolectar la metodología integral de la empresa
    const context = await gatherCompanyFullContext(userId, companyId);
    const comp = context.company || {};
    const em = context.ecosystemMetrics;

    const companyContextStr = buildCompanyContextString(comp);

    // Preparar resumen del diagnóstico 0312
    const diagStr = context.diagnostico
      ? `Puntaje obtenido: ${em.diagnosticoScore}% · Nivel: ${em.diagnosticoLevel}. Brechas / estándares pendientes: ${em.diagnosticoGaps} (${context.diagnosticoGapItems.join(', ') || 'Ninguno crítico'}).`
      : 'No se ha ejecutado autoevaluación de Estándares Mínimos (Res. 0312/2019).';

    // Preparar resumen de peligros GTC-45
    let peligrosStr = 'No se han registrado peligros en la matriz GTC-45 aún.';
    if (context.peligrosSummary.length > 0) {
      const topPeligros = context.peligrosSummary.slice(0, 10).map(
        (p) => `- [${p.proceso} - ${p.actividad}] ${p.clasificacion}: ${p.descripcion} (Riesgo: ${p.nivelRiesgo})`
      );
      peligrosStr = `Peligros identificados (${em.totalPeligros} en total, ${em.peligrosCriticos} críticos/altos):\n${topPeligros.join('\n')}`;
    }

    const comitesStr = `Trabajadores activos: ${em.totalWorkers} en ${em.totalCargos} cargos. COPASST/Vigía: ${context.copasstMembersCount > 0 ? `Activo (${context.copasstMembersCount} miembros)` : 'Pendiente'}. Comité de Convivencia: ${context.convivenciaMembersCount > 0 ? `Activo (${context.convivenciaMembersCount} miembros)` : 'Pendiente'}. Brigada de Emergencia: ${context.brigadaCount} brigadistas. Tareas ACPM/Kanban: ${em.acpmTotal} (${em.acpmPending} pendientes).`;
    const emergenciasStr = context.amenazasEmergencia.length > 0
      ? `Amenazas de emergencia identificadas: ${context.amenazasEmergencia.join(', ')}.`
      : 'Análisis de vulnerabilidad en proceso.';

    const promptText = `Eres el Especialista Sénior en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) de WAPPY, consultor experto en ISO 45001:2018 (Cláusulas 4.1 y 4.2), Decreto 1072 de 2015 (Art. 2.2.4.6.8) y Resolución 0312 de 2019 (Estándar 2.1.1) para Colombia.

Tu tarea es realizar un ANÁLISIS ESTRATÉGICO PROFUNDO del contexto interno y externo de la empresa a partir de sus datos reales del ecosistema Somos SST, y generar la Matriz DOFA/PESTEL de SST (10 a 12 factores equilibrados), las Partes Interesadas (Stakeholders, 6 a 8 actores) y los Cruces Estratégicos (FO, DO, FA, DA con 2 a 3 estrategias por cuadrante).

=== INFORMACIÓN REAL DE LA ORGANIZACIÓN ===
${companyContextStr}

=== EVALUACIÓN DE ESTÁNDARES MÍNIMOS (RES. 0312/2019) ===
${diagStr}

=== PELIGROS Y RIESGOS OCUPACIONALES IDENTIFICADOS (GTC-45) ===
${peligrosStr}

=== GOBERNANZA, HUELLA BIOCÉNTRICA, COMITÉS Y CONTROL ACPM ===
${comitesStr}
${emergenciasStr}

=== INSTRUCCIONES ESTRICTAS ===
1. Genera entre 10 y 12 factores en "dofaList" (mínimo 2-3 Fortalezas, 2-3 Debilidades, 2-3 Oportunidades y 2-3 Amenazas) 100% personalizados a la actividad económica (${comp.economicActivity || 'la empresa'}), nivel de riesgo (${comp.riskLevel || 'III'}) y hallazgos reales del ecosistema Somos SST.
2. En cada ítem de "dofaList" incluye:
   - "type": "fortaleza" | "debilidad" | "oportunidad" | "amenaza"
   - "description": Redacción técnica y concreta enfocada en SST.
   - "strategicAction": Plan de acción concreto para sostener, corregir, aprovechar o mitigar el factor.
   - "category": Una de: "Legal / Normativo", "Tecnológico / IA", "Operativo / Biomecánico", "Psicosocial / Cultura", "Vial / PESV", "Químico / Ambiental", "Financiero / Presupuesto", "Gobernanza / SST".
   - "originModule": Fuente real del hallazgo: "Diagnóstico 0312", "Matriz IPEVR GTC-45", "Huella Biocéntrica", "Comités y Brigada", "Centro de Control ACPM", "Entorno Externo", "Contexto Organizacional".
   - "impact": "alto" | "medio" | "bajo"
   - "responsible": Cargo responsable sugerido (ej: "Responsable SG-SST", "Alta Dirección", "COPASST", "Líder de Talento Humano", "ARL / Asesor SST").
   - "status": "En Plan de Acción" | "Monitoreo Permanente" | "Prioridad Inmediata"
3. En "stakeholders" (6 a 8 partes interesadas internas y externas) incluye:
   - "parte": Nombre del actor (ej: "Trabajadores Directos y Operativos", "Alta Dirección y Accionistas", "Contratistas y Proveedores Críticos", "ARL (${comp.arl || 'Administradora de Riesgos Laborales'})", "Ministerio del Trabajo y Entes de Control", "Clientes y Usuarios", "Comunidad Vecina y Autoridades Ambientales/Salud").
   - "type": "Interno" o "Externo".
   - "necesidades": Requisitos obligatorios legales o contractuales en SST.
   - "expectativas": Expectativas de bienestar, continuidad operativa y prevención.
   - "requisito": Norma colombiana exacta (ej: "Dec. 1072/2015 Art. 2.2.4.6.8 · Res. 0312/2019", "ISO 45001:2018 Cl. 4.2 · Ley 1562/2012").
   - "control": Mecanismo operativo de cumplimiento y verificación en el SG-SST.
   - "communicationChannel": Canal formal de comunicación y participación (ej: "Inducción, COPASST y Cartelera Digital WAPPY", "Revisión por la Dirección e Informes Trimestrales").
   - "frequency": Frecuencia de seguimiento ("Mensual", "Trimestral", "Semestral", "Anual", "Permanente").
   - "impactLevel": "alto" o "medio".
4. En "crossStrategies" incluye de 2 a 3 estrategias accionables por cada cuadrante: "fo", "do", "fa", "da".

RESPONDE ÚNICA Y EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO SIN TEXTO ADICIONAL:
{
  "dofaList": [
    {
      "id": "dofa_1",
      "type": "fortaleza",
      "description": "...",
      "source": "interno",
      "impact": "alto",
      "strategicAction": "...",
      "category": "Gobernanza / SST",
      "originModule": "Diagnóstico 0312",
      "responsible": "Responsable SG-SST",
      "status": "En Plan de Acción"
    }
  ],
  "stakeholders": [
    {
      "id": "stk_1",
      "parte": "Trabajadores Directos y Operativos",
      "type": "Interno",
      "necesidades": "...",
      "expectativas": "...",
      "requisito": "Dec. 1072/2015 Art. 2.2.4.6.10 · ISO 45001 Cl. 5.4",
      "control": "...",
      "communicationChannel": "COPASST, Inducción y Reportes SST",
      "frequency": "Mensual",
      "impactLevel": "alto"
    }
  ],
  "crossStrategies": {
    "fo": ["...", "..."],
    "do": ["...", "..."],
    "fa": ["...", "..."],
    "da": ["...", "..."]
  }
}`;

    const modelToUse = modelName || 'gemini-2.5-flash';
    const result = await generateWithKeyRotation(modelToUse, userId, promptText);
    const response = await result.response;
    const rawText = response.text();

    let parsed;
    try {
      parsed = parseGeminiJson(rawText);
    } catch (parseErr) {
      logger.error('[SGSST Contexto] JSON parse error:', parseErr.message, 'Raw text:', rawText);
      return res.status(500).json({
        error: 'La IA no devolvió un formato JSON estructurado válido. Por favor, reintenta.',
      });
    }

    // Normalizar datos recibidos
    const dofaList = Array.isArray(parsed.dofaList)
      ? parsed.dofaList.map((item, idx) => {
          const cleanType = ['fortaleza', 'debilidad', 'oportunidad', 'amenaza'].includes(
            String(item.type || '').toLowerCase()
          )
            ? String(item.type).toLowerCase()
            : 'fortaleza';
          return {
            id: item.id || `dofa_${Date.now()}_${idx}`,
            type: cleanType,
            description: item.description || '',
            source: cleanType === 'fortaleza' || cleanType === 'debilidad' ? 'interno' : 'externo',
            impact: ['alto', 'medio', 'bajo'].includes(String(item.impact || '').toLowerCase())
              ? String(item.impact).toLowerCase()
              : 'alto',
            strategicAction: item.strategicAction || '',
            category: item.category || 'Gobernanza / SST',
            originModule: item.originModule || 'Contexto Organizacional',
            responsible: item.responsible || 'Responsable SG-SST',
            status: item.status || 'En Plan de Acción',
            sentToKanban: Boolean(item.sentToKanban),
          };
        })
      : [];

    const stakeholders = Array.isArray(parsed.stakeholders)
      ? parsed.stakeholders.map((item, idx) => ({
          id: item.id || `stk_${Date.now()}_${idx}`,
          parte: item.parte || '',
          type: item.type === 'Externo' || item.type === 'externo' ? 'Externo' : 'Interno',
          necesidades: item.necesidades || '',
          expectativas: item.expectativas || '',
          requisito: item.requisito || 'ISO 45001:2018 Cl. 4.2 · Dec. 1072/2015',
          control: item.control || 'Seguimiento en comités y auditorías periódicas',
          communicationChannel: item.communicationChannel || 'Comités SST / Cartelera Digital WAPPY',
          frequency: item.frequency || 'Mensual',
          impactLevel: String(item.impactLevel || 'alto').toLowerCase(),
        }))
      : [];

    const crossStrategies = {
      fo: Array.isArray(parsed.crossStrategies?.fo) ? parsed.crossStrategies.fo : [],
      do: Array.isArray(parsed.crossStrategies?.do) ? parsed.crossStrategies.do : [],
      fa: Array.isArray(parsed.crossStrategies?.fa) ? parsed.crossStrategies.fa : [],
      da: Array.isArray(parsed.crossStrategies?.da) ? parsed.crossStrategies.da : [],
    };

    // Guardar automáticamente en BD para este usuario y empresa
    await ContextoData.findOneAndUpdate(
      { user: userId, ...(companyId ? { companyId } : {}) },
      {
        $set: {
          dofaList,
          stakeholders,
          crossStrategies,
          companyId,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      dofaList,
      stakeholders,
      crossStrategies,
      ecosystemMetrics: context.ecosystemMetrics,
      message: 'Matriz DOFA/PESTEL, Partes Interesadas y Cruces Estratégicos generados exitosamente con la información real de Somos SST.',
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Error generating matrix with AI:', error);
    res.status(500).json({ error: error.message || 'Error al compilar la matriz con IA.' });
  }
});

/**
 * POST /api/sgsst/contexto/suggest-item
 * Asistente IA granular para autocompletar/enriquecer un factor DOFA, un Stakeholder o regenerar Cruces Estratégicos.
 */
router.post('/suggest-item', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mode = 'dofa', inputData = {}, dofaList = [], modelName } = req.body;
    const company = await getActiveCompany(userId);
    const companyContextStr = buildCompanyContextString(company || {});
    const modelToUse = modelName || 'gemini-2.5-flash';

    if (mode === 'dofa') {
      const factorType = inputData.type || 'fortaleza';
      const userDraft = inputData.description || '';
      const categoryHint = inputData.category || 'Gobernanza / SST';

      const prompt = `Eres un Consultor Sénior SG-SST experto en ISO 45001:2018 (Cláusula 4.1) y Decreto 1072 de 2015 en Colombia.
Contexto de la empresa:
${companyContextStr}

El usuario desea redactar o enriquecer un factor de la Matriz DOFA/PESTEL de tipo "${factorType.toUpperCase()}" en la dimensión "${categoryHint}".
Borrador o idea inicial del usuario: "${userDraft || 'Sugerir un factor estratégico clave para la actividad económica de la empresa'}"

Devuelve ÚNICAMENTE un objeto JSON válido con la versión enriquecida, técnica y accionable:
{
  "item": {
    "type": "${factorType}",
    "description": "Descripción técnica, precisa y contextualizada en SST...",
    "strategicAction": "Plan o medida concreta de acción en el SG-SST...",
    "category": "${categoryHint}",
    "originModule": "Contexto Organizacional",
    "impact": "alto",
    "responsible": "Responsable SG-SST",
    "status": "En Plan de Acción"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({ success: true, item: parsed.item || parsed });
    }

    if (mode === 'stakeholder') {
      const parteName = inputData.parte || 'Trabajadores y Colaboradores';
      const prompt = `Eres un Consultor Sénior SG-SST experto en ISO 45001:2018 (Cláusula 4.2) y legislación laboral colombiana.
Contexto de la empresa:
${companyContextStr}

Completa con rigor técnico y normativo la matriz de Parte Interesada para el actor: "${parteName}".
Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura:
{
  "item": {
    "parte": "${parteName}",
    "type": "Interno",
    "necesidades": "Requisitos legales y técnicos obligatorios...",
    "expectativas": "Expectativas legítimas en seguridad, salud y continuidad...",
    "requisito": "Citación normativa exacta de Colombia (ej. Dec. 1072/2015 Art. 2.2.4.6.8, Res. 0312/2019, ISO 45001 Cl. 4.2)",
    "control": "Mecanismo operativo de control y evidencia en el SG-SST...",
    "communicationChannel": "Canal formal de comunicación y consulta...",
    "frequency": "Mensual",
    "impactLevel": "alto"
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({ success: true, item: parsed.item || parsed });
    }

    if (mode === 'strategies') {
      const summaryDofa = Array.isArray(dofaList)
        ? dofaList.map((d) => `[${String(d.type).toUpperCase()}] ${d.description}`).join('\n')
        : '';
      const prompt = `Eres un Consultor Sénior SG-SST experto en Planificación Estratégica ISO 45001:2018.
Contexto de la empresa:
${companyContextStr}

Factores DOFA actuales de la organización:
${summaryDofa || 'Empresa en proceso de consolidación de su SG-SST.'}

Formula entre 2 y 3 estrategias cruzadas altamente concretas y accionables por cada cuadrante (FO, DO, FA, DA).
Devuelve ÚNICAMENTE un objeto JSON válido:
{
  "crossStrategies": {
    "fo": ["Estrategia FO 1...", "Estrategia FO 2..."],
    "do": ["Estrategia DO 1...", "Estrategia DO 2..."],
    "fa": ["Estrategia FA 1...", "Estrategia FA 2..."],
    "da": ["Estrategia DA 1...", "Estrategia DA 2..."]
  }
}`;
      const result = await generateWithKeyRotation(modelToUse, userId, prompt);
      const parsed = parseGeminiJson((await result.response).text());
      return res.json({
        success: true,
        crossStrategies: parsed.crossStrategies || parsed,
      });
    }

    return res.status(400).json({ error: 'Modo de sugerencia no válido.' });
  } catch (error) {
    logger.error('[SGSST Contexto] Error in suggest-item:', error);
    res.status(500).json({ error: error.message || 'Error al generar sugerencia con IA.' });
  }
});

/**
 * POST /api/sgsst/contexto/send-to-oportunidades
 * Articula el Contexto Organizacional (ISO 45001 Cl. 4.1 y 4.2) con el aplicativo
 * "Riesgos del Sistema y Oportunidades SST" (ISO 45001 Cl. 6.1.1 y 6.1.2.3).
 */
router.post('/send-to-oportunidades', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const filter = { user: userId, ...(companyId ? { companyId } : {}) };

    const contextoDoc = await ContextoData.findOne(filter).lean();
    const dofaList = Array.isArray(req.body.dofaList)
      ? req.body.dofaList
      : contextoDoc?.dofaList || [];
    const stakeholders = Array.isArray(req.body.stakeholders)
      ? req.body.stakeholders
      : contextoDoc?.stakeholders || [];
    const crossStrategies = req.body.crossStrategies || contextoDoc?.crossStrategies || {};

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

    // 1. Oportunidades DOFA -> Oportunidades de SST (Cl. 6.1.2.3)
    for (const item of dofaList) {
      if (item.type === 'oportunidad' && item.description) {
        const key = norm(item.description);
        if (!existingOpTitles.has(key)) {
          oportDoc.oportunidades.push({
            id: `op_ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            titulo: item.description,
            categoria: item.category || 'Entorno Externo / Innovación SST',
            origenSst: `Contexto DOFA (${item.originModule || 'Oportunidad Externa'})`,
            beneficioEsperado:
              item.strategicAction ||
              'Fortalecimiento de la prevención de ATEL y mejora continua del SG-SST.',
            impactoPrioridad:
              String(item.impact || 'alto').toLowerCase() === 'alto' ? 'Alto' : 'Medio',
            viabilidad: 'Alta',
            recursosRequeridos: 'Gestión SG-SST / Alianzas ARL',
            indicadorExito: '100% de ejecución del plan estratégico asociado',
            responsable: item.responsible || 'Responsable SG-SST',
            plazo: 'Mediano Plazo (3-6 meses)',
            estado: 'Planificada',
          });
          existingOpTitles.add(key);
          addedOportunidades++;
        }
      } else if ((item.type === 'amenaza' || item.type === 'debilidad') && item.description) {
        const key = norm(item.description);
        if (!existingRiskTitles.has(key)) {
          const isHigh = String(item.impact || 'alto').toLowerCase() === 'alto';
          oportDoc.riesgosSistema.push({
            id: `rs_ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            amenaza: item.description,
            fuenteContexto: `Contexto DOFA (${item.type === 'amenaza' ? 'Amenaza Externa' : 'Debilidad Interna'} · ${item.category || 'SST'})`,
            impactoSistema: isHigh ? 'Alto' : 'Medio',
            probabilidad: item.type === 'debilidad' ? 'Alta' : 'Media',
            nivelRiesgo: isHigh ? 'Crítico' : 'Alto',
            controlExistente: 'Seguimiento periódico en SG-SST',
            medidaMitigacion:
              item.strategicAction ||
              'Implementar control operativo y seguimiento en el Plan de Trabajo Anual.',
            responsableMonitoreo: item.responsible || 'Responsable SG-SST',
            plazo: isHigh ? 'Inmediato (30 días)' : 'Corto Plazo (1-3 meses)',
            estadoControl: 'En Tratamiento',
          });
          existingRiskTitles.add(key);
          addedRiesgos++;
        }
      }
    }

    // 2. Estrategias FO / DO -> Oportunidades de Mejora SST
    const foStrategies = [
      ...(Array.isArray(crossStrategies.fo) ? crossStrategies.fo : []),
      ...(Array.isArray(crossStrategies.do) ? crossStrategies.do : []),
    ];
    for (const strat of foStrategies) {
      const cleanStrat = String(strat || '').trim();
      if (cleanStrat && !existingOpTitles.has(norm(cleanStrat))) {
        oportDoc.oportunidades.push({
          id: `op_strat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          titulo: cleanStrat,
          categoria: 'Estrategia Cruzada FO/DO',
          origenSst: 'Cruces Estratégicos del Contexto (Cl. 4.1)',
          beneficioEsperado: 'Aprovechamiento de fortalezas y oportunidades para elevar la madurez SST.',
          impactoPrioridad: 'Alto',
          viabilidad: 'Alta',
          recursosRequeridos: 'Plan de Trabajo Anual SG-SST',
          indicadorExito: 'Estrategia implementada y verificada en revisión gerencial',
          responsable: 'Responsable SG-SST',
          plazo: 'Mediano Plazo (3-6 meses)',
          estado: 'Planificada',
        });
        existingOpTitles.add(norm(cleanStrat));
        addedOportunidades++;
      }
    }

    // 3. Partes Interesadas de Alto Impacto -> Riesgos Legales/Contractuales del Sistema
    for (const stk of stakeholders) {
      if (String(stk.impactLevel || 'alto').toLowerCase() === 'alto' && stk.necesidades) {
        const riskTitle = `Incumplimiento de requisitos de ${stk.parte}: ${stk.necesidades}`;
        if (!existingRiskTitles.has(norm(riskTitle))) {
          oportDoc.riesgosSistema.push({
            id: `rs_stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            amenaza: riskTitle,
            fuenteContexto: `Parte Interesada ${stk.type || 'Pertinente'} (${stk.requisito || 'Cl. 4.2'})`,
            impactoSistema: 'Alto',
            probabilidad: 'Media',
            nivelRiesgo: 'Alto',
            controlExistente: stk.control || 'Monitoreo normativo',
            medidaMitigacion: `Garantizar cumplimiento mediante ${stk.control || 'control documental'} y comunicación vía ${stk.communicationChannel || 'canales oficiales'} (${stk.frequency || 'Mensual'}).`,
            responsableMonitoreo: 'Responsable SG-SST',
            plazo: 'Corto Plazo (1-3 meses)',
            estadoControl: 'Monitoreado',
          });
          existingRiskTitles.add(norm(riskTitle));
          addedRiesgos++;
        }
      }
    }

    oportDoc.updatedAt = new Date();
    await oportDoc.save();

    return res.json({
      success: true,
      addedOportunidades,
      addedRiesgos,
      totalOportunidades: oportDoc.oportunidades.length,
      totalRiesgos: oportDoc.riesgosSistema.length,
      message: `Sincronización exitosa con Riesgos del Sistema y Oportunidades SST: +${addedOportunidades} oportunidades y +${addedRiesgos} riesgos estratégicos articulados.`,
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Error syncing to Oportunidades:', error);
    res.status(500).json({ error: 'Error al articular con Oportunidades y Riesgos del Sistema.' });
  }
});

/**
 * POST /api/sgsst/contexto/send-to-kanban
 * Envía una acción estratégica del Contexto o Parte Interesada directamente al Centro de Control Kanban / ACPM.
 */
router.post('/send-to-kanban', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id ? String(company._id) : undefined;

    const {
      title,
      description,
      priority = 'alta',
      actionType = 'preventiva',
      assignedTo = 'Responsable SG-SST',
      referenceId,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'El título de la acción estratégica es obligatorio.' });
    }

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let task = null;
    if (referenceId) {
      task = await KanbanTask.findOne({
        user: userId,
        ...(companyId ? { companyId } : {}),
        referenceId: String(referenceId),
      });
    }

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
        actionType: ['correctiva', 'preventiva', 'mejora'].includes(actionType) ? actionType : 'preventiva',
        sourceModule: 'Contexto y Partes Interesadas (ISO 45001 Cl. 4.1/4.2)',
        assignedTo,
        referenceId: referenceId ? String(referenceId) : `ctx_${Date.now()}`,
        referenceName: 'Contexto de la Organización',
      });
    }

    // Marcar sentToKanban en ContextoData si coincide con un ítem DOFA
    if (referenceId) {
      const ctxDoc = await ContextoData.findOne({
        user: userId,
        ...(company?._id ? { companyId: company._id } : {}),
      });
      if (ctxDoc && Array.isArray(ctxDoc.dofaList)) {
        let touched = false;
        ctxDoc.dofaList.forEach((d) => {
          if (d.id === referenceId) {
            d.sentToKanban = true;
            touched = true;
          }
        });
        if (touched) {
          ctxDoc.markModified('dofaList');
          await ctxDoc.save();
        }
      }
    }

    return res.json({
      success: true,
      task,
      message: `Acción "${task.title}" enviada al Centro de Control Kanban / ACPM.`,
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Error sending to Kanban:', error);
    res.status(500).json({ error: 'Error al crear tarea en el Centro de Control Kanban.' });
  }
});

/**
 * POST /api/sgsst/contexto/generate-report
 * Construye el informe corporativo estandarizado con:
 * - Encabezado corporativo oficial WAPPY (buildStandardHeader) con logo y tabla 4x4
 * - Resumen de Articulación con el Ecosistema Somos SST
 * - Tablas estilizadas con estilos inline hexadecimales planos para DOFA/PESTEL, Estrategias Cruzadas y Partes Interesadas
 * - Sección oficial de tres firmas digitales (buildSignatureSection)
 */
router.post('/generate-report', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const context = await gatherCompanyFullContext(userId, companyId);
    const em = context.ecosystemMetrics;

    const { dofaList = [], stakeholders = [], crossStrategies = {} } = req.body;

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 1. Construir Encabezado Oficial Estándar
    const headerHtml = buildStandardHeader({
      title: 'ESTUDIO DEL CONTEXTO ORGANIZACIONAL Y PARTES INTERESADAS (DOFA / PESTEL / STAKEHOLDERS)',
      companyInfo: company,
      date: currentDate,
      norm: 'ISO 45001:2018 Cláusulas 4.1 y 4.2 · Dec. 1072/2015 Art. 2.2.4.6.8 · Res. 0312/2019 Est. 2.1.1',
      responsibleName: req.user?.name,
    });

    // 2. Construir Bloques DOFA
    const fortalezas = dofaList.filter((d) => d.type === 'fortaleza');
    const debilidades = dofaList.filter((d) => d.type === 'debilidad');
    const oportunidades = dofaList.filter((d) => d.type === 'oportunidad');
    const amenazas = dofaList.filter((d) => d.type === 'amenaza');

    const renderList = (items, accentColor, emptyMsg) => {
      if (!items || items.length === 0) {
        return `<li style="color: #94a3b8; font-style: italic;">${emptyMsg}</li>`;
      }
      return items
        .map(
          (i) => `
        <li style="margin-bottom: 10px; line-height: 1.5; color: #1e293b;">
          <strong>${i.description}</strong>
          <div style="font-size: 10px; color: #475569; margin-top: 2px;">
            <strong>Dimensión:</strong> ${i.category || 'Gobernanza / SST'} · <strong>Origen:</strong> ${i.originModule || 'Contexto'} · <strong>Impacto:</strong> ${String(i.impact || 'Alto').toUpperCase()} · <strong>Responsable:</strong> ${i.responsible || 'Responsable SG-SST'}
          </div>
          ${i.strategicAction ? `<div style="font-size: 11px; color: ${accentColor}; margin-top: 3px;">➔ <em>Plan de Acción:</em> ${i.strategicAction}</div>` : ''}
        </li>`
        )
        .join('');
    };

    // 3. Filas de Partes Interesadas
    const stakeholderRows = stakeholders.length > 0
      ? stakeholders
          .map(
            (s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11px; color: #1e293b;">
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">
            ${s.parte}
            <div style="font-size: 9.5px; font-weight: normal; color: #64748b; margin-top: 3px;">
              Tipo: <strong>${s.type || 'Interno'}</strong> · Impacto: <strong>${String(s.impactLevel || 'Alto').toUpperCase()}</strong>
            </div>
          </td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${s.necesidades}</td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">${s.expectativas || 'Cumplimiento normativo y estándares de SST.'}</td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top; color: #334155; font-weight: 600;">${s.requisito || 'ISO 45001 / Dec. 1072'}</td>
          <td style="padding: 9px 10px; border: 1px solid #cbd5e1; vertical-align: top;">
            ${s.control || 'Monitoreo y comités'}
            <div style="font-size: 9.5px; color: #0f766e; margin-top: 3px;">
              <strong>Canal:</strong> ${s.communicationChannel || 'Comités SST'} (${s.frequency || 'Mensual'})
            </div>
          </td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="5" style="padding: 14px; text-align: center; color: #94a3b8; border: 1px solid #cbd5e1;">No se registraron partes interesadas</td></tr>`;

    // 4. Filas de Estrategias Cruzadas
    const foList = (crossStrategies?.fo || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') || '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';
    const doList = (crossStrategies?.do || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') || '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';
    const faList = (crossStrategies?.fa || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') || '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';
    const daList = (crossStrategies?.da || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') || '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';

    // 5. Ensamblar Cuerpo Completo del Informe con Estilos Planos compatibles con Word/PDF
    const reportBody = `
<div style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; line-height: 1.6; max-width: 100%;">

  <!-- 1. OBJETO Y ALCANCE NORMATIVO -->
  <div style="margin-bottom: 22px; padding: 14px 18px; background-color: #f0fdfa; border-left: 4px solid #0f766e;">
    <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 13.5px; font-weight: 800; text-transform: uppercase;">
      1. Objeto y Alcance del Diagnóstico Organizacional
    </h3>
    <p style="margin: 0; font-size: 11.5px; color: #334155; line-height: 1.5;">
      El presente estudio técnico establece la comprensión integral del contexto interno y externo de <strong>${company?.companyName || 'la Organización'}</strong> conforme a los requerimientos de la norma internacional <strong>ISO 45001:2018 (Cláusulas 4.1 y 4.2)</strong>, articulados con el <strong>Decreto 1072 de 2015 (Art. 2.2.4.6.8)</strong> y los Estándares Mínimos de la <strong>Resolución 0312 de 2019 (Estándar 2.1.1)</strong>. Los factores determinados son insumo de entrada obligatorio para la determinación de Riesgos y Oportunidades del SG-SST (Cláusula 6.1), el Plan de Trabajo Anual y la asignación presupuestal.
    </p>
  </div>

  <!-- 2. RADIACIÓN DEL ECOSISTEMA SOMOS SST -->
  <div style="margin-bottom: 24px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      2. Articulación e Insumos del Ecosistema Somos SST
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1; margin-bottom: 12px;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 8px 10px; border: 1px solid #0f766e; text-align: left;">Módulo Fuente Somos SST</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; text-align: left;">Indicador Consolidado</th>
          <th style="padding: 8px 10px; border: 1px solid #0f766e; text-align: left;">Incidencia en el Contexto (Cl. 4.1 / 4.2)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background-color: #ffffff;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Autoevaluación Res. 0312/2019</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Puntaje: <strong>${em.diagnosticoScore}%</strong> (${em.diagnosticoLevel}) · Brechas: ${em.diagnosticoGaps}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Determina fortalezas de cumplimiento legal y debilidades normativas prioritarias.</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Matriz IPEVR GTC-45</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>${em.totalPeligros}</strong> peligros identificados (<strong>${em.peligrosCriticos}</strong> críticos/altos)</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Alimenta las condiciones operativas internas y controles prioritarios en fuente, medio e individuo.</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Huella Biocéntrica y Cargos</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>${em.totalWorkers}</strong> trabajadores activos · <strong>${em.totalCargos}</strong> perfiles de cargo</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Define las necesidades y expectativas de la población trabajadora (Cláusula 4.2).</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">Gobernanza y Centro ACPM</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>${em.comitesActivos}</strong> comités · <strong>${em.brigadistasCount}</strong> brigadistas · <strong>${em.acpmPending}</strong> ACPM abiertas</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Mide la capacidad de respuesta interna, participación y cierre de acciones correctivas/preventivas.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 3. MATRIZ DOFA DE SEGURIDAD Y SALUD EN EL TRABAJO -->
  <div style="margin-bottom: 26px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      3. Matriz DOFA / PESTEL de Seguridad y Salud en el Trabajo (Cláusula 4.1)
    </h3>

    <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 14px;">
      <tr>
        <!-- FORTALEZAS -->
        <td style="width: 50%; vertical-align: top; background-color: #ffffff; border: 2px solid #059669; padding: 14px;">
          <div style="border-bottom: 2px solid #059669; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase;">
              FORTALEZAS (FACTORES INTERNOS · ${fortalezas.length})
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px;">
            ${renderList(fortalezas, '#059669', 'No se registraron fortalezas')}
          </ul>
        </td>

        <!-- OPORTUNIDADES -->
        <td style="width: 50%; vertical-align: top; background-color: #ffffff; border: 2px solid #0284c7; padding: 14px;">
          <div style="border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #0284c7; text-transform: uppercase;">
              OPORTUNIDADES (FACTORES EXTERNOS · ${oportunidades.length})
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px;">
            ${renderList(oportunidades, '#0284c7', 'No se registraron oportunidades')}
          </ul>
        </td>
      </tr>

      <tr>
        <!-- DEBILIDADES -->
        <td style="width: 50%; vertical-align: top; background-color: #ffffff; border: 2px solid #d97706; padding: 14px;">
          <div style="border-bottom: 2px solid #d97706; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #d97706; text-transform: uppercase;">
              DEBILIDADES (FACTORES INTERNOS · ${debilidades.length})
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px;">
            ${renderList(debilidades, '#d97706', 'No se registraron debilidades')}
          </ul>
        </td>

        <!-- AMENAZAS -->
        <td style="width: 50%; vertical-align: top; background-color: #ffffff; border: 2px solid #dc2626; padding: 14px;">
          <div style="border-bottom: 2px solid #dc2626; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #dc2626; text-transform: uppercase;">
              AMENAZAS (FACTORES EXTERNOS · ${amenazas.length})
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px;">
            ${renderList(amenazas, '#dc2626', 'No se registraron amenazas')}
          </ul>
        </td>
      </tr>
    </table>
  </div>

  <!-- 4. MATRIZ DE ESTRATEGIAS CRUZADAS (FO, DO, FA, DA) -->
  <div style="margin-bottom: 26px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      4. Cruces Estratégicos de SST (Articulación con Cláusula 6.1)
    </h3>
    <table style="width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #cbd5e1;">
      <tr>
        <td style="width: 50%; vertical-align: top; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #0f766e; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias Ofensivas FO (Fortalezas + Oportunidades)
          </h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${foList}
          </ul>
        </td>

        <td style="width: 50%; vertical-align: top; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #0284c7; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias Reorientadoras DO (Debilidades + Oportunidades)
          </h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${doList}
          </ul>
        </td>
      </tr>

      <tr>
        <td style="width: 50%; vertical-align: top; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #d97706; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias Defensivas FA (Fortalezas + Amenazas)
          </h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${faList}
          </ul>
        </td>

        <td style="width: 50%; vertical-align: top; background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #dc2626; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias de Supervivencia DA (Debilidades + Amenazas)
          </h4>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${daList}
          </ul>
        </td>
      </tr>
    </table>
  </div>

  <!-- 5. MATRIZ DE PARTES INTERESADAS (CLÁUSULA 4.2) -->
  <div style="margin-bottom: 26px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      5. Matriz de Partes Interesadas y Requisitos Legales de SST (Cláusula 4.2)
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">
      <thead>
        <tr style="background-color: #0f766e; color: #ffffff;">
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 20%; text-align: left;">Parte Interesada</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 22%; text-align: left;">Necesidades (Obligatorias)</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 20%; text-align: left;">Expectativas</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 16%; text-align: left;">Marco Jurídico</th>
          <th style="padding: 9px 10px; border: 1px solid #0f766e; width: 22%; text-align: left;">Control y Canal de Participación</th>
        </tr>
      </thead>
      <tbody>
        ${stakeholderRows}
      </tbody>
    </table>
  </div>

  <!-- 6. GOBERNANZA Y SEGUIMIENTO -->
  <div style="margin-bottom: 30px; padding: 14px 18px; background-color: #f8fafc; border: 1px solid #cbd5e1;">
    <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase;">
      6. Articulación con Riesgos del Sistema, Plan de Trabajo Anual y Revisión Gerencial
    </h3>
    <p style="margin: 0; font-size: 11.5px; color: #475569; line-height: 1.5;">
      El presente estudio de contexto será revisado de forma ordinaria al menos una vez al año en la Revisión por la Alta Dirección (Dec. 1072/2015 Art. 2.2.4.6.31), o de manera extraordinaria ante cambios normativos, organizacionales o de procesos. Sus hallazgos alimentan directamente el módulo de <strong>Riesgos del Sistema y Oportunidades SST (ISO 45001 Cl. 6.1)</strong> y el <strong>Centro de Control ACPM</strong>.
    </p>
  </div>

</div>
`;

    // 6. Ensamblar con Firmas Digitales Oficiales
    let signaturesHtml = '';
    if (company) {
      signaturesHtml = buildSignatureSection(company);
    }

    const fullReportHtml = `${headerHtml}\n${reportBody}\n${signaturesHtml}`;

    // Actualizar en BD el último reporte generado
    await ContextoData.findOneAndUpdate(
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

    res.json({
      success: true,
      html: fullReportHtml,
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Error generating report:', error);
    res.status(500).json({ error: error.message || 'Error al compilar el informe oficial.' });
  }
});

module.exports = router;
module.exports.gatherCompanyFullContext = gatherCompanyFullContext;
