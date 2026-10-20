const express = require('express');
const mongoose = require('mongoose');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const ContextoData = require('~/models/ContextoData');
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
 * Metodología de recolección de información integral de la empresa
 * Consolida datos de perfil, diagnóstico 0312, peligros GTC-45, comités y emergencias.
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
  try {
    const DiagnosticoData =
      mongoose.models.DiagnosticoData || require('~/models/DiagnosticoData');
    diagnostico = await DiagnosticoData.findOne(baseFilter).lean();
  } catch (err) {
    logger.debug('[Contexto] DiagnosticoData lookup failed:', err.message);
  }

  // 3. Matriz de Peligros y Valoración de Riesgos (GTC-45)
  let peligrosSummary = [];
  try {
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
                nivelRiesgo: pel.interpretacionNR || pel.nivelRiesgo || 'No valorado',
              });
            });
          }
        });
      }
    }
  } catch (err) {
    logger.debug('[Contexto] MatrizPeligrosData lookup failed:', err.message);
  }

  // 4. Comités reglamentarios (COPASST, Convivencia, Brigada)
  let copasstMembersCount = 0;
  let convivenciaMembersCount = 0;
  let brigadaCount = 0;
  try {
    const SgsstCopasst = mongoose.models.SgsstCopasst;
    if (SgsstCopasst) {
      const cop = await SgsstCopasst.findOne(baseFilter).lean();
      copasstMembersCount = cop?.members?.length || (cop?.president ? 2 : 0);
    }
    const SgsstConvivencia = mongoose.models.SgsstConvivencia;
    if (SgsstConvivencia) {
      const ccl = await SgsstConvivencia.findOne(baseFilter).lean();
      convivenciaMembersCount = ccl?.members?.length || 0;
    }
    const SgsstBrigadista = mongoose.models.SgsstBrigadista;
    if (SgsstBrigadista) {
      brigadaCount = await SgsstBrigadista.countDocuments(baseFilter);
    }
  } catch (err) {
    logger.debug('[Contexto] Committees lookup failed:', err.message);
  }

  // 5. Análisis de Vulnerabilidad y Amenazas de Emergencia
  let amenazasEmergencia = [];
  try {
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

  return {
    company,
    diagnostico,
    peligrosSummary,
    copasstMembersCount,
    convivenciaMembersCount,
    brigadaCount,
    amenazasEmergencia,
  };
}

