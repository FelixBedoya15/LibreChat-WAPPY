const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const mongoose = require('mongoose');
const CompanyInfo = require('../../../models/CompanyInfo');
const SgsstWorker = require('../../../models/SgsstWorker');
const SgsstChemicalData = require('../../../models/SgsstChemicalData');
const { logger } = require('~/config');
const { generateWithKeyRotation } = require('./sgsstGemini');
const { buildStandardHeader } = require('./reportHeader');

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

// ─── GET /data — Obtener inventario de productos químicos ───────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }
    // Como los productos químicos se consolidan por empresa, buscamos el doc de la empresa
    let doc = await SgsstChemicalData.findOne({ user: req.user.id, companyId });
    if (!doc) {
      doc = await SgsstChemicalData.create({
        user: req.user.id,
        companyId,
        productos: []
      });
    }
    res.json(doc.productos || []);
  } catch (error) {
    logger.error('[SGSST Chemicals] Load error:', error);
    res.status(500).json({ error: 'Error al cargar productos químicos' });
  }
});

// ─── POST /save — Registrar/Actualizar productos químicos ────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { productos } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const updatedDoc = await SgsstChemicalData.findOneAndUpdate(
      { user: req.user.id, companyId },
      {
        $set: {
          productos: productos || [],
          updatedAt: Date.now()
        }
      },
      { upsert: true, new: true }
    );

    // Sincronizar todos los productos con los trabajadores expuestos
    await syncChemicalsWithIpevar(req.user.id, companyId, updatedDoc.productos || []);

    res.json({ success: true, data: updatedDoc.productos || [] });
  } catch (error) {
    logger.error('[SGSST Chemicals] Save error:', error);
    res.status(500).json({ error: 'Error al guardar productos químicos' });
  }
});

// ─── POST /sync-manual — Sincronizar manualmente con IPEVAR ─────────────────
router.post('/sync-manual', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    const doc = await SgsstChemicalData.findOne({ user: req.user.id, companyId });
    if (!doc) {
      return res.status(404).json({ error: 'No se encontraron productos químicos' });
    }

    await syncChemicalsWithIpevar(req.user.id, companyId, doc.productos || []);
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Chemicals] Manual sync error:', error);
    res.status(500).json({ error: 'Error en sincronización manual' });
  }
});

