const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');
const ChemicalCompatibilitySession = require('~/models/ChemicalCompatibilitySession');
const CompanyInfo = require('~/models/CompanyInfo');

function toSentenceCase(str) {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

class MatrizCompatibilidad extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'matriz_compatibilidad';
    this.description =
      'Lee, añade, evalúa, enriquece con PubChem NIH GHS o actualiza inventarios de productos químicos en la Matriz de Compatibilidad Química SGA (Decreto 1496 de 2018, Res. 773 de 2021, NTC 3966). Usa esta herramienta para leer, documentar, enriquecer con PubChem o eliminar productos químicos.';
    this.req = fields.req;
    this.schema = z.object({
      accion: z
        .enum(['leer', 'escribir', 'borrar', 'consultar_contexto_sgsst', 'enriquecer_pubchem'])
        .describe(
          'Usa consultar_contexto_sgsst para contexto 360° de la empresa, leer para consultar inventario, escribir para guardar productos (auto-enriquecidos con PubChem), enriquecer_pubchem para verificar todo el inventario en PubChem NIH GHS, o borrar para eliminar.',
        ),
      filtro_nombre: z.string().optional().describe('Filtro por nombre del producto para leer.'),
      filtro_ubicacion: z.string().optional().describe('Filtro por ubicación para leer.'),
      filtro_clase: z.string().optional().describe('Filtro por Clase ONU para leer.'),
      ids_a_borrar: z.array(z.string()).optional().describe('Arreglo de IDs de los productos químicos que deseas eliminar (solamente cuando accion="borrar").'),
      productos: z.array(z.object({
        nombre: z.string().describe('Nombre del producto o sustancia química (ej. Acetona, Ácido Sulfúrico, Hipoclorito de Sodio).'),
        fabricante: z.string().default('Desconocido').describe('Fabricante o distribuidor del producto.'),
        estado_fisico: z.enum(['Líquido', 'Sólido', 'Gas']).default('Líquido').describe('Estado físico de agregación.'),
        clasificacion_onu: z.string().describe('Clase o División de peligro ONU (ej. Clase 3: Líquidos Inflamables, Clase 8: Sustancias Corrosivas, No Peligroso).'),
        numero_onu: z.string().optional().describe('Número ONU (ej. UN 1791).'),
        cas: z.string().optional().describe('Número CAS (ej. 7681-52-9).'),
        palabra_advertencia: z.enum(['PELIGRO', 'ATENCIÓN']).optional().describe('Palabra de advertencia SGA.'),
        pictogramas_sga: z.array(z.string()).default([]).describe('Pictogramas SGA aplicables (ej. ["inflamable", "corrosivo", "medio_ambiente"]).'),
        cantidad_almacenada: z.string().default('N/A').describe('Cantidad o volumen (ej. 50 Galones, 10 Kg).'),
        ubicacion: z.string().default('N/A').describe('Ubicación específica en almacén (ej. Estantería A, Bodega 1).'),
        tiene_fds: z.enum(['Sí', 'No']).default('Sí').describe('¿Cuenta con la Ficha de Datos de Seguridad de 16 secciones?'),
        tiene_rotulo: z.enum(['Sí', 'No']).default('Sí').describe('¿El recipiente o contenedor cuenta con el rotulado SGA completo?'),
        frases_h: z.string().optional().describe('Frases H de indicaciones de peligro SGA.'),
        consejos_p: z.string().optional().describe('Consejos P de prudencia SGA.'),
        incompatibilidades: z.string().default('Ninguna').describe('Reacciones peligrosas e incompatibilidades conocidas según NTC 3966 (ej. Evitar contacto con ácidos fuertes, bases o hipocloritos).'),
        requisitos_almacenamiento: z.string().default('Ninguno').describe('Requisitos específicos de almacenamiento o controles de ingeniería (ej. Diques de retención, segregación física NTC 3966).')
      })).optional().describe('Lista de productos químicos. OBLIGATORIO si accion="escribir". Vacío en otros casos.')
    });
  }

  async _call(input, runManager) {
    try {
      const { lookupPubChemGHS, resolveUserAndCompany } = require('~/server/routes/sgsst/matrizCompatibilidad');
      const { userId, companyId, companyInfo } = await resolveUserAndCompany(this.req || {});
      const officialConvId = `official-chem-${companyId || userId}`;

      let conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        if (userId) {
          conversationId = officialConvId;
        } else {
          const errorMsg = 'No se encontró un ID de conversación válido para guardar la matriz de compatibilidad.';
          console.error(`[MatrizCompatibilidad Tool] ${errorMsg}`);
          return JSON.stringify({ error: errorMsg });
        }
      }

      const { accion, productos, filtro_nombre, filtro_ubicacion, filtro_clase, ids_a_borrar } = input;

      let session = await ChemicalCompatibilitySession.findOne({ conversationId });
      if (session && !session.companyId && companyId) {
        session.companyId = companyId;
        await session.save();
      }

      if (!session && userId && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
        const tempId = `temp-${userId}`;
        const tempSession = await ChemicalCompatibilitySession.findOne({ conversationId: tempId, user: userId });
        if (tempSession && tempSession.matrixRows && tempSession.matrixRows.length > 0) {
          tempSession.conversationId = conversationId;
          if (companyId) tempSession.companyId = companyId;
          await tempSession.save();
          session = tempSession;
          console.log(`[MatrizCompatibilidad Tool] Migrated temporal session for user ${userId} to ${conversationId}`);
        }
      }

      // ─── ACCION: CONSULTAR CONTEXTO SGSST 360° ─────────────────────────────────
      if (accion === 'consultar_contexto_sgsst') {
        if (!userId) { return JSON.stringify({ error: 'No autenticado para acceder al contexto.' }); }

        const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData;
        const PerfilCargoModel = mongoose.models.PerfilCargoData;
        const SgsstChemicalData = require('~/models/SgsstChemicalData');
        const EppData = require('~/models/EppData');
        const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
        const DiagnosticoData = require('~/models/DiagnosticoData');
        const KanbanTask = require('~/models/KanbanTask');
        let payload = {};

        if (companyInfo) {
          payload.informacion_empresa = {
            nombre: companyInfo.companyName || 'N/A',
            nit: companyInfo.nit || 'N/A',
            actividad_economica: companyInfo.economicActivity || 'N/A',
            sector: companyInfo.sector || 'N/A',
            descripcion_actividades: companyInfo.generalActivities || 'N/A',
            nivel_riesgo: companyInfo.riskLevel || 'N/A',
            numero_trabajadores: companyInfo.workerCount || 'N/A',
          };
        }

        const baseQuery = companyId ? { user: userId, companyId } : { user: userId };

        // Inventario de productos químicos registrado en Hito 5 (Registro y Rótulo de Productos Químicos)
        if (SgsstChemicalData) {
          let chemDoc = await SgsstChemicalData.findOne(baseQuery).lean();
          if (!chemDoc && companyId) chemDoc = await SgsstChemicalData.findOne({ user: userId }).lean();
          if (chemDoc && Array.isArray(chemDoc.productos) && chemDoc.productos.length > 0) {
            payload.inventario_quimico_hito5 = chemDoc.productos.map(p => ({
              nombre: p.nombre,
              fabricante: p.fabricante || 'Desconocido',
              estado_fisico: p.estadoFisico === 'Gaseoso' ? 'Gas' : (p.estadoFisico || 'Líquido'),
              clasificacion_onu: p.claseOnu || '',
              cas: p.cas || '',
              pictogramas_sga: p.pictogramasSga || [],
              ubicacion: p.ubicacion || 'N/A',
              cantidad_almacenada: p.cantidadAlmacenada || 'N/A',
              tiene_fds: p.tieneFds || 'No',
              tiene_rotulo: p.tieneRotuloSga || 'No',
              requisitos_almacenamiento: p.requisitosAlmacenamiento || '',
              incompatibilidades: Array.isArray(p.incompatibilidades) ? p.incompatibilidades.join(', ') : (p.incompatibilidades || '')
            }));
          }
        }

        // Entregas de EPP Químico (Hito 5)
        if (EppData) {
          const eppItems = await EppData.find(baseQuery).limit(30).lean();
          payload.epp_quimico_hito5 = {
            total_entregas_epp: eppItems.length,
            entregas_proteccion_quimica: eppItems
              .filter(e => /nitrilo|neopreno|gafa|careta|respirador|cartucho|delantal|vapor|qu[ií]mic/i.test(`${e.eppType || ''} ${e.eppName || ''}`))
              .map(e => ({ trabajador: e.workerName, cargo: e.workerRole, epp: e.eppName || e.eppType }))
          };
        }

        // Riesgos Químicos en Matriz IPEVR GTC-45 (Hito 1)
        if (GTC45WorkspaceSession) {
          const gtcSession = await GTC45WorkspaceSession.findOne(
            companyId ? { user: userId, companyId, isOfficial: true } : { user: userId, isOfficial: true }
          ).lean();
          if (gtcSession && Array.isArray(gtcSession.matrixRows)) {
            payload.riesgos_quimicos_gtc45_hito1 = gtcSession.matrixRows
              .filter(r => /qu[ií]mic|gas|vapor|humo|líquido|polvo|rocío|corrosiv|inflamabl/i.test(`${r.peligro_clasificacion || ''} ${r.peligro_descripcion || ''}`))
              .map(r => ({
                proceso: r.proceso,
                cargo: r.cargo,
                peligro: r.peligro_descripcion,
                controles_medio: r.controles_medio,
                controles_individuo: r.controles_individuo
              }));
          }
        }

        // Estado del Estándar 4.1.3 en Diagnóstico Res. 0312 (Hito 1)
        if (DiagnosticoData) {
          const diagDoc = await DiagnosticoData.findOne(baseQuery).lean();
          const item413 = (diagDoc?.statusData || []).find(s => s.code === '4.1.3' || s.itemId === 'std_4_1_3' || s.itemId === 'art16_39');
          payload.estandar_0312_4_1_3 = item413 || { code: '4.1.3', status: 'sin_evaluar' };
        }

        // Tareas ACPM Químicas en Hito 7 (KanbanTask)
        if (KanbanTask) {
          const tasks = await KanbanTask.find({
            ...baseQuery,
            $or: [{ sourceModule: /compatibilidad|quimic|hito_5/i }, { title: /Químic|SGA|FDS/i }]
          }).limit(15).lean();
          payload.tareas_acpm_quimicas_hito7 = tasks.map(t => ({ titulo: t.title, estado: t.status, prioridad: t.priority }));
        }

        // Perfiles de Cargo (Hito 2)
        if (PerfilCargoModel) {
          const cargoDoc = await PerfilCargoModel.findOne(baseQuery).lean();
          if (cargoDoc && Array.isArray(cargoDoc.perfiles)) {
            payload.perfiles_de_cargo = cargoDoc.perfiles.map(p => ({
              cargo: p.nombreCargo || p.cargo,
              funciones: p.funcionesPrincipales || p.objetivoCargo || '',
              peligros_identificados: p.peligrosExpuestos || ''
            }));
          }
        }

        // Extraer perfiles de salud que tengan alergias químicas (Hito 3)
        if (PerfilSocioModel) {
          const socioDataDoc = await PerfilSocioModel.findOne(baseQuery).lean();
          if (socioDataDoc && socioDataDoc.trabajadores) {
            payload.alergias_y_patologias_quimicas = socioDataDoc.trabajadores
              .filter(t => t.alergiasQuimicas && t.alergiasQuimicas !== 'Ninguna' && t.alergiasQuimicas !== '')
              .map(t => ({
                cargo: t.cargo,
                alergias: t.alergiasQuimicas,
                recomendaciones: t.recomendacionesMedicas || ''
              }));
          }
        }

        // Resumen de matriz oficial de compatibilidad química si existe
        const officialSession = await ChemicalCompatibilitySession.findOne({ conversationId: officialConvId }).lean();
        if (officialSession && Array.isArray(officialSession.matrixRows) && officialSession.matrixRows.length > 0) {
          payload.matriz_compatibilidad_oficial_resumen = {
            total_productos: officialSession.matrixRows.length,
            productos_registrados: officialSession.matrixRows.map(r => `${r.nombre} (${r.clasificacion_onu || 'Sin clase'}) - ${r.ubicacion || 'Sin ubicación'}`)
          };
        }

        return JSON.stringify({
          mensaje: "Contexto 360° SGSST y Químico (Decreto 1496 de 2018 / Res. 773 de 2021 / NTC 3966) recuperado exitosamente.",
          advertencia: "MEMORIZA ESTA INFORMACIÓN PARA EVALUAR EL INVENTARIO QUÍMICO DEL HITO 5, RIESGOS GTC-45, EPP, PERFILES DE CARGO Y RESTRICCIONES DE SALUD AL DOCUMENTAR LA MATRIZ DE COMPATIBILIDAD.",
          datos: payload
        });
      }

      // ─── ACCION: ENRIQUECER CON PUBCHEM NIH GHS ────────────────────────────────
      if (accion === 'enriquecer_pubchem') {
        let targetSession = session;
        if ((!targetSession || !targetSession.matrixRows || targetSession.matrixRows.length === 0) && userId) {
          targetSession = await ChemicalCompatibilitySession.findOne({ conversationId: officialConvId });
        }
        if (!targetSession || !Array.isArray(targetSession.matrixRows) || targetSession.matrixRows.length === 0) {
          return JSON.stringify({
            mensaje: 'El inventario de productos químicos está vacío. Primero escribe o sincroniza productos para enriquecerlos con PubChem.',
            enrichedCount: 0
          });
        }

        let enrichedCount = 0;
        for (let i = 0; i < targetSession.matrixRows.length; i++) {
          const row = targetSession.matrixRows[i];
          if (row.nombre && lookupPubChemGHS) {
            const ghs = await lookupPubChemGHS(row.nombre);
            if (ghs) {
              enrichedCount++;
              row.pubchem_cid = ghs.cid;
              if (!row.cas && ghs.cas) row.cas = ghs.cas;
              if (ghs.signalWord) row.palabra_advertencia = ghs.signalWord;
              if (Array.isArray(ghs.wappyPictograms) && ghs.wappyPictograms.length > 0) {
                row.pictogramas_sga = Array.from(new Set([...(row.pictogramas_sga || []), ...ghs.wappyPictograms]));
              }
              if ((!row.frases_h || row.frases_h === 'Verificar FDS') && ghs.hazardStatements?.length > 0) {
                row.frases_h = ghs.hazardStatements.join(' | ');
              }
              if ((!row.consejos_p || row.consejos_p === 'Verificar FDS') && ghs.precautionaryStatements?.length > 0) {
                row.consejos_p = ghs.precautionaryStatements.join(', ');
              }
              if ((!row.incompatibilidades || row.incompatibilidades === 'Ninguna') && ghs.incompatibilidades) {
                row.incompatibilidades = ghs.incompatibilidades;
              }
            }
          }
        }
        targetSession.markModified('matrixRows');
        await targetSession.save();

        if (userId && targetSession.conversationId !== officialConvId) {
          await ChemicalCompatibilitySession.findOneAndUpdate(
            { conversationId: officialConvId },
            {
              $set: {
                matrixRows: targetSession.matrixRows,
                isOfficial: true,
                companyId: companyId || undefined,
                sourceConversationId: targetSession.conversationId,
                promotedAt: new Date(),
              },
              $setOnInsert: { user: userId, officialTitle: 'Matriz Oficial de Compatibilidad Química' },
            },
            { upsert: true }
          );
        }

        return JSON.stringify({
          success: true,
          mensaje: `Se enriquecieron ${enrichedCount} de ${targetSession.matrixRows.length} sustancias químicas con la API oficial PubChem NIH GHS (CID, CAS, Pictogramas SGA, Frases H/P).`,
          enrichedCount,
          resultados: targetSession.matrixRows
        });
      }

      // ─── ACCION: LEER ──────────────────────────────────────────────────────────
      if (accion === 'leer') {
        let activeSession = session;
        if ((!activeSession || !activeSession.matrixRows || activeSession.matrixRows.length === 0) && userId) {
          const officialSession = await ChemicalCompatibilitySession.findOne({ conversationId: officialConvId });
          if (officialSession && officialSession.matrixRows && officialSession.matrixRows.length > 0) {
            activeSession = officialSession;
          }
        }

        if (!activeSession || !activeSession.matrixRows || activeSession.matrixRows.length === 0) {
          return JSON.stringify({ mensaje: 'El inventario de productos químicos está vacío.', resultados: [] });
        }

        let rows = activeSession.matrixRows;
        if (filtro_nombre) {
          rows = rows.filter(r => r.nombre && r.nombre.toLowerCase().includes(filtro_nombre.toLowerCase()));
        }
        if (filtro_ubicacion) {
          rows = rows.filter(r => r.ubicacion && r.ubicacion.toLowerCase().includes(filtro_ubicacion.toLowerCase()));
        }
        if (filtro_clase) {
          rows = rows.filter(r => r.clasificacion_onu && r.clasificacion_onu.toLowerCase().includes(filtro_clase.toLowerCase()));
        }

        return JSON.stringify({
          mensaje: `Se encontraron ${rows.length} productos químicos.`,
          totalRegistros: activeSession.matrixRows.length,
          resultados: rows
        });
      }

      // ─── ACCION: BORRAR ────────────────────────────────────────────────────────
      if (accion === 'borrar') {
        if (!session || !session.matrixRows || session.matrixRows.length === 0) {
          return JSON.stringify({ error: 'El inventario está vacío. No hay productos para borrar.' });
        }
        if (!ids_a_borrar || !Array.isArray(ids_a_borrar) || ids_a_borrar.length === 0) {
          return JSON.stringify({ error: 'Debe proveer un arreglo "ids_a_borrar" con los IDs a eliminar.' });
        }

        const initialCount = session.matrixRows.length;
        session.matrixRows = session.matrixRows.filter(r => !ids_a_borrar.includes(r.id));
        const deletedCount = initialCount - session.matrixRows.length;

        session.markModified('matrixRows');
        await session.save();

        // Sincronizar borrado con matriz oficial si existe
        if (userId) {
          if (conversationId !== officialConvId) {
            await ChemicalCompatibilitySession.findOneAndUpdate(
              { conversationId: officialConvId },
              {
                $set: {
                  matrixRows: session.matrixRows,
                  isOfficial: true,
                  companyId: companyId || undefined,
                  sourceConversationId: conversationId,
                  promotedAt: new Date(),
                },
                $setOnInsert: { user: userId, officialTitle: 'Matriz Oficial de Compatibilidad Química' },
              },
              { upsert: true }
            );
          }
        }

        return JSON.stringify({
          mensaje: `Se eliminaron exitosamente ${deletedCount} productos químicos de la base de datos y se sincronizó con la Matriz Oficial.`,
          totalRegistrosRestantes: session.matrixRows.length
        });
      }

      // ─── ACCION: ESCRIBIR (CON AUTO-ENRIQUECIMIENTO PUBCHEM NIH GHS) ───────────
      if (!productos || !Array.isArray(productos)) {
        return JSON.stringify({ error: "Debe proveer un array 'productos' para escribir en la matriz." });
      }

      if (!session) {
        session = new ChemicalCompatibilitySession({
          conversationId,
          user: userId || undefined,
          companyId: companyId || undefined,
          matrixRows: []
        });
      }

      let insertedCount = 0;
      let updatedCount = 0;
      let pubchemEnrichedCount = 0;

      for (const prod of productos) {
        const row = {
          ...prod,
          nombre: toSentenceCase(prod.nombre),
          ubicacion: toSentenceCase(prod.ubicacion)
        };

        // Auto-enriquecer con PubChem NIH GHS si faltan pictogramas, CAS o frases H
        if (lookupPubChemGHS && row.nombre && (!row.pictogramas_sga || row.pictogramas_sga.length === 0 || !row.cas || !row.frases_h)) {
          try {
            const ghs = await lookupPubChemGHS(row.nombre);
            if (ghs) {
              pubchemEnrichedCount++;
              row.pubchem_cid = ghs.cid;
              if (!row.cas && ghs.cas) row.cas = ghs.cas;
              if (!row.palabra_advertencia && ghs.signalWord) row.palabra_advertencia = ghs.signalWord;
              if ((!row.pictogramas_sga || row.pictogramas_sga.length === 0) && Array.isArray(ghs.wappyPictograms)) {
                row.pictogramas_sga = ghs.wappyPictograms;
              }
              if (!row.frases_h && ghs.hazardStatements?.length > 0) {
                row.frases_h = ghs.hazardStatements.join(' | ');
              }
              if (!row.consejos_p && ghs.precautionaryStatements?.length > 0) {
                row.consejos_p = ghs.precautionaryStatements.join(', ');
              }
              if ((!row.incompatibilidades || row.incompatibilidades === 'Ninguna') && ghs.incompatibilidades) {
                row.incompatibilidades = ghs.incompatibilidades;
              }
            }
          } catch (_e) {}
        }

        // Buscar producto existente por nombre
        const targetIndex = session.matrixRows.findIndex(r =>
          r.nombre?.toLowerCase() === prod.nombre?.toLowerCase()
        );

        if (targetIndex !== -1) {
          // UPDATE
          session.matrixRows[targetIndex] = { ...session.matrixRows[targetIndex], ...row };
          updatedCount++;
        } else {
          // INSERT
          row.id = Date.now().toString() + Math.random().toString(36).substring(7);
          session.matrixRows.push(row);
          insertedCount++;
        }
      }

      if (!session.user && userId) session.user = userId;
      if (!session.companyId && companyId) session.companyId = companyId;

      session.markModified('matrixRows');
      await session.save();

      // Sincronizar automáticamente en paralelo con la Matriz Oficial de Compatibilidad Química
      if (userId) {
        if (conversationId !== officialConvId) {
          await ChemicalCompatibilitySession.findOneAndUpdate(
            { conversationId: officialConvId },
            {
              $set: {
                matrixRows: session.matrixRows,
                isOfficial: true,
                companyId: companyId || undefined,
                sourceConversationId: conversationId,
                promotedAt: new Date(),
              },
              $setOnInsert: { user: userId, officialTitle: 'Matriz Oficial de Compatibilidad Química' },
            },
            { upsert: true }
          );
        }
      }

      // Limpiar sesión temporal si aplica
      if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
        const tempId = `temp-${userId}`;
        await ChemicalCompatibilitySession.deleteOne({ conversationId: tempId, user: userId });
      }

      return JSON.stringify({
        success: true,
        message: `Operación masiva de inventario completada y sincronizada con la Matriz Oficial de Compatibilidad Química. Se procesaron ${productos.length} productos químicos (${pubchemEnrichedCount} verificados automáticamente con PubChem NIH GHS).`,
        stats: { insertados: insertedCount, actualizados: updatedCount, pubchemEnriched: pubchemEnrichedCount }
      });

    } catch (error) {
      console.error('[MatrizCompatibilidad Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error procesando el inventario de compatibilidad química.',
        details: error.message,
      });
    }
  }
}

module.exports = MatrizCompatibilidad;
