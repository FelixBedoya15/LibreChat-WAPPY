'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const ChemicalCompatibilitySession = require('~/models/ChemicalCompatibilitySession');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS, cleanRawRows } = require('./sgsstGemini');

function toSentenceCase(str) {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

// ─── GET: Obtener matriz para una conversación ────────────────────────────────
router.get('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    logger.debug(`[ChemicalCompatibility GET] conversationId=${conversationId} | userId=${userId}`);

    const companyId = await getActiveCompanyId(userId);

    let session = await ChemicalCompatibilitySession.findOne({ conversationId, user: userId, companyId: companyId });
    
    if (!session) {
      session = await ChemicalCompatibilitySession.findOne({ conversationId });
      if (session) {
        let modified = false;
        if (!session.user) {
          session.user = userId;
          modified = true;
        }
        if (!session.companyId && companyId) {
          session.companyId = companyId;
          modified = true;
        }
        if (modified) {
          await session.save();
          logger.info(`[ChemicalCompatibility GET] Adopted user/companyId for session ${conversationId}`);
        }
      }
    }

    // Fallback: buscar sesión temporal si es nueva conversación
    if (!session && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const { Conversation } = require('~/db/models');
      const convo = await Conversation.findOne({ conversationId }, 'createdAt').lean();
      const isNewConvo = convo && convo.createdAt && (Date.now() - new Date(convo.createdAt).getTime() < 120000);

      if (isNewConvo) {
        const tempId = `temp-${userId}`;
        const tempSession = await ChemicalCompatibilitySession.findOne({ conversationId: tempId, user: userId });
        if (tempSession) {
          tempSession.conversationId = conversationId;
          tempSession.companyId = companyId;
          await tempSession.save();
          session = tempSession;
          logger.info(`[ChemicalCompatibility GET] Migrated temporal session for user ${userId} to ${conversationId}`);
        }
      }
    }

    if (!session) {
      return res.json({ matrixRows: [], chartConclusions: {} });
    }

    res.json({ matrixRows: session.matrixRows, chartConclusions: session.chartConclusions || {} });
  } catch (error) {
    logger.error('[ChemicalCompatibility] Error fetching matrix:', error);
    res.status(500).json({ error: 'Failed to fetch chemical matrix' });
  }
});

// ─── PUT: Guardar/actualizar la matriz ──────────────────────────────────────────
router.put('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { matrixRows } = req.body;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    const normalizedRows = (matrixRows || []).map(row => ({
      ...row,
      nombre: toSentenceCase(row.nombre),
      ubicacion: toSentenceCase(row.ubicacion)
    }));

    let session = await ChemicalCompatibilitySession.findOneAndUpdate(
      { conversationId, companyId: companyId },
      {
        $set: { matrixRows: normalizedRows, companyId },
        $setOnInsert: { user: userId },
      },
      { upsert: true, new: true },
    );

    if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const tempId = `temp-${userId}`;
      await ChemicalCompatibilitySession.deleteOne({ conversationId: tempId, user: userId });
      logger.info(`[ChemicalCompatibility PUT] Cleaned up temporal session for user ${userId}`);
    }

    res.json({ success: true, matrixRows: session.matrixRows });
  } catch (error) {
    logger.error('[ChemicalCompatibility] Error updating matrix:', error);
    res.status(500).json({ error: 'Failed to update chemical matrix' });
  }
});