// ─── Lógica de Sincronización Químicos -> IPEVAR ─────────────────────────────
async function syncChemicalsWithIpevar(userId, companyId, productosList) {
  try {
    // 1. Mapear de manera inversa: qué trabajadores están expuestos a qué productos químicos
    // Y determinar si el trabajador está expuesto a un químico no conforme (sin FDS o sin Rótulo)
    const workerStatusMap = {};

    productosList.forEach(prod => {
      const isProductNonConformant = prod.tieneFds === 'No' || prod.tieneRotuloSga === 'No';
      (prod.trabajadoresExpuestos || []).forEach(workerId => {
        if (!workerStatusMap[workerId]) {
          workerStatusMap[workerId] = {
            hasNonConformant: false,
            nonConformantNames: []
          };
        }
        if (isProductNonConformant) {
          workerStatusMap[workerId].hasNonConformant = true;
          workerStatusMap[workerId].nonConformantNames.push(prod.nombre);
        }
      });
    });

    // 2. Buscar todos los SgsstWorkers expuestos a químicos para modular sus riesgos
    const exposedWorkerIds = Object.keys(workerStatusMap);
    
    // Obtener todos los trabajadores de la empresa
    const workers = await SgsstWorker.find({ user: userId, companyId });

    for (const worker of workers) {
      const workerId = worker.perfilId;
      const newAlertsSet = new Set(worker.fitAlerts || []);
      const alertLabel = 'Exposición a Químico Sin FDS/Rótulo';

      const status = workerStatusMap[workerId];
      const isExposedNonConformant = status ? status.hasNonConformant : false;

      if (isExposedNonConformant) {
        newAlertsSet.add(alertLabel);
      } else {
        newAlertsSet.delete(alertLabel);
      }

      // Recorrer los riesgos bio-individuales para buscar relacionados con disolventes/químicos
      const updatedRiesgos = (worker.riesgosBioIndividual || []).map(risk => {
        const isChemicalRisk = (risk.controles_individuo && /químico|quimico|solvente|sustancia|vapor|gases|humos/i.test(risk.controles_individuo)) ||
                              (risk.dimension_bio && /químico|quimico|solvente|sustancia|vapor|gases|humos/i.test(risk.dimension_bio));
        
        if (isChemicalRisk) {
          if (isExposedNonConformant) {
            const chemicalNames = (status.nonConformantNames || []).slice(0, 2).join(', ');
            return {
              ...risk,
              plan_accion_bio: `❌ ALERTA QUÍMICOS: Exposición a disolvente/producto químico (${chemicalNames}) sin Ficha de Seguridad (FDS) o Rótulo SGA.`,
              nivel_susceptibilidad: Math.min(5, (risk.nivel_susceptibilidad || 1) + 1)
            };
          } else {
            return {
              ...risk,
              plan_accion_bio: '✅ QUÍMICOS: FDS y rotulado de sustancias químicas manipuladas verificado y conforme.',
              nivel_susceptibilidad: Math.max(1, (risk.nivel_susceptibilidad || 2) - 1)
            };
          }
        }
        return risk;
      });

      // Actualizar worker en la DB
      await SgsstWorker.updateOne(
        { _id: worker._id },
        {
          $set: {
            fitAlerts: Array.from(newAlertsSet),
            riesgosBioIndividual: updatedRiesgos,
            updatedAt: Date.now()
          }
        }
      );
    }

    logger.info(`[SGSST Chemicals Sync] Sincronización exitosa. Trabajadores expuestos actualizados: ${exposedWorkerIds.length}`);
  } catch (err) {
    logger.error('[SGSST Chemicals Sync] Error syncing chemicals with IPEVAR:', err.message);
  }
}

