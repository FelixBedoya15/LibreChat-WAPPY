const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');

class ConsultarAnaliticaActosCondiciones extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'consultar_analitica_actos_condiciones';
    this.description =
      'Herramienta de analítica de actos y condiciones inseguras: Consulta estadísticas, áreas críticas y tendencias de reportes en el buzón de la empresa. También permite marcar un reporte como procesado especificando su ID. Úsala cuando el administrador te pregunte sobre estadísticas de actos, condiciones, tendencias de seguridad, reportes pendientes o para procesar/archivar uno.';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['obtener_analisis', 'marcar_procesado'])
        .default('obtener_analisis')
        .describe('Acción a realizar: "obtener_analisis" para ver estadísticas o "marcar_procesado" para archivar un reporte.'),
      reportId: z
        .string()
        .optional()
        .describe('ID único del reporte del buzón público. Requerido únicamente para la acción "marcar_procesado".'),
      dias: z
        .number()
        .optional()
        .default(30)
        .describe('Número de días de historial hacia atrás que deseas analizar. Por defecto es 30 días.'),
    });
  }

  async _call(input, runManager) {
    try {
      const userId = this.req?.user?.id;
      if (!userId) {
        return '❌ Error: Usuario no autenticado para consultar analítica de actos y condiciones.';
      }

      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      const { accion, reportId, dias } = input;

      const CompanyInfo = mongoose.models.CompanyInfo;
      const ReporteActosData = mongoose.models.ReporteActosData;

      if (!CompanyInfo || !ReporteActosData) {
        return '❌ Error: Los modelos de base de datos no están listos.';
      }

      // 1. Encontrar la empresa del usuario actual
      const company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean()
        || await CompanyInfo.findOne({ user: userId }).lean();

      if (!company) {
        return '❌ Error: No se encontró ninguna empresa vinculada a tu cuenta de usuario.';
      }

      // ─── ACCIÓN: MARCAR PROCESADO ───
      if (accion === 'marcar_procesado') {
        if (!reportId) {
          return '❌ Error: El parámetro "reportId" es requerido para la acción "marcar_procesado".';
        }

        const doc = await ReporteActosData.findOne({ user: userId, companyId: company._id });
        if (!doc || !doc.inboxPublico) {
          return '❌ Error: No se encontraron reportes públicos registrados en esta empresa.';
        }

        let found = false;
        doc.inboxPublico = doc.inboxPublico.map((item) => {
          if (String(item.id) === String(reportId)) {
            item.status = 'processed';
            found = true;
          }
          return item;
        });

        if (!found) {
          return `❌ Error: No se encontró ningún reporte con ID "${reportId}" en el buzón público.`;
        }

        doc.markModified('inboxPublico');
        doc.updatedAt = new Date();
        await doc.save();

        return JSON.stringify({
          success: true,
          message: `El reporte con ID ${reportId} ha sido marcado como procesado exitosamente en la base de datos.`
        }, null, 2);
      }

      const doc = await ReporteActosData.findOne(
        { user: userId, companyId: company._id },
        {
          inboxPublico: {
            $map: {
              input: '$inboxPublico',
              as: 'item',
              in: {
                id: '$$item.id',
                trabajador: '$$item.trabajador',
                createdAt: '$$item.createdAt',
                status: '$$item.status',
                data: {
                  fecha: '$$item.data.fecha',
                  hora: '$$item.data.hora',
                  ubicacion: '$$item.data.ubicacion',
                  descripcion: '$$item.data.descripcion',
                  foto1Exists: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$$item.data.foto1', ''] } }, 0] }, true, false] },
                  foto2Exists: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$$item.data.foto2', ''] } }, 0] }, true, false] },
                  foto3Exists: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$$item.data.foto3', ''] } }, 0] }, true, false] },
                  videoExists: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$$item.data.video', ''] } }, 0] }, true, false] }
                }
              }
            }
          }
        }
      ).lean();
      
      // Establecer rango de tiempo
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - (dias || 30));

      const inboxList = doc?.inboxPublico || [];

      // Filtrar registros por fecha
      const filteredRecords = inboxList.filter((rec) => {
        const recordDate = rec.createdAt ? new Date(rec.createdAt) : new Date();
        return recordDate >= dateLimit;
      });

      // Calcular estadísticas
      const total = filteredRecords.length;
      const pendingCount = filteredRecords.filter((r) => r.status !== 'processed').length;
      const processedCount = filteredRecords.filter((r) => r.status === 'processed').length;

      // Desglose por ubicación
      const locationMap = {};
      // Desglose preliminar por tipo (Heurística de texto)
      let actosCount = 0;
      let condicionesCount = 0;
      let mixtoCount = 0;

      const actRegex = /acto|comportamiento|persona|no uso|descuido|distraccion|negligencia|celular|EPP|afan|omitir/i;
      const condRegex = /condicion|cable|piso|herramienta|iluminacion|obstaculo|daño|roto|aceite|mojado|riesgo|infraestructura/i;

      filteredRecords.forEach((rec) => {
        // Ubicación
        const loc = rec.data?.ubicacion?.trim() || 'General';
        locationMap[loc] = (locationMap[loc] || 0) + 1;

        // Tipo
        const desc = rec.data?.descripcion || '';
        const hasAct = actRegex.test(desc);
        const hasCond = condRegex.test(desc);

        if (hasAct && hasCond) mixtoCount++;
        else if (hasAct) actosCount++;
        else if (hasCond) condicionesCount++;
        else mixtoCount++;
      });

      // Ordenar áreas por cantidad
      const sortedLocations = Object.entries(locationMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

      // Consultar cuántos reportes PDF finalizados existen en base de datos
      let totalFinalized = 0;
      const Conversation = mongoose.models.Conversation;
      if (Conversation) {
        totalFinalized = await Conversation.countDocuments({
          user: userId,
          tags: { $all: ['sgsst-reporte-actos', `company-${company._id}`] },
          $or: [{ isArchived: false }, { isArchived: { $exists: false } }]
        });
      }

      // Reportes recientes (últimos 8) ordenados por fecha descendente
      const sortedRecents = [...filteredRecords]
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 8)
        .map((r) => ({
          id: r.id,
          fecha: r.data?.fecha || r.createdAt,
          trabajador: r.trabajador?.nombre || 'Anónimo',
          cargo: r.trabajador?.cargo || 'No especificado',
          descripcion: r.data?.descripcion || '',
          ubicacion: r.data?.ubicacion || 'Sin ubicación',
          status: r.status || 'pending',
          hasFoto: !!(r.data?.foto1Exists || r.data?.foto2Exists || r.data?.foto3Exists),
          hasVideo: !!r.data?.videoExists,
          foto1: r.data?.foto1Exists ? 'present' : null,
          foto2: r.data?.foto2Exists ? 'present' : null,
          foto3: r.data?.foto3Exists ? 'present' : null,
          video: r.data?.videoExists ? 'present' : null
        }));

      const resultObj = {
        empresa: company.companyName,
        totalReportesBuzon: total,
        periodoDias: dias,
        pendientes: pendingCount,
        procesados: processedCount,
        finalizadosPdf: totalFinalized,
        preliminarClasificacion: {
          actos: actosCount,
          condiciones: condicionesCount,
          mixto_no_clasificado: mixtoCount
        },
        areasFrecuentes: sortedLocations,
        reportesRecientes: sortedRecents
      };

      // 7. Upsert Canvas Session of type 'actos_condiciones'
      if (conversationId && conversationId !== 'new') {
        const CanvasSession = mongoose.models.CanvasSession || require('~/models/CanvasSession');
        if (CanvasSession) {
          let canvasSession = await CanvasSession.findOne({ conversationId });
          const userRole = this.req?.user?.role;
          const isPro = userRole === 'ADMIN' || userRole === 'USER_PRO';
          const maxHistory = isPro ? 20 : 5;

          if (canvasSession) {
            const nextVersion = canvasSession.version + 1;
            canvasSession.content = JSON.stringify(resultObj);
            canvasSession.title = 'Analítica de Actos y Condiciones';
            canvasSession.fileType = 'actos_condiciones';
            canvasSession.version = nextVersion;
            canvasSession.updatedAt = new Date();

            const newHistoryItem = {
              version: nextVersion,
              content: JSON.stringify(resultObj),
              title: 'Analítica de Actos y Condiciones',
              fileType: 'actos_condiciones',
              updatedAt: new Date()
            };
            canvasSession.history = [...(canvasSession.history || []), newHistoryItem].slice(-maxHistory);

            await canvasSession.save();
          } else {
            canvasSession = new CanvasSession({
              user: userId,
              conversationId,
              content: JSON.stringify(resultObj),
              title: 'Analítica de Actos y Condiciones',
              fileType: 'actos_condiciones',
              version: 1,
              companyId: company._id,
              history: [{
                version: 1,
                content: JSON.stringify(resultObj),
                title: 'Analítica de Actos y Condiciones',
                fileType: 'actos_condiciones',
                updatedAt: new Date()
              }]
            });
            await canvasSession.save();
          }
          console.log(`[ConsultarAnaliticaActosCondiciones] Upserted CanvasSession for convoId: ${conversationId}`);
        }
      }

      return JSON.stringify(resultObj, null, 2);
    } catch (error) {
      console.error('[ConsultarAnaliticaActosCondiciones Tool] Error:', error);
      return `❌ Error al consultar la analítica de actos y condiciones: ${error.message}`;
    }
  }
}

module.exports = ConsultarAnaliticaActosCondiciones;
