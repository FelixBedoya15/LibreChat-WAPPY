const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');

class ConsultarAnaliticaPsicosocial extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'consultar_analitica_psicosocial';
    this.description =
      'Herramienta de analítica psicosocial: Consulta de forma anónima y consolidada los datos agregados del estado de ánimo y factores de estrés (estresores) reportados por los trabajadores de la empresa actual. Úsala cuando el administrador de la empresa te pregunte en el chat sobre el clima laboral, estadísticas de ánimo, o las quejas/estresores principales.';
    this.req = fields.req;

    this.schema = z.object({
      dias: z
        .number()
        .optional()
        .default(30)
        .describe('Número de días de historial hacia atrás que deseas analizar. Por defecto es 30 días.'),
      departamento: z
        .string()
        .optional()
        .describe('Nombre del departamento/área específica de la empresa si deseas segmentar la búsqueda.'),
    });
  }

  async _call(input, runManager) {
    try {
      const userId = this.req?.user?.id;
      if (!userId) {
        return '❌ Error: Usuario no autenticado para consultar analítica psicosocial.';
      }

      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      const { dias, departamento } = input;

      const CompanyInfo = mongoose.models.CompanyInfo;
      const MoodTelemetry = mongoose.models.MoodTelemetry || mongoose.connection.collection('moodtelemetries');

      if (!CompanyInfo || !MoodTelemetry) {
        return '❌ Error: Los modelos de base de datos no están listos.';
      }

      // 1. Encontrar la empresa del usuario actual
      const company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean()
        || await CompanyInfo.findOne({ user: userId }).lean();

      if (!company) {
        return '❌ Error: No se encontró ninguna empresa vinculada a tu cuenta de usuario.';
      }

      // 2. Establecer rango de tiempo
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - (dias || 30));

      // 3. Construir la consulta
      const query = {
        companyId: company._id,
        createdAt: { $gte: dateLimit },
      };

      if (departamento) {
        query.department = new RegExp(departamento.trim(), 'i');
      }

      // 4. Buscar los registros en la base de datos
      // Usar query nativa si mongoose no tiene registrado el modelo, o el modelo directo
      const records = typeof MoodTelemetry.find === 'function' 
        ? await MoodTelemetry.find(query).lean()
        : await MoodTelemetry.find(query).toArray();

      if (!records || records.length === 0) {
        return `📊 Analítica Psicosocial (${company.companyName}): No se registraron datos de estado de ánimo en los últimos ${dias} días ${departamento ? `para el área "${departamento}"` : ''}.`;
      }

      // 5. Calcular estadísticas agregadas
      let happyCount = 0;
      let neutralCount = 0;
      let sadCount = 0;
      const stressorsMap = {};
      const recentDetails = [];

      records.forEach((rec) => {
        // Conteo de estado de ánimo
        if (rec.mood === 'happy') happyCount++;
        else if (rec.mood === 'neutral') neutralCount++;
        else if (rec.mood === 'sad') sadCount++;

        // Conteo de estresores
        if (rec.stressors && rec.stressors.length > 0) {
          rec.stressors.forEach((s) => {
            stressorsMap[s] = (stressorsMap[s] || 0) + 1;
          });
        }

        // Almacenar últimos comentarios detallados (anónimos) para contexto
        if (rec.details && rec.details.trim()) {
          recentDetails.push({
            date: rec.createdAt || rec.updatedAt,
            detail: rec.details.trim(),
            dep: rec.department || 'General',
          });
        }
      });

      const total = records.length;
      const happyPct = ((happyCount / total) * 100).toFixed(1);
      const neutralPct = ((neutralCount / total) * 100).toFixed(1);
      const sadPct = ((sadCount / total) * 100).toFixed(1);

      // Ordenar estresores por frecuencia
      const sortedStressors = Object.entries(stressorsMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count, pct: ((count / total) * 100).toFixed(1) }));

      // Tomar los últimos 8 resúmenes de conversación para darle contexto semántico al psicólogo
      const sortedDetails = recentDetails
        .sort((a, b) => b.date - a.date)
        .slice(0, 8)
        .map((d) => `- [Área: ${d.dep}]: "${d.detail}"`);

      // 6. Retornar el reporte estructurado
      const resultObj = {
        empresa: company.companyName,
        totalMuestras: total,
        periodoDias: dias,
        filtroDepartamento: departamento || 'Todos',
        estadoAnimo: {
          feliz: `${happyCount} (${happyPct}%)`,
          neutral: `${neutralCount} (${neutralPct}%)`,
          triste_estresado: `${sadCount} (${sadPct}%)`,
        },
        estresoresPrincipales: sortedStressors,
        detallesContextualesRecientes: sortedDetails,
      };

      // 7. Upsert Canvas Session of type 'animo'
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
            canvasSession.title = 'Termómetro Psicosocial';
            canvasSession.fileType = 'animo';
            canvasSession.version = nextVersion;
            canvasSession.updatedAt = new Date();

            const newHistoryItem = {
              version: nextVersion,
              content: JSON.stringify(resultObj),
              title: 'Termómetro Psicosocial',
              fileType: 'animo',
              updatedAt: new Date()
            };
            canvasSession.history = [...(canvasSession.history || []), newHistoryItem].slice(-maxHistory);

            await canvasSession.save();
          } else {
            canvasSession = new CanvasSession({
              user: userId,
              conversationId,
              content: JSON.stringify(resultObj),
              title: 'Termómetro Psicosocial',
              fileType: 'animo',
              version: 1,
              companyId: company._id,
              history: [{
                version: 1,
                content: JSON.stringify(resultObj),
                title: 'Termómetro Psicosocial',
                fileType: 'animo',
                updatedAt: new Date()
              }]
            });
            await canvasSession.save();
          }
          console.log(`[ConsultarAnaliticaPsicosocial] Upserted CanvasSession for convoId: ${conversationId}`);
        }
      }

      return JSON.stringify(resultObj, null, 2);
    } catch (error) {
      console.error('[ConsultarAnaliticaPsicosocial Tool] Error:', error);
      return `❌ Error al consultar la analítica: ${error.message}`;
    }
  }
}

module.exports = ConsultarAnaliticaPsicosocial;