// ─── IA: Analizar o completar una fila individual con IA ─────────────────────────
router.post('/ai-update-row', requireJwtAuth, async (req, res) => {
  try {
    const { row } = req.body;
    const userId = req.user?.id;

    if (!row || !row.nombre) {
      return res.status(400).json({ error: 'Se requiere un objeto row con el campo "nombre".' });
    }

    const prompt = `Eres un Higienista Industrial certificado y experto en Seguridad Química en Colombia (Decreto 1496 de 2018 y SGA).
Analiza este producto químico y sugiere sus propiedades y medidas de almacenamiento seguro.

DATOS DEL PRODUCTO:
Nombre del producto: ${row.nombre}
Clase de Peligro ONU actual: ${row.clasificacion_onu || 'No especificada'}
Estado Físico actual: ${row.estado_fisico || 'No especificado'}
Pictogramas SGA actuales: ${(row.pictogramas_sga || []).join(', ') || 'No especificados'}
Cantidad almacenada: ${row.cantidad_almacenada || 'No especificada'}
Ubicación actual: ${row.ubicacion || 'No especificada'}
Tiene FDS: ${row.tiene_fds || 'No especificado'}
Tiene Rotulado: ${row.tiene_rotulo || 'No especificado'}

TU TAREA:
1. Determina el Estado Físico correcto ("Líquido", "Sólido", o "Gas") si está vacío o no es claro.
2. Identifica la Clase de Peligro ONU más adecuada (debe ser una de: "Clase 1: Explosivos", "Clase 2.1: Gases Inflamables", "Clase 2.2: Gases No Inflamables ni Tóxicos", "Clase 2.3: Gases Tóxicos", "Clase 3: Líquidos Inflamables", "Clase 4.1: Sólidos Inflamables", "Clase 4.2: Sustancias de Combustión Espontánea", "Clase 4.3: Desprenden gases inflamables con agua", "Clase 5.1: Sustancias Comburentes", "Clase 5.2: Peróxidos Orgánicos", "Clase 6.1: Sustancias Tóxicas", "Clase 8: Sustancias Corrosivas", "Clase 9: Peligros Varios", "No Peligroso").
3. Selecciona los pictogramas SGA correctos (pueden ser múltiples de: "inflamable", "corrosivo", "calavera", "peligro_salud", "signo_exclamacion", "medio_ambiente", "comburente", "explosivo", "gas_comprimido").
4. Genera las incompatibilidades químicas específicas más importantes (ej. "Reacciona violentamente con agua, ácidos fuertes o materiales inflamables").
5. Propón requisitos de almacenamiento detallados y técnicos (ej. "Gabinetes resistentes a la corrosión, diques de contención de derrames, ventilación forzada a nivel de piso").

REGLAS DE FORMATO:
Responde ÚNICAMENTE con un objeto JSON válido (sin formato markdown ni código \`\`\`) que contenga exactamente estas propiedades:
{
  "estado_fisico": "<Líquido|Sólido|Gas>",
  "clasificacion_onu": "<Clase ONU sugerida>",
  "pictogramas_sga": [<arreglo de pictogramas en minúscula>],
  "incompatibilidades": "<texto detallado de incompatibilidades>",
  "requisitos_almacenamiento": "<texto detallado de almacenamiento seguro y controles>"
}`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    let text = result.response.text().trim();

    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let updatedFields;
    try {
      updatedFields = JSON.parse(text);
    } catch (parseErr) {
      logger.error('[ChemicalCompatibility/ai-update-row] JSON parse error:', parseErr.message, 'Raw:', text.slice(0, 500));
      return res.status(500).json({ error: 'La IA devolvió un formato JSON inválido. Intenta de nuevo.' });
    }

    // Mantener campos informativos del usuario
    updatedFields.nombre = row.nombre;
    updatedFields.fabricante = row.fabricante || '';
    updatedFields.cantidad_almacenada = row.cantidad_almacenada || '';
    updatedFields.ubicacion = row.ubicacion || '';
    updatedFields.tiene_fds = row.tiene_fds || 'Sí';
    updatedFields.tiene_rotulo = row.tiene_rotulo || 'Sí';

    return res.json({ updatedFields });
  } catch (error) {
    logger.error('[ChemicalCompatibility/ai-update-row] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── HELPER: Generar HTML de analítica e incompatibilidades ───────────────────────
function getCompatibilityStatus(classA, classB) {
  // Simplificación de matriz técnica de compatibilidad (basada en NTC 3966)
  if (!classA || !classB || classA === 'No Peligroso' || classB === 'No Peligroso') return 'compatible';
  
  const cA = classA.split(':')[0].trim();
  const cB = classB.split(':')[0].trim();

  if (cA === cB) {
    if (cA === 'Clase 1' || cA === 'Clase 7') return 'incompatible'; // Explosivos/Radiactivos siempre segregar
    if (cA === 'Clase 8') return 'caution'; // Ácidos y bases corrosivos deben separarse
    return 'compatible';
  }

  // Explosivos y Radiactivos incompatibles con todo
  if (cA === 'Clase 1' || cB === 'Clase 1' || cA === 'Clase 7' || cB === 'Clase 7') return 'incompatible';

  // Inflamables (Clase 3) vs Comburentes (Clase 5.1/5.2) -> Incompatible
  if ((cA === 'Clase 3' && (cB === 'Clase 5.1' || cB === 'Clase 5.2')) ||
      (cB === 'Clase 3' && (cA === 'Clase 5.1' || cA === 'Clase 5.2'))) {
    return 'incompatible';
  }

  // Corrosivos (Clase 8) vs Inflamables (Clase 3) -> Incompatible
  if ((cA === 'Clase 8' && cB === 'Clase 3') || (cB === 'Clase 8' && cA === 'Clase 3')) {
    return 'incompatible';
  }

  // Corrosivos (Clase 8) vs Comburentes (Clase 5.1/5.2) -> Incompatible
  if ((cA === 'Clase 8' && (cB === 'Clase 5.1' || cB === 'Clase 5.2')) ||
      (cB === 'Clase 8' && (cA === 'Clase 5.1' || cA === 'Clase 5.2'))) {
    return 'incompatible';
  }

  // Desprenden gases con agua (Clase 4.3) vs Líquidos o ácidos -> Incompatible
  if (cA === 'Clase 4.3' || cB === 'Clase 4.3') {
    if (cA === 'Clase 3' || cB === 'Clase 3' || cA === 'Clase 8' || cB === 'Clase 8') {
      return 'incompatible';
    }
  }

  // Casos genéricos de precaución (Amarillo)
  const cautionClasses = ['Clase 6.1', 'Clase 9', 'Clase 2.2'];
  if (cautionClasses.includes(cA) || cautionClasses.includes(cB)) {
    return 'caution';
  }

  return 'caution'; // Por defecto precaución
}

function buildChemicalChartsHtml(matrixRows) {
  if (!matrixRows || matrixRows.length === 0) return '';

  // 1. Conteo de Clases ONU
  const classCounts = {};
  matrixRows.forEach(r => {
    const k = r.clasificacion_onu || 'No Peligroso';
    classCounts[k] = (classCounts[k] || 0) + 1;
  });
  const chartClasses = Object.entries(classCounts).map(([name, val]) => ({ name, val })).sort((a,b) => b.val - a.val);
  const maxClass = Math.max(...chartClasses.map(d => d.val), 1);

  // 2. Conteo de FDS y Rotulado
  let fdsCount = 0;
  let labelCount = 0;
  matrixRows.forEach(r => {
    if (String(r.tiene_fds).toLowerCase() === 'sí') fdsCount++;
    if (String(r.tiene_rotulo).toLowerCase() === 'sí') labelCount++;
  });
  const total = matrixRows.length || 1;
  const pctFDS = Math.round((fdsCount / total) * 100);
  const pctLabel = Math.round((labelCount / total) * 100);

  // 3. Parejas Incompatibles detectadas
  const incompatiblePairs = [];
  for (let i = 0; i < matrixRows.length; i++) {
    for (let j = i + 1; j < matrixRows.length; j++) {
      const pA = matrixRows[i];
      const pB = matrixRows[j];
      const status = getCompatibilityStatus(pA.clasificacion_onu, pB.clasificacion_onu);
      if (status === 'incompatible') {
        incompatiblePairs.push({
          prodA: pA.nombre,
          classA: pA.clasificacion_onu?.split(':')[0] || 'Desconocido',
          prodB: pB.nombre,
          classB: pB.clasificacion_onu?.split(':')[0] || 'Desconocido',
          ubicacionA: pA.ubicacion || 'N/A',
          ubicacionB: pB.ubicacion || 'N/A'
        });
      }
    }
  }

  function renderBar(label, value, max, color) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return `
      <div style="display:flex; align-items:center; margin-bottom:8px;">
        <div style="width:180px; font-size:11px; color:#475569; font-weight:600; text-align:right; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${label}">${label}</div>
        <div style="flex:1; background-color:#f1f5f9; border-radius:10px; height:16px; position:relative; overflow:hidden;">
          <div style="background-color:${color}; width:${Math.max(5, pct)}%; height:100%; border-radius:10px; display:flex; align-items:center; justify-content:flex-end; padding-right:8px; color:white; font-size:10px; font-weight:bold;">
            ${value}
          </div>
        </div>
      </div>
    `;
  }

  let html = `
    <div style="margin: 25px 0; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #f8fafc; page-break-inside: avoid;">
      <h3 style="color:#0f766e; font-size:16px; margin-top:0; border-bottom:2px solid #0f766e; padding-bottom:8px; margin-bottom:20px; text-transform:uppercase;">
          ANALÍTICA DE COMPATIBILIDAD Y RIESGO QUÍMICO
      </h3>
      <div style="display:flex; flex-direction:column; gap:20px;">
        
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Inventario por Clase ONU</h4>
          ${chartClasses.map(d => renderBar(d.name, d.val, maxClass, '#0ea5e9')).join('')}
        </div>

        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Conformidad Legal (SGA)</h4>
          ${renderBar('Fichas FDS 16 Secciones', fdsCount, total, '#10b981')}
          <div style="font-size:9px; color:#64748b; text-align:right; margin-bottom:10px;">Cumplimiento: ${pctFDS}% de productos</div>
          ${renderBar('Rotulado con Pictogramas SGA', labelCount, total, '#8b5cf6')}
          <div style="font-size:9px; color:#64748b; text-align:right; margin-bottom:5px;">Cumplimiento: ${pctLabel}% de productos</div>
        </div>

        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#dc2626; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #fde8e8; padding-bottom:5px;">Puntos Críticos de Incompatibilidad Detectados (${incompatiblePairs.length})</h4>
          ${incompatiblePairs.length === 0 
            ? '<p style="font-size:11px; color:#22c55e; font-style:italic; font-weight:600; text-align:center; padding:10px 0;">¡Excelente! No se detectaron cruces de almacenamiento incompatibles basados en la clase de peligro.</p>' 
            : incompatiblePairs.map(p => `
              <div style="display:flex; flex-direction:column; background:#fff5f5; border:1px solid #fee2e2; padding:8px 12px; border-radius:8px; margin-bottom:8px; border-left: 4px solid #ef4444;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;">
                  <strong style="color:#ef4444;">Incompatibilidad Crítica</strong>
                </div>
                <div style="font-size:12px; color:#334155; margin-top:4px;">
                  El producto <strong>${p.prodA}</strong> (${p.classA}) y el producto <strong>${p.prodB}</strong> (${p.classB}) no pueden ser almacenados juntos.
                </div>
                <div style="font-size:10px; color:#64748b; margin-top:4px; display:flex; gap:10px;">
                  <span>Ubicación A: ${p.ubicacionA}</span>
                  <span>Ubicación B: ${p.ubicacionB}</span>
                </div>
              </div>
            `).join('')
          }
        </div>

      </div>
    </div>
  `;
  return html;
}

// ─── IA: Analizar toda la matriz y generar reporte Canvas ────────────────────────
router.post('/ai-analyze-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { matrixRows, instruction } = req.body;
    const userId = req.user?.id;

    if (!matrixRows || !matrixRows.length) {
      return res.status(400).json({ error: 'El inventario químico está vacío.' });
    }

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: userId }).lean();
    } catch (e) {
      logger.warn('[ChemicalCompatibility] Could not load CompanyInfo', e);
    }

    const currentDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const headerHTML = buildStandardHeader({
      title: 'AUDITORÍA TÉCNICA Y MATRIZ DE COMPATIBILIDAD QUÍMICA',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Decreto 1496 de 2018 / SGA / NTC 3966',
      responsibleName: req.user?.name,
    });

    const inventorySummary = matrixRows.map((r, i) =>
      `[${i+1}] Producto: ${r.nombre} | Clase ONU: ${r.clasificacion_onu} | Estado: ${r.estado_fisico} | Ubicación: ${r.ubicacion} | Cantidad: ${r.cantidad_almacenada} | FDS: ${r.tiene_fds} | Rotulado SGA: ${r.tiene_rotulo} | Incompatibilidades: ${r.incompatibilidades || 'N/A'}`
    ).join('\n');

    const prompt = `Eres un auditor e Inspector de Seguridad y Salud en el Trabajo experto en Riesgo Químico y en la normatividad colombiana (Decreto 1496 de 2018, SGA y NTC 3966).
Analiza este inventario de productos químicos de la empresa y genera un Informe de Auditoría de Almacenamiento y Matriz de Compatibilidad sumamente detallado, técnico y extenso.

**INSTRUCCIONES DE FORMATO HTML:**
- Responde EXCLUSIVAMENTE en HTML limpio, listo para inyectarse en el DOM. NO uses \`\`\`html.
- Estructura las tablas con estilo premium:
  <table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
- Headers de tablas (<th>): <th style="background-color:#0f766e;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">
- Celdas (<td>): <td style="padding:10px 14px;border-bottom:1px solid #f0fdfa;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">
- Headers de sección (H3): <h3 style="color:#0f766e; margin-top:30px; border-bottom:1px solid #ccc; padding-bottom:5px;">

**ESTRUCTURA DEL INFORME EXIGIDA (en HTML):**
1. **Introducción y Objetivos:** Resumen legal y propósito técnico de la auditoría en base al Decreto 1496 de 2018.
2. **Evaluación de Cumplimiento Legal (FDS y Rotulado):** Diagnóstico de los productos que carecen de FDS de 16 secciones o etiquetado SGA. Argumenta el riesgo sancionatorio.
3. **Análisis Crítico de Incompatibilidades en Almacenamiento:** Señala las sustancias químicas incompatibles que representan un riesgo crítico de reacción térmica, incendio o liberación de vapores tóxicos si se almacenan juntas.
4. **Plan de Acción y Reorganización de Almacenes (Tabla):** Genera una tabla detallada con 4 columnas: [Producto Químico, Peligro Principal, Medida de Separación/Segregación Recomendada (NTC 3966), Tipo de Control (Ingeniería/Administrativo)].
5. **Procedimiento de Emergencia y Control de Derrames:** Escribe un protocolo robusto ante derrames de sustancias incompatibles.
6. **Conclusión y Recomendaciones de Mejora Continua:** Consejos organizacionales para auditorías de riesgo químico.

**DATOS DEL INVENTARIO QUÍMICO:**
${inventorySummary}

**INSTRUCCIÓN ADICIONAL:**
${instruction || 'Generar informe técnico estructurado de almacenamiento seguro.'}`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const analysisRaw = result.response.text();
    const htmlBody = analysisRaw.replace(/```html\n ?/g, '').replace(/```\n?/g, '').trim();

    const chartsHTML = buildChemicalChartsHtml(matrixRows);

    let fullReport = headerHTML + chartsHTML + '<div style="margin-top:20px;">' + htmlBody + '</div>';
    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    logger.info(`[ChemicalCompatibility/ai-analyze-matrix] Generated HTML analysis, ${matrixRows.length} rows`);
    return res.json({ analysis: fullReport });
  } catch (error) {
    logger.error('[ChemicalCompatibility/ai-analyze-matrix] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── IA: Generar conclusión de gráfico del dashboard ──────────────────────────────
router.post('/ai-chart-conclusion', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId, chartType, matrixRows, chartStats } = req.body;
    const userId = req.user?.id;

    if (!conversationId || !chartType) {
      return res.status(400).json({ error: 'conversationId y chartType son requeridos.' });
    }

    const chartDescriptions = {
      clases_onu: 'distribución de productos químicos por Clase de Peligro ONU',
      pictogramas: 'frecuencia de pictogramas de seguridad SGA en el inventario',
      cumplimiento: 'conformidad de fichas de seguridad FDS y rotulado de recipientes',
      riesgo_compatibilidad: 'análisis del semáforo de compatibilidad de almacenamiento',
    };

    const inventorySummary = (matrixRows || []).map((r, i) =>
      `${r.nombre} | Clase ONU: ${r.clasificacion_onu} | FDS: ${r.tiene_fds} | Rotulado: ${r.tiene_rotulo}`
    ).join('\n').slice(0, 3000);

    const prompt = `Eres un Higienista Industrial experto en Seguridad y Salud en el Trabajo.
Con base en los siguientes datos del gráfico de "${chartDescriptions[chartType] || chartType}" de una matriz de compatibilidad química:

ESTADÍSTICAS DEL GRÁFICO:
${JSON.stringify(chartStats || {}, null, 2)}

RESUMEN DEL INVENTARIO QUÍMICO:
${inventorySummary}

Redacta una conclusión técnica profesional de 3 a 5 oraciones que:
1. Resuma el hallazgo crítico de este gráfico.
2. Identifique la principal brecha de seguridad química detectada.
3. Proponga 1 acción correctiva concreta basada en el SGA y normas colombianas.

Escribe en español técnico, sin viñetas, como párrafo fluido y conciso.`;

    const modelName = SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const conclusion = result.response.text().trim();

    await ChemicalCompatibilitySession.findOneAndUpdate(
      { conversationId },
      { $set: { [`chartConclusions.${chartType}`]: conclusion } },
      { upsert: true, new: true }
    );

    logger.info(`[ChemicalCompatibility/ai-chart-conclusion] Conclusion saved for chart '${chartType}', conv=${conversationId}`);
    return res.json({ conclusion });
  } catch (error) {
    logger.error('[ChemicalCompatibility/ai-chart-conclusion] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── IA: Parsear e importar filas de matriz química externa ──────────────────────────
router.post('/ai-parse-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { rawRows } = req.body;
    const userId = req.user?.id;

    if (!rawRows || !Array.isArray(rawRows)) {
      return res.status(400).json({ error: 'Se requiere una lista de filas en "rawRows".' });
    }

    if (rawRows.length === 0) {
      return res.json({ matrixRows: [] });
    }

    const cleanedRows = cleanRawRows(rawRows);

    const CHUNK_SIZE = 35;
    const chunks = [];
    for (let i = 0; i < cleanedRows.length; i += CHUNK_SIZE) {
      chunks.push(cleanedRows.slice(i, i + CHUNK_SIZE));
    }

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    logger.info(`[ChemicalCompatibility/ai-parse-matrix] Processing ${cleanedRows.length} rows for user ${userId} in ${chunks.length} chunks`);

    const parsedRows = [];

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunk = chunks[chunkIdx];
      if (chunkIdx > 0) {
        // Pausa de 500ms para evitar saturación de tasa (concurrencia) en el API de Gemini
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      logger.info(`[ChemicalCompatibility/ai-parse-matrix] Processing chunk ${chunkIdx + 1}/${chunks.length} for user ${userId}`);

      const prompt = `Eres un procesador de datos experto en Higiene y Seguridad Química.
Mapea estas filas crudas (extraídas de un Excel) a un formato estándar de inventario químico SGA de acuerdo a la normatividad en Colombia.

FILAS CRUDAS:
${JSON.stringify(chunk, null, 2)}

FORMATO EXIGIDO PARA CADA ITEM EN EL ARREGLO JSON:
{
  "nombre": "<Nombre del producto químico, ej. Ácido Clorhídrico>",
  "fabricante": "<Fabricante/Proveedor o 'Desconocido'>",
  "estado_fisico": "<Líquido|Sólido|Gas>",
  "clasificacion_onu": "<Clase 1: Explosivos|Clase 2.1: Gases Inflamables|Clase 2.2: Gases No Inflamables ni Tóxicos|Clase 2.3: Gases Tóxicos|Clase 3: Líquidos Inflamables|Clase 4.1: Sólidos Inflamables|Clase 4.2: Sustancias de Combustión Espontánea|Clase 4.3: Desprenden gases inflamables con agua|Clase 5.1: Sustancias Comburentes|Clase 5.2: Peróxidos Orgánicos|Clase 6.1: Sustancias Tóxicas|Clase 8: Sustancias Corrosivas|Clase 9: Peligros Varios|No Peligroso>",
  "pictogramas_sga": [<arreglo conteniendo valores como: "inflamable", "corrosivo", "calavera", "peligro_salud", "signo_exclamacion", "medio_ambiente", "comburente", "explosivo", "gas_comprimido">],
  "cantidad_almacenada": "<Cantidad, ej. 50 Galones o N/A>",
  "ubicacion": "<Ubicación de almacenamiento, ej. Bodega Central o N/A>",
  "tiene_fds": "<Sí|No>",
  "tiene_rotulo": "<Sí|No>",
  "incompatibilidades": "<Principales incompatibilidades o reactividad>",
  "requisitos_almacenamiento": "<Requisitos de almacenamiento seguro>"
}

REGLAS EXTREMAS:
- Responde ÚNICAMENTE con un arreglo JSON válido conteniendo los objetos mapeados. NO incluyas markdown, código ni explicaciones.
- Si no encuentras un valor para algún campo, estima un valor adecuado según el nombre del producto o usa valores por defecto razonables en lugar de dejarlos vacíos.`;

      const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
      let text = result.response.text().trim();
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      try {
        const rows = JSON.parse(text);
        if (Array.isArray(rows)) {
          parsedRows.push(...rows);
        }
      } catch (err) {
        logger.error('[ChemicalCompatibility/ai-parse-matrix] Chunk parse error:', err.message);
      }
    }

    // Agregar IDs únicos a los productos importados
    const finalizedRows = parsedRows.map(row => ({
      ...row,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      nombre: toSentenceCase(row.nombre),
      ubicacion: toSentenceCase(row.ubicacion)
    }));

    return res.json({ matrixRows: finalizedRows });
  } catch (error) {
    logger.error('[ChemicalCompatibility/ai-parse-matrix] Critical parser error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