/**
 * GET /api/sgsst/contexto/data
 * Carga la matriz DOFA, partes interesadas y estrategias guardadas.
 */
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const data = await ContextoData.findOne({
      user: userId,
      ...(companyId ? { companyId } : {}),
    }).lean();

    if (data) {
      return res.json({
        dofaList: data.dofaList || [],
        stakeholders: data.stakeholders || [],
        crossStrategies: data.crossStrategies || { fo: [], do: [], fa: [], da: [] },
        lastGeneratedReport: data.lastGeneratedReport || '',
        company,
      });
    }

    return res.json({
      dofaList: [],
      stakeholders: [],
      crossStrategies: { fo: [], do: [], fa: [], da: [] },
      lastGeneratedReport: '',
      company,
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
 * la Matriz DOFA de SST, las partes interesadas (Stakeholders) y los cruces estratégicos.
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

    const companyContextStr = buildCompanyContextString(comp);

    // Preparar resumen del diagnóstico 0312
    let diagStr = 'No se ha ejecutado autoevaluación de Estándares Mínimos (Res. 0312/2019).';
    if (context.diagnostico) {
      const d = context.diagnostico;
      const score = d.score !== undefined ? `${d.score}%` : 'No calculado';
      const level = d.complianceLevel || 'En evaluación';
      const failingCount = Array.isArray(d.statusData)
        ? d.statusData.filter((s) => s.status === 'no_cumple' || s.status === 'pendiente').length
        : 0;
      const passingCount = Array.isArray(d.statusData)
        ? d.statusData.filter((s) => s.status === 'cumple').length
        : 0;
      diagStr = `Puntaje obtenido: ${score} · Nivel: ${level}. Estándares que cumplen: ${passingCount}. Estándares pendientes/críticos: ${failingCount}.`;
    }

    // Preparar resumen de peligros GTC-45
    let peligrosStr = 'No se han registrado peligros en la matriz GTC-45 aún.';
    if (context.peligrosSummary.length > 0) {
      const topPeligros = context.peligrosSummary.slice(0, 10).map(
        (p) => `- [${p.proceso} - ${p.actividad}] ${p.clasificacion}: ${p.descripcion} (Riesgo: ${p.nivelRiesgo})`
      );
      peligrosStr = `Peligros identificados en la empresa (${context.peligrosSummary.length} en total):\n${topPeligros.join('\n')}`;
    }

    // Comités y emergencias
    const comitesStr = `COPASST/Vigía: ${context.copasstMembersCount > 0 ? `Activo con ${context.copasstMembersCount} miembros` : 'Pendiente de conformación/registro'}. Comité de Convivencia: ${context.convivenciaMembersCount > 0 ? `Activo con ${context.convivenciaMembersCount} miembros` : 'Pendiente'}. Brigada de Emergencia: ${context.brigadaCount} brigadistas capacitados.`;
    const emergenciasStr = context.amenazasEmergencia.length > 0
      ? `Amenazas identificadas en análisis de vulnerabilidad: ${context.amenazasEmergencia.join(', ')}.`
      : 'Análisis de vulnerabilidad en proceso.';

    const promptText = `Eres el Especialista Sénior en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) de WAPPY, consultor experto en ISO 45001:2018 (Cláusulas 4.1 y 4.2), Decreto 1072 de 2015 (Art. 2.2.4.6.8) y Resolución 0312 de 2019 (Estándar 2.1.1) para Colombia.

Tu tarea es realizar una RECOLECCIÓN Y ANÁLISIS ESTRATÉGICO PROFUNDO del contexto de la empresa a partir de sus datos reales, y generar la Matriz DOFA de SST, las Partes Interesadas (Stakeholders) pertinentes y los Cruces Estratégicos (FO, DO, FA, DA).

=== INFORMACIÓN REAL DE LA ORGANIZACIÓN ===
${companyContextStr}

=== EVALUACIÓN DE ESTÁNDARES MÍNIMOS (RES. 0312/2019) ===
${diagStr}

=== PELIGROS Y RIESGOS OCUPACIONALES IDENTIFICADOS (GTC-45) ===
${peligrosStr}

=== GOBERNANZA, COMITÉS Y EMERGENCIAS ===
${comitesStr}
${emergenciasStr}

=== INSTRUCCIONES ESTRICTAS ===
1. Debes generar un análisis 100% personalizado y coherente con la actividad económica (${comp.economicActivity || 'la empresa'}), su nivel de riesgo (${comp.riskLevel || 'III'}), su tamaño (${comp.workerCount || 'N/A'} trabajadores) y sus peligros reales.
2. Cada factor DOFA debe ser concreto, técnico y aplicable a la prevención de accidentes y enfermedades laborales en Colombia.
   - Fortalezas (Internas): 2 o 3 factores positivos reales de la empresa (gerencia, comités, uso de tecnología WAPPY, etc.).
   - Debilidades (Internas): 2 o 3 oportunidades de mejora interna reales (peligros con controles pendientes, rotación, auto-reporte, etc.).
   - Oportunidades (Externas): 2 o 3 factores externos que favorecen el sistema (programas ARL ${comp.arl || 'de la ARL'}, tecnologías IA, certificaciones, cajas de compensación).
   - Amenazas (Externas): 2 o 3 factores externos de riesgo (cambios regulatorios MinTrabajo, variabilidad climática, emergencias, siniestralidad vial).
3. Partes Interesadas (Stakeholders): Debes identificar entre 5 y 7 partes interesadas clave con:
   - "parte": Nombre del grupo (ej: "Trabajadores Directos y Operativos", "Alta Dirección y Socios", "Contratistas y Proveedores", "ARL y Ministerio del Trabajo", "Comunidad Vecina y Autoridades Locales", "Clientes y Visitantes").
   - "necesidades": Requisitos obligatorios legales/contractuales.
   - "expectativas": Expectativas legítimas de bienestar, continuidad y seguridad.
   - "requisito": Fundamento normativo colombiano exacto (ej: "Dec. 1072/2015 Art. 2.2.4.6.8 · Res. 0312 Est. 2.1.1", "ISO 45001:2018 Cl. 4.2 · CST").
   - "control": Mecanismo operativo de control y monitoreo en el SG-SST de la empresa.
   - "impactLevel": "Alto" o "Medio".
4. Cruces Estratégicos (Cross Strategies):
   - "fo": 2 estrategias que usan fortalezas para aprovechar oportunidades.
   - "do": 2 estrategias que superan debilidades aprovechando oportunidades.
   - "fa": 2 estrategias que usan fortalezas para mitigar amenazas.
   - "da": 2 estrategias defensivas para minimizar debilidades y eludir amenazas.

RESPONDE ÚNICA Y EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO SIN TEXTO ANTES NI DESPUÉS.
FORMATO JSON EXACTO:
{
  "dofaList": [
    {
      "id": "dofa_1",
      "type": "fortaleza",
      "description": "Descripción clara...",
      "source": "interno",
      "impact": "alto",
      "strategicAction": "Acción clave para sostener la fortaleza"
    },
    {
      "id": "dofa_2",
      "type": "debilidad",
      "description": "Descripción clara...",
      "source": "interno",
      "impact": "alto",
      "strategicAction": "Acción correctiva"
    },
    {
      "id": "dofa_3",
      "type": "oportunidad",
      "description": "Descripción clara...",
      "source": "externo",
      "impact": "alto",
      "strategicAction": "Acción para aprovecharla"
    },
    {
      "id": "dofa_4",
      "type": "amenaza",
      "description": "Descripción clara...",
      "source": "externo",
      "impact": "alto",
      "strategicAction": "Acción preventiva de contingencia"
    }
  ],
  "stakeholders": [
    {
      "id": "stk_1",
      "parte": "Trabajadores Directos y Operativos",
      "necesidades": "...",
      "expectativas": "...",
      "requisito": "...",
      "control": "...",
      "impactLevel": "alto"
    }
  ],
  "crossStrategies": {
    "fo": ["Estrategia FO 1...", "Estrategia FO 2..."],
    "do": ["Estrategia DO 1...", "Estrategia DO 2..."],
    "fa": ["Estrategia FA 1...", "Estrategia FA 2..."],
    "da": ["Estrategia DA 1...", "Estrategia DA 2..."]
  }
}`;

    const modelToUse = modelName || 'gemini-2.5-flash';
    const result = await generateWithKeyRotation(modelToUse, userId, promptText);
    const response = await result.response;
    const rawText = response.text();

    // Limpieza de formato Markdown de bloques JSON
    let cleanedJson = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    // Intentar extraer JSON si hay texto adicional
    const firstBrace = cleanedJson.indexOf('{');
    const lastBrace = cleanedJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch (parseErr) {
      logger.error('[SGSST Contexto] JSON parse error:', parseErr.message, 'Raw text:', rawText);
      return res.status(500).json({
        error: 'La IA no devolvió un formato JSON estructurado válido. Por favor, reintenta.',
      });
    }

    // Normalizar datos recibidos
    const dofaList = Array.isArray(parsed.dofaList)
      ? parsed.dofaList.map((item, idx) => ({
          id: item.id || `dofa_${Date.now()}_${idx}`,
          type: ['fortaleza', 'debilidad', 'oportunidad', 'amenaza'].includes(item.type)
            ? item.type
            : 'fortaleza',
          description: item.description || '',
          source: (item.type === 'fortaleza' || item.type === 'debilidad') ? 'interno' : 'externo',
          impact: item.impact || 'alto',
          strategicAction: item.strategicAction || '',
        }))
      : [];

    const stakeholders = Array.isArray(parsed.stakeholders)
      ? parsed.stakeholders.map((item, idx) => ({
          id: item.id || `stk_${Date.now()}_${idx}`,
          parte: item.parte || '',
          necesidades: item.necesidades || '',
          expectativas: item.expectativas || '',
          requisito: item.requisito || 'ISO 45001:2018 Cl. 4.2 · Dec. 1072/2015',
          control: item.control || 'Seguimiento en comités y auditorías periódicas',
          impactLevel: item.impactLevel || 'alto',
        }))
      : [];

    const crossStrategies = parsed.crossStrategies || { fo: [], do: [], fa: [], da: [] };

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
      message: 'Matriz DOFA y Partes Interesadas generadas exitosamente con la información de la empresa.',
    });
  } catch (error) {
    logger.error('[SGSST Contexto] Error generating matrix with AI:', error);
    res.status(500).json({ error: error.message || 'Error al compilar la matriz con IA.' });
  }
});