// ─── POST /generate ───────────────────────────────────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
  try {
    const { selectedProduct, chemicals, modelName } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró empresa activa' });
    }

    const personalization = req.user?.personalization?.geminiModels;
    const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();
    const finalModelName = modelName || preferredModel;

    let loadedCompanyInfo = null;
    try {
      loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
    } catch (e) {
      logger.warn('Failed to load company info for Chemicals');
    }

    const currentDate = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const isSingleProduct = !!selectedProduct;
    const reportTitle = isSingleProduct 
      ? `FICHA DE SEGURIDAD Y COMPATIBILIDAD - ${selectedProduct.nombre.toUpperCase()}`
      : 'INFORME DE COMPATIBILIDAD Y AUDITORÍA DE PRODUCTOS QUÍMICOS';

    const headerHTML = buildStandardHeader({
      title: reportTitle,
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Decreto 1496 de 2018 (SGA en Colombia) / Resolución 0312 de 2019',
      responsibleName: req.user?.name,
    });

    let promptText = '';

    if (isSingleProduct) {
      const p = selectedProduct;
      const pictosStr = (p.pictogramasSga || []).join(', ') || 'Ninguno';
      const incompatStr = (p.incompatibilidades || []).join(', ') || 'Ninguna registrada';

      promptText = `
${headerHTML}
Eres un Experto Técnico Senior en Higiene Industrial, Sustancias Químicas y Seguridad y Salud en el Trabajo (SST), especializado en el Sistema Globalmente Armonizado (SGA / GHS) y la normativa del Decreto 1496 de 2018 en Colombia.
Tu objetivo es redactar una **FICHA TÉCNICA DE SEGURIDAD Y ANÁLISIS DE RIESGO DE PRODUCTO QUÍMICO** exhaustiva y profesional.

**DATOS DEL PRODUCTO SELECCIONADO:**
- Nombre Comercial: ${p.nombre}
- Fabricante / Proveedor: ${p.fabricante || 'N/A'}
- Estado Físico: ${p.estadoFisico || 'Líquido'}
- Ubicación / Almacenamiento: ${p.ubicacion || 'No especificado'}
- Cantidad Almacenada: ${p.cantidadAlmacenada || 'N/A'}
- Clasificación ONU (Clase de Peligro): ${p.claseOnu || 'N/A'}
- Pictogramas SGA Aplicables: ${pictosStr}
- Dispone de Ficha de Datos de Seguridad (FDS): ${p.tieneFds}
- Dispone de Rotulado SGA en envase: ${p.tieneRotuloSga}
- Requisitos de Almacenamiento Indicados: ${p.requisitosAlmacenamiento || 'No especificado'}
- Incompatibilidades Químicas Conocidas: ${incompatStr}

**INSTRUCCIONES DE REDACCIÓN:**
1. Genera una Ficha de Seguridad Técnica en formato HTML que continúe después del encabezado anterior.
2. Usa tablas HTML estructuradas y estilos CSS inline discretos y modernos (sin repetir etiquetas HTML o HEAD, solo estructura de cuerpo o contenedores div y table).
3. Incluye las siguientes secciones obligatorias:
   - **Identificación de Peligros (SGA/GHS)**: Explicación de cada uno de los pictogramas indicados y la clase de peligro ONU.
   - **Medidas de Almacenamiento Seguro e Incompatibilidades**: Análisis detallado de las reglas de segregación y almacenamiento de acuerdo con las incompatibilidades indicadas.
   - **Control de Exposición y Protección Personal**: Medidas de control técnico e individual (EPPs recomendados como respiradores, guantes, gafas de seguridad) para los operarios expuestos.
4. NUNCA inventes productos, fabricantes, seriales o datos que no estén listados.
`;
    } else {
      const inventoryStr = (chemicals || []).map(p => 
        `- Producto: ${p.nombre} | Fabricante: ${p.fabricante || 'N/A'} | Ubicación: ${p.ubicacion || 'N/A'} | Cantidad: ${p.cantidadAlmacenada || 'N/A'} | FDS: ${p.tieneFds} | Rotulado SGA: ${p.tieneRotuloSga} | Pictogramas: ${(p.pictogramasSga || []).join(', ') || 'Ninguno'}`
      ).join('\n') || '[Sin productos químicos registrados en el inventario]';

      promptText = `
${headerHTML}
Eres un Experto Técnico Senior en Higiene Industrial, Sustancias Químicas y Seguridad y Salud en el Trabajo (SST), especializado en el Sistema Globalmente Armonizado (SGA / GHS) y la normativa del Decreto 1496 de 2018 en Colombia.
Tu objetivo es redactar un **INFORME DE COMPATIBILIDAD Y AUDITORÍA DE ALMACENAMIENTO DE SUSTANCIAS QUÍMICAS** consolidado para toda la organización.

**INVENTARIO DE SUSTANCIAS QUÍMICAS REGISTRADAS:**
${inventoryStr}

**INSTRUCCIONES DE REDACCIÓN:**
1. Genera un Informe Técnico de Auditoría Química en formato HTML que continúe después del encabezado anterior.
2. Usa tablas HTML estructuradas y estilos CSS inline modernos y profesionales (sin repetir etiquetas HTML o HEAD, solo estructura de cuerpo o contenedores div y table).
3. Incluye las siguientes secciones:
   - **Resumen del Inventario Químico**: Resumen analítico de las sustancias químicas almacenadas, cantidad y nivel de riesgo.
   - **Análisis de Cumplimiento Documental**: Evaluación cuantitativa de FDS y Rotulado SGA (porcentaje de cumplimiento, brechas de seguridad).
   - **Matriz de Compatibilidad de Almacenamiento**: Recomendaciones de segregación química basadas en las propiedades incompatibles.
   - **Plan de Acción y Controles de Ingeniería**: Recomendaciones sobre duchas lavaojos, ventilación, kit contra derrames y EPPs.
4. NUNCA inventes productos, ubicaciones o datos que no estén listados en el inventario aportado.
`;
    }

    const result = await generateWithKeyRotation(finalModelName, req.user.id, promptText);
    res.json({ report: result.response.text() });
  } catch (error) {
    logger.error('[SGSST Chemicals Generate] Error:', error);
    res.status(500).json({ error: error.message || 'Error al generar informe químico' });
  }
});

module.exports = router;
