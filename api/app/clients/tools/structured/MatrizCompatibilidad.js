const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');
const ChemicalCompatibilitySession = require('~/models/ChemicalCompatibilitySession');
const CompanyInfo = require('~/models/CompanyInfo');

class MatrizCompatibilidad extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'matriz_compatibilidad';
    this.description =
      'Lee, añade, evalúa o actualiza inventarios de productos químicos en la Matriz de Compatibilidad de la conversación actual. Usa esta herramienta para leer, documentar o eliminar productos químicos.';
    this.req = fields.req;
    this.schema = z.object({
      accion: z.enum(['leer', 'escribir', 'borrar', 'consultar_contexto_sgsst']).describe('Usa consultar_contexto_sgsst para datos de la empresa, leer para consultar inventario, escribir para guardar productos, borrar para eliminar.'),
      filtro_nombre: z.string().optional().describe('Filtro por nombre del producto para leer.'),
      filtro_ubicacion: z.string().optional().describe('Filtro por ubicación para leer.'),
      filtro_clase: z.string().optional().describe('Filtro por Clase ONU para leer.'),
      ids_a_borrar: z.array(z.string()).optional().describe('Arreglo de IDs de los productos químicos que deseas eliminar (solamente cuando accion="borrar").'),
      productos: z.array(z.object({
        nombre: z.string().describe('Nombre del producto o sustancia química (ej. Acetona, Ácido Sulfúrico).'),
        fabricante: z.string().default('Desconocido').describe('Fabricante o distribuidor del producto.'),
        estado_fisico: z.enum(['Líquido', 'Sólido', 'Gas']).default('Líquido').describe('Estado físico de agregación.'),
        clasificacion_onu: z.string().describe('Clase o División de peligro ONU (ej. Clase 3: Líquidos Inflamables, Clase 8: Sustancias Corrosivas, No Peligroso).'),
        pictogramas_sga: z.array(z.string()).default([]).describe('Pictogramas SGA aplicables (ej. ["inflamable", "corrosivo"]).'),
        cantidad_almacenada: z.string().default('N/A').describe('Cantidad o volumen (ej. 50 Galones, 10 Kg).'),
        ubicacion: z.string().default('N/A').describe('Ubicación específica en almacén (ej. Estantería A, Bodega 1).'),
        tiene_fds: z.enum(['Sí', 'No']).default('Sí').describe('¿Cuenta con la Ficha de Datos de Seguridad de 16 secciones?'),
        tiene_rotulo: z.enum(['Sí', 'No']).default('Sí').describe('¿El recipiente o contenedor cuenta con el rotulado SGA completo?'),
        incompatibilidades: z.string().default('Ninguna').describe('Reacciones peligrosas e incompatibilidades conocidas (ej. Evitar contacto con bases fuertes y agua).'),
        requisitos_almacenamiento: z.string().default('Ninguno').describe('Requisitos específicos de almacenamiento o controles de ingeniería (ej. Diques de retención, extinguidores secos).')
      })).optional().describe('Lista de productos químicos. OBLIGATORIO si accion="escribir". Vacío en otros casos.')
    });
  }

  async _call(input, runManager) {
    try {
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        const errorMsg = 'No se encontró un ID de conversación válido para guardar la matriz de compatibilidad.';
        console.error(`[MatrizCompatibilidad Tool] ${errorMsg}`);
        return JSON.stringify({ error: errorMsg });
      }

      const { accion, productos, filtro_nombre, filtro_ubicacion, filtro_clase, ids_a_borrar } = input;

      const userId = this.req?.user?.id;
      let companyId = null;
      if (userId) {
        let active = await CompanyInfo.findOne({ user: userId, isActive: true });
        if (!active) active = await CompanyInfo.findOne({ user: userId });
        companyId = active ? active._id : null;
      }

      let session = await ChemicalCompatibilitySession.findOne({ conversationId });
      if (session && !session.companyId && companyId) {
        session.companyId = companyId;
        await session.save();
      }

      if (!session && userId && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
        const { Conversation } = require('~/db/models');
        const convo = await Conversation.findOne({ conversationId }, 'createdAt').lean();
        const isNewConvo = convo && convo.createdAt && (Date.now() - new Date(convo.createdAt).getTime() < 120000);

        if (isNewConvo) {
          const tempId = `temp-${userId}`;
          const tempSession = await ChemicalCompatibilitySession.findOne({ conversationId: tempId, user: userId });
          if (tempSession) {
            tempSession.conversationId = conversationId;
            if (companyId) tempSession.companyId = companyId;
            await tempSession.save();
            session = tempSession;
            console.log(`[MatrizCompatibilidad Tool] Migrated temporal session for user ${userId} to ${conversationId}`);
          }
        }
      }

      // ─── ACCION: CONSULTAR CONTEXTO SGSST ──────────────────────────────────────
      if (accion === 'consultar_contexto_sgsst') {
        if (!userId) { return JSON.stringify({ error: 'No autenticado para acceder al contexto.' }); }
        
        const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData;
        let payload = {};

        if (CompanyInfo) {
          const companyConf = await CompanyInfo.findOne({ user: userId }).lean();
          if (companyConf) {
            payload.informacion_empresa = {
              nombre: companyConf.companyName || 'N/A',
              nit: companyConf.nit || 'N/A',
              actividad_economica: companyConf.economicActivity || 'N/A',
              sector: companyConf.sector || 'N/A',
              descripcion_actividades: companyConf.generalActivities || 'N/A',
              nivel_riesgo: companyConf.riskLevel || 'N/A',
              numero_trabajadores: companyConf.workerCount || 'N/A'
            };
          }
        }

        // Extraer perfiles de salud que tengan alergias químicas
        if (PerfilSocioModel) {
          const socioDataDoc = await PerfilSocioModel.findOne({ user: userId }).lean();
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

        return JSON.stringify({
          mensaje: "Contexto SGSST de la compañía recuperado exitosamente.",
          advertencia: "MEMORIZA ESTA INFORMACIÓN PARA EVALUAR RESTRICCIONES DE EPP O DE SALUD AL RECOMENDAR CONTROLES DE ALMACENAMIENTO.",
          datos: payload
        });
      }

      // ─── ACCION: LEER ──────────────────────────────────────────────────────────
      if (accion === 'leer') {
        if (!session || !session.matrixRows || session.matrixRows.length === 0) {
          return JSON.stringify({ mensaje: 'El inventario de productos químicos está vacío.', resultados: [] });
        }

        let rows = session.matrixRows;
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
          totalRegistros: session.matrixRows.length,
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

        return JSON.stringify({
          mensaje: `Se eliminaron exitosamente ${deletedCount} productos químicos de la base de datos.`,
          totalRegistrosRestantes: session.matrixRows.length
        });
      }

      // ─── ACCION: ESCRIBIR ──────────────────────────────────────────────────────
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

      for (const prod of productos) {
        const row = {
          ...prod,
          nombre: toSentenceCase(prod.nombre),
          ubicacion: toSentenceCase(prod.ubicacion)
        };

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

      // Limpiar sesión temporal si aplica
      if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
        const tempId = `temp-${userId}`;
        await ChemicalCompatibilitySession.deleteOne({ conversationId: tempId, user: userId });
      }

      return JSON.stringify({
        success: true,
        message: `Operación masiva de inventario completada. Se procesaron ${productos.length} productos químicos.`,
        stats: { insertados: insertedCount, actualizados: updatedCount }
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