/**
 * POST /api/sgsst/contexto/generate-report
 * Construye el informe corporativo estandarizado con:
 * - Encabezado corporativo oficial WAPPY (buildStandardHeader) con logo y tabla 4x4
 * - Cuerpos y tablas estilizadas para DOFA, Estrategias Cruzadas y Partes Interesadas
 * - Sección oficial de tres firmas digitales (buildSignatureSection)
 */
router.post('/generate-report', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const { dofaList = [], stakeholders = [], crossStrategies = {}, modelName } = req.body;

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 1. Construir Encabezado Oficial Estándar
    const headerHtml = buildStandardHeader({
      title: 'ESTUDIO DEL CONTEXTO ORGANIZACIONAL Y PARTES INTERESADAS (DOFA / STAKEHOLDERS)',
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
        <li style="margin-bottom: 8px; line-height: 1.5; color: #1e293b;">
          <strong>${i.description}</strong>
          ${i.strategicAction ? `<div style="font-size: 11px; color: ${accentColor}; margin-top: 3px;">➔ <em>Acción Clave:</em> ${i.strategicAction}</div>` : ''}
        </li>`
        )
        .join('');
    };

    // 3. Filas de Partes Interesadas
    const stakeholderRows = stakeholders.length > 0
      ? stakeholders
          .map(
            (s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11.5px; color: #1e293b;">
          <td style="padding: 10px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f766e; vertical-align: top;">
            ${s.parte}
            <div style="font-size: 9.5px; font-weight: normal; color: #64748b; margin-top: 3px;">Impacto: <strong>${s.impactLevel || 'Alto'}</strong></div>
          </td>
          <td style="padding: 10px 12px; border: 1px solid #cbd5e1; vertical-align: top;">${s.necesidades}</td>
          <td style="padding: 10px 12px; border: 1px solid #cbd5e1; vertical-align: top;">${s.expectativas || 'Cumplimiento normativo y estándares de SST.'}</td>
          <td style="padding: 10px 12px; border: 1px solid #cbd5e1; vertical-align: top; color: #334155; font-weight: 600;">${s.requisito || 'ISO 45001 / Dec. 1072'}</td>
          <td style="padding: 10px 12px; border: 1px solid #cbd5e1; vertical-align: top;">${s.control || 'Monitoreo y comités'}</td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="5" style="padding: 14px; text-align: center; color: #94a3b8; border: 1px solid #cbd5e1;">No se registraron partes interesadas</td></tr>`;

    // 4. Filas de Estrategias Cruzadas
    const foList = (crossStrategies?.fo || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') || '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';
    const doList = (crossStrategies?.do || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') || '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';
    const faList = (crossStrategies?.fa || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') || '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';
    const daList = (crossStrategies?.da || []).map((e) => `<li style="margin-bottom: 6px;">${e}</li>`).join('') || '<li style="color:#94a3b8;font-style:italic;">No formuladas</li>';

    // 5. Ensamblar Cuerpo Completo del Informe
    const reportBody = `
<div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; max-width: 100%;">

  <!-- 1. OBJETO Y ALCANCE NORMATIVO -->
  <div style="margin-bottom: 24px; padding: 14px 18px; background: #f0fdfa; border-left: 4px solid #0f766e; border-radius: 0 12px 12px 0;">
    <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 13.5px; font-weight: 800; text-transform: uppercase;">
      1. Objeto y Alcance del Diagnóstico Organizacional
    </h3>
    <p style="margin: 0; font-size: 11.5px; color: #334155; line-height: 1.5;">
      El presente estudio técnico establece la comprensión integral del contexto interno y externo de <strong>${company?.companyName || 'la Organización'}</strong> conforme a los requerimientos de la norma internacional <strong>ISO 45001:2018 (Cláusulas 4.1 y 4.2)</strong>, articulados con el <strong>Decreto 1072 de 2015 (Art. 2.2.4.6.8)</strong> y los Estándares Mínimos de la <strong>Resolución 0312 de 2019 (Estándar 2.1.1)</strong>. Los factores determinados son insumo de entrada obligatorio para la planificación del SG-SST, la asignación presupuestal y la definición de objetivos estratégicos.
    </p>
  </div>

  <!-- 2. METODOLOGÍA DE RECOLECCIÓN INTEGRAL -->
  <div style="margin-bottom: 26px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 1.5px solid #0f766e; padding-bottom: 4px; margin-bottom: 10px;">
      2. Metodología de Diagnóstico y Fuentes de Información
    </h3>
    <p style="font-size: 11.5px; color: #475569; margin: 0 0 10px 0;">
      La formulación del contexto organizacional se basó en una metodología de recolección automatizada y auditoría cruzada que integró:
    </p>
    <ul style="font-size: 11.5px; color: #334155; margin: 0 0 12px 20px; padding: 0;">
      <li><strong>Caracterización Corporativa:</strong> Actividad económica (CIIU ${company?.ciiu || 'N/A'}), nivel de riesgo (${company?.riskLevel || 'N/A'}) y cobertura ocupacional (${company?.workerCount || 'N/A'} colaboradores).</li>
      <li><strong>Matriz IPEVR GTC-45:</strong> Peligros y riesgos prioritarios valorados en procesos operativos y administrativos.</li>
      <li><strong>Autoevaluación de Estándares Mínimos (Res. 0312/2019):</strong> Estado de cumplimiento legal, brechas críticas y planes de mejora en curso.</li>
      <li><strong>Gobernanza y Participación:</strong> Consulta a miembros del COPASST, Comité de Convivencia y Brigada de Emergencia.</li>
    </ul>
  </div>

  <!-- 3. MATRIZ DOFA DE SEGURIDAD Y SALUD EN EL TRABAJO -->
  <div style="margin-bottom: 28px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 1.5px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      3. Matriz DOFA de Seguridad y Salud en el Trabajo (Cláusula 4.1)
    </h3>

    <table style="width: 100%; border-collapse: separate; border-spacing: 10px; table-layout: fixed; margin-bottom: 14px;">
      <tr>
        <!-- FORTALEZAS -->
        <td style="width: 50%; vertical-align: top; background: #ffffff; border: 1.5px solid #059669; border-radius: 12px; padding: 14px; box-shadow: 0 2px 4px rgba(5,150,105,0.05);">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #059669; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">
              🛡️ Fortalezas (Factores Internos)
            </span>
            <span style="background: #ecfdf5; color: #059669; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; border: 1px solid #a7f3d0;">
              ${fortalezas.length} Factores
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11.5px;">
            ${renderList(fortalezas, '#059669', 'No se registraron fortalezas')}
          </ul>
        </td>

        <!-- OPORTUNIDADES -->
        <td style="width: 50%; vertical-align: top; background: #ffffff; border: 1.5px solid #0284c7; border-radius: 12px; padding: 14px; box-shadow: 0 2px 4px rgba(2,132,199,0.05);">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #0284c7; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">
              🚀 Oportunidades (Factores Externos)
            </span>
            <span style="background: #f0f9ff; color: #0284c7; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; border: 1px solid #bae6fd;">
              ${oportunidades.length} Factores
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11.5px;">
            ${renderList(oportunidades, '#0284c7', 'No se registraron oportunidades')}
          </ul>
        </td>
      </tr>

      <tr>
        <!-- DEBILIDADES -->
        <td style="width: 50%; vertical-align: top; background: #ffffff; border: 1.5px solid #d97706; border-radius: 12px; padding: 14px; box-shadow: 0 2px 4px rgba(217,119,6,0.05);">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #d97706; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px;">
              ⚠️ Debilidades (Factores Internos)
            </span>
            <span style="background: #fffbeb; color: #d97706; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; border: 1px solid #fde68a;">
              ${debilidades.length} Factores
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11.5px;">
            ${renderList(debilidades, '#d97706', 'No se registraron debilidades')}
          </ul>
        </td>

        <!-- AMENAZAS -->
        <td style="width: 50%; vertical-align: top; background: #ffffff; border: 1.5px solid #dc2626; border-radius: 12px; padding: 14px; box-shadow: 0 2px 4px rgba(220,38,38,0.05);">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #dc2626; padding-bottom: 6px; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px;">
              ⚡ Amenazas (Factores Externos)
            </span>
            <span style="background: #fef2f2; color: #dc2626; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; border: 1px solid #fecaca;">
              ${amenazas.length} Factores
            </span>
          </div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11.5px;">
            ${renderList(amenazas, '#dc2626', 'No se registraron amenazas')}
          </ul>
        </td>
      </tr>
    </table>
  </div>

  <!-- 4. MATRIZ DE ESTRATEGIAS CRUZADAS (FO, DO, FA, DA) -->
  <div style="margin-bottom: 28px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 1.5px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      4. Cruces Estratégicos de SST (Plan de Acción de Mejora Continua)
    </h3>
    <table style="width: 100%; border-collapse: separate; border-spacing: 10px; table-layout: fixed;">
      <tr>
        <td style="width: 50%; vertical-align: top; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #0f766e; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias FO (Fortalezas + Oportunidades)
          </h4>
          <p style="font-size: 10.5px; color: #64748b; margin: 0 0 8px 0; font-style: italic;">
            Usar las fortalezas internas para potenciar oportunidades del entorno:
          </p>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${foList}
          </ul>
        </td>

        <td style="width: 50%; vertical-align: top; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #0284c7; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias DO (Debilidades + Oportunidades)
          </h4>
          <p style="font-size: 10.5px; color: #64748b; margin: 0 0 8px 0; font-style: italic;">
            Vencer debilidades internas aprovechando las oportunidades externas:
          </p>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${doList}
          </ul>
        </td>
      </tr>

      <tr>
        <td style="width: 50%; vertical-align: top; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #d97706; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias FA (Fortalezas + Amenazas)
          </h4>
          <p style="font-size: 10.5px; color: #64748b; margin: 0 0 8px 0; font-style: italic;">
            Usar fortalezas internas para blindar a la empresa frente a amenazas externas:
          </p>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${faList}
          </ul>
        </td>

        <td style="width: 50%; vertical-align: top; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px;">
          <h4 style="margin: 0 0 6px 0; color: #dc2626; font-size: 11.5px; font-weight: 800; text-transform: uppercase;">
            Estrategias DA (Debilidades + Amenazas)
          </h4>
          <p style="font-size: 10.5px; color: #64748b; margin: 0 0 8px 0; font-style: italic;">
            Mitigar vulnerabilidades internas y evitar riesgos externos severos:
          </p>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #1e293b;">
            ${daList}
          </ul>
        </td>
      </tr>
    </table>
  </div>

  <!-- 5. MATRIZ DE PARTES INTERESADAS (CLÁUSULA 4.2) -->
  <div style="margin-bottom: 28px;">
    <h3 style="color: #0f766e; font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 1.5px solid #0f766e; padding-bottom: 4px; margin-bottom: 12px;">
      5. Matriz de Partes Interesadas y Requisitos de SST (Cláusula 4.2)
    </h3>
    <p style="font-size: 11.5px; color: #475569; margin: 0 0 10px 0;">
      A continuación se relacionan los grupos de interés pertinentes, sus necesidades vinculantes y los mecanismos de control que garantizan su satisfacción y protección integral:
    </p>

    <div style="overflow-x: auto; width: 100%;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: linear-gradient(90deg, #0f766e, #0d9488); color: #ffffff;">
            <th style="padding: 10px 12px; border: 1px solid #0f766e; width: 22%; text-align: left;">Parte Interesada</th>
            <th style="padding: 10px 12px; border: 1px solid #0f766e; width: 23%; text-align: left;">Necesidades (Obligatorias)</th>
            <th style="padding: 10px 12px; border: 1px solid #0f766e; width: 20%; text-align: left;">Expectativas</th>
            <th style="padding: 10px 12px; border: 1px solid #0f766e; width: 17%; text-align: left;">Marco Jurídico</th>
            <th style="padding: 10px 12px; border: 1px solid #0f766e; width: 18%; text-align: left;">Mecanismo de Control</th>
          </tr>
        </thead>
        <tbody>
          ${stakeholderRows}
        </tbody>
      </table>
    </div>
  </div>

  <!-- 6. GOBERNANZA Y SEGUIMIENTO -->
  <div style="margin-bottom: 30px; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
    <h3 style="margin: 0 0 6px 0; color: #0f766e; font-size: 12.5px; font-weight: 800; text-transform: uppercase;">
      6. Articulación con el Plan de Trabajo Anual y Revisión Gerencial
    </h3>
    <p style="margin: 0; font-size: 11.5px; color: #475569; line-height: 1.5;">
      El presente informe será revisado de forma ordinaria al menos una vez al año, o de manera extraordinaria ante cambios organizacionales relevantes, modificaciones de sedes o actualización de procesos productivos. Sus conclusiones son vinculantes para la formulación de los Objetivos de SST (Dec. 1072/15 Art. 2.2.4.6.17) y la auditoría de cumplimiento legal.
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
