const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');
const GTC45Matrix = require('~/models/GTC45WorkspaceSession');
const CompanyInfo = require('~/models/CompanyInfo');

class MatrizIPEVAR extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'matriz_ipevar';
    this.description =
      'Lee, añade, evalúa o actualiza riesgos laborales directamente en la Matriz GTC-45 de la conversación actual. Usa esta herramienta para leer, documentar o evaluar un peligro en la matriz IPEVAR/GTC-45.';
    this.req = fields.req;
    this.schema = z.object({
      accion: z.enum(['leer', 'escribir', 'borrar', 'consultar_contexto_sgsst']).describe('Usa consultar_contexto_sgsst para datos de la empresa, leer para consultar, escribir para guardar, borrar para eliminar.'),
      filtro_proceso: z.string().optional().describe('Filtro para leer, o cargo a buscar en el contexto sgsst.'),
      filtro_actividad: z.string().optional().describe('Filtro para leer.'),
      filtro_peligro: z.string().optional().describe('Filtro para leer.'),
      ids_a_borrar: z.array(z.string()).optional().describe('Arreglo de IDs de los riesgos que deseas eliminar. Solamente usado cuando accion="borrar".'),
      riesgos: z.array(z.object({
        proceso: z.string().describe('El proceso o área general.'),
        zona: z.string().describe('Lugar o zona de trabajo.'),
        actividad: z.string().describe('Actividad específica que realiza el trabajador.'),
        tareas: z.string().describe('Descripción de las tareas específicas.'),
        rutinaria: z.enum(['Sí', 'No']).describe('¿Es una tarea rutinaria?'),
        peligro_descripcion: z
          .string()
          .describe('Descripción del riesgo. CRÍTICO: Si el peligro_clasificacion es "Psicosocial", DEBES extraer y prefijar estrictamente el "Dominio" y la "Dimensión". Ej: "[Dominio: Demandas del trabajo - Dimensión: Carga mental] Descripción...". Para otros peligros, describe normalmente.'),
        peligro_clasificacion: z.string().describe('Clasificación (ej. Biomecánico, Físico, Químico).'),
        efectos_posibles: z.string().describe('Posibles efectos en la salud del trabajador.'),
        controles_fuente: z.string().default('Ninguno').describe('Controles existentes en la fuente. Detalla técnica y analíticamente su suficiencia.'),
        controles_medio: z.string().default('Ninguno').describe('Controles existentes en el medio. Detalla técnica y analíticamente.'),
        controles_individuo: z.string().default('Ninguno').describe('Controles existentes en el individuo. Detalla analíticamente.'),
        nd: z.number().describe('Nivel de Deficiencia (ND).'),
        ne: z.number().describe('Nivel de Exposición (NE).'),
        nc: z.number().describe('Nivel de Consecuencia (NC).'),
        medida_eliminacion: z.string().default('Ninguno').describe('Medidas: Eliminación. Sustenta técnicamente si aplica.'),
        medida_sustitucion: z.string().default('Ninguno').describe('Medidas: Sustitución. Sustenta técnicamente su viabilidad.'),
        medida_ingenieria: z.string().default('Ninguno').describe('Medidas: Controles de ingeniería. Especifica de forma detallada y técnica.'),
        medida_administrativa: z.string().default('Ninguno').describe('Medidas: Administrativos. Sustenta cómo impactarán la seguridad de forma sustancial.'),
        medida_eppu: z.string().default('Ninguno').describe('Medidas: EPP técnicos apropiados.'),
        factores_reduccion: z.string().default('No aplica').describe('Factores de reducción (Anexo E). CRÍTICO: No pongas solo un resumen, DEBES ser altamente analítico explicando extensamente por qué y cómo los controles propuestos reducirán el riesgo, sustentando la viabilidad técnica/financiera y la relación costo-beneficio del plan.'),
        nd_cualitativo: z.number().optional().describe('ND cualitativo (MA=10, A=6, M=2, B=0).'),
        nro_expuestos: z.number().default(1).describe('Número de trabajadores expuestos al peligro. Por defecto 1.'),
        peor_consecuencia: z.string().default('Ninguna').describe('Peor consecuencia posible si el peligro se materializa.'),
        requisito_legal: z.enum(['Sí', 'No', '']).default('').describe('¿Existe un requisito legal específico asociado al peligro? ("Sí", "No", o vacío).'),
      })).optional().describe('Lista de riesgos. OBLIGATORIO si accion="escribir". Vacío en otros casos.')
    });
  }

  /**
   * _call receives (input, runManager) where runManager carries LangGraph metadata.
   * FORENSIC FINDING (2026-03-31):
   *   - LangGraph always injects thread_id into runManager.metadata.thread_id
   *   - runManager.configurable also contains thread_id
   *   - config/3rd arg is NEVER passed by LangChain's DynamicStructuredTool wrapper
   *   - This is the only reliable way to get conversationId inside a tool _call
   */
  async _call(input, runManager) {
    try {
      // ✅ PRIMARY: LangGraph thread_id via runManager
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        const errorMsg = 'No se encontró un ID de conversación válido para guardar la matriz.';
        console.error(`[MatrizIPEVAR Tool] ${errorMsg}`);
        return JSON.stringify({ error: errorMsg });
      }

      const { accion, riesgos, filtro_proceso, filtro_actividad, filtro_peligro, ids_a_borrar } = input;

      // Obtener sesión
      const userId = this.req?.user?.id;
      let companyId = null;
      if (userId) {
        let active = await CompanyInfo.findOne({ user: userId, isActive: true });
        if (!active) active = await CompanyInfo.findOne({ user: userId });
        companyId = active ? active._id : null;
      }

      // Obtener sesión
      let session = await GTC45Matrix.findOne({ conversationId });
      if (session && !session.companyId && companyId) {
        session.companyId = companyId;
        await session.save();
        console.log(`[MatrizIPEVAR Tool] Populated missing companyId ${companyId} for session ${conversationId}`);
      }
      
      if (!session && userId && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
        const { Conversation } = require('~/db/models');
        const convo = await Conversation.findOne({ conversationId }, 'createdAt').lean();
        const isNewConvo = convo && convo.createdAt && (Date.now() - new Date(convo.createdAt).getTime() < 120000);

        if (isNewConvo) {
          const tempId = `temp-${userId}`;
          const tempSession = await GTC45Matrix.findOne({ conversationId: tempId, user: userId });
          if (tempSession) {
            tempSession.conversationId = conversationId;
            if (companyId) tempSession.companyId = companyId;
            await tempSession.save();
            session = tempSession;
            console.log(`[MatrizIPEVAR Tool] Migrated temporal matrix session for user ${userId} to conversation ${conversationId}`);
          }
        }
      }

      // LOGICA DE CONTEXTO SGSST EXTERNO
      if (accion === 'consultar_contexto_sgsst') {
         if (!userId) { return JSON.stringify({ error: 'No autenticado para acceder al contexto.' }); }
         console.log(`[MatrizIPEVAR Tool] CONTEXTO SGSST solicitado para convo: ${conversationId}`);
         
         const CompanyInfo = mongoose.models.CompanyInfo;
         const PerfilCargoModel = mongoose.models.PerfilCargoData;
         const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData;

         let payload = {};

         // Extraer Macro Empresa
         if (CompanyInfo) {
             const companyConf = await CompanyInfo.findOne({ user: userId }).lean();
             if (companyConf) {
                 payload.informacion_empresa = {
                     nombre: companyConf.companyName || 'N/A',
                     nit: companyConf.nit || 'N/A',
                     representante_legal: companyConf.legalRepresentative || 'N/A',
                     actividad_economica: companyConf.economicActivity || 'N/A',
                     codigo_ciiu: companyConf.ciiu || 'N/A',
                     sector: companyConf.sector || 'N/A',
                     descripcion_actividades: companyConf.generalActivities || 'N/A',
                     sedes_adicionales: companyConf.sedes || [],
                     nivel_riesgo: companyConf.riskLevel || 'N/A',
                     arl: companyConf.arl || 'N/A',
                     numero_trabajadores: companyConf.workerCount || 'N/A',
                     responsable_sst: companyConf.responsibleSST || 'N/A',
                     licencia_sst: companyConf.licenseNumber || 'N/A',
                     vencimiento_licencia: companyConf.licenseExpiry || 'N/A',
                     curso_50_20h: companyConf.courseStatus || 'N/A'
                 };
             }
         }

         // Extraer Cargos
         if (PerfilCargoModel) {
             const cargoDataDoc = await PerfilCargoModel.findOne({ user: userId }).lean();
             if (cargoDataDoc && cargoDataDoc.perfiles) {
                 // Si nos mandan filtro_proceso (ej. "soldador"), filtramos para no aglomerar el payload, sino devolvemos todo.
                 let perfiles = cargoDataDoc.perfiles;
                 if (filtro_proceso) {
                     perfiles = perfiles.filter(p => p.nombreCargo && p.nombreCargo.toLowerCase().includes(filtro_proceso.toLowerCase()));
                 }
                 payload.perfiles_cargo_encontrados = perfiles.map(p => ({
                     cargo: p.nombreCargo,
                     responsabilidadesSST: p.responsabilidadesSST || 'Ninguna definida',
                     epp_estricto: p.elementosProteccion || 'No documentado',
                     restricciones: p.restricciones || 'Ninguna'
                 }));
             }
         }

         // Extraer Salud y Vencimientos
         if (PerfilSocioModel) {
             const socioDataDoc = await PerfilSocioModel.findOne({ user: userId }).lean();
             if (socioDataDoc && socioDataDoc.trabajadores) {
                 let trabajadores = socioDataDoc.trabajadores;
                 if (filtro_proceso) {
                     trabajadores = trabajadores.filter(t => t.cargo && t.cargo.toLowerCase().includes(filtro_proceso.toLowerCase()));
                 }
                 payload.frecuencia_patologias_y_habitos = trabajadores.map(t => ({
                     cargo_del_trabajador: t.cargo,
                     diagnosticoOcupacional: t.diagnosticoMedico || '',
                     recomendaciones: t.recomendacionesMedicas || '',
                     limitacionesBiomecanicas: t.limitacionesBiomecanicas || '',
                     alergias: t.alergiasQuimicas || ''
                 }));
             }
         }

         return JSON.stringify({
            mensaje: "Contexto SGSST de la compañía recuperado exitosamente.",
            advertencia: "MEMORIZA ESTA INFORMACIÓN PARA INYECTAR CONTROLES (ej. LOS EPP o RESTRICCIONES documentados) AL ESCRIBIR TUS FILAS DE MATRIZ DE PELIGROS.",
            datos: payload
         });
      }

      // LOGICA DE LECTURA
      if (accion === 'leer') {
        console.log(`[MatrizIPEVAR Tool] LECTURA para convo: ${conversationId}`);
        if (!session || !session.matrixRows || session.matrixRows.length === 0) {
          return JSON.stringify({ mensaje: 'La matriz está vacía. No hay riesgos registrados aún.', resultados: [] });
        }
        
        let rows = session.matrixRows;
        if (filtro_proceso) {
          rows = rows.filter(r => r.proceso && r.proceso.toLowerCase().includes(filtro_proceso.toLowerCase()));
        }
        if (filtro_actividad) {
          rows = rows.filter(r => r.actividad && r.actividad.toLowerCase().includes(filtro_actividad.toLowerCase()));
        }
        if (filtro_peligro) {
          rows = rows.filter(r => r.peligro_clasificacion && r.peligro_clasificacion.toLowerCase().includes(filtro_peligro.toLowerCase()));
        }
        
        return JSON.stringify({
          mensaje: `Se encontraron ${rows.length} riesgos.`,
          totalRegistros: session.matrixRows.length,
          resultados: rows
        });
      }

      // LOGICA DE BORRADO
      if (accion === 'borrar') {
        if (!session || !session.matrixRows || session.matrixRows.length === 0) {
          return JSON.stringify({ error: 'La matriz está vacía. No hay riesgos para borrar.' });
        }
        if (!ids_a_borrar || !Array.isArray(ids_a_borrar) || ids_a_borrar.length === 0) {
          return JSON.stringify({ error: 'Debe proveer un arreglo "ids_a_borrar" con los IDs de los riesgos a eliminar.' });
        }
        const initialCount = session.matrixRows.length;
        session.matrixRows = session.matrixRows.filter(r => !ids_a_borrar.includes(r.id));
        const deletedCount = initialCount - session.matrixRows.length;
        
        session.markModified('matrixRows');
        await session.save();
        
        return JSON.stringify({
          mensaje: `Se eliminaron exitosamente ${deletedCount} riesgos de la base de datos.`,
          totalRegistrosRestantes: session.matrixRows.length
        });
      }

      // LOGICA DE ESCRITURA
      if (!riesgos || !Array.isArray(riesgos)) {
        return JSON.stringify({ error: "El objeto debe contener un array 'riesgos' para escribir." });
      }

      console.log(`[MatrizIPEVAR Tool] Procesando ${riesgos.length} riesgos para convo: ${conversationId}`);
      
      if (!session) {
        session = new GTC45Matrix({
          conversationId,
          user: userId || undefined,
          companyId: companyId || undefined,
          matrixRows: []
        });
      }

      let insertedCount = 0;
      let updatedCount = 0;

      for (const riesgo of riesgos) {
        // Autocalculate levels per GTC-45
        const nd = Number(riesgo.nd) || 0;
        const ne = Number(riesgo.ne) || 0;
        const np = nd * ne;
        const nc = Number(riesgo.nc) || 0;
        const nr = np * nc;

        let interpretacion_np = '';
        if (np >= 24) interpretacion_np = 'Muy Alto (MA)';
        else if (np >= 10) interpretacion_np = 'Alto (A)';
        else if (np >= 6) interpretacion_np = 'Medio (M)';
        else if (np >= 2) interpretacion_np = 'Bajo (B)';

        let interpretacion_nr = 'IV';
        if (nr >= 600) interpretacion_nr = 'I';
        else if (nr >= 150) interpretacion_nr = 'II';
        else if (nr >= 40) interpretacion_nr = 'III';

        let aceptabilidad = 'Aceptable';
        if (interpretacion_nr === 'I') aceptabilidad = 'No Aceptable';
        else if (interpretacion_nr === 'II') aceptabilidad = 'No Aceptable o Aceptable con Control Específico';
        else if (interpretacion_nr === 'III') aceptabilidad = 'Mejorable';

        const row = {
          ...riesgo,
          np,
          interpretacion_np,
          nc,
          nr,
          interpretacion_nr,
          aceptabilidad,
        };

        // Find existing row using a composite key
        const targetIndex = session.matrixRows.findIndex(r => 
          r.proceso?.toLowerCase() === riesgo.proceso?.toLowerCase() &&
          r.actividad?.toLowerCase() === riesgo.actividad?.toLowerCase() &&
          r.tareas?.toLowerCase() === riesgo.tareas?.toLowerCase() &&
          r.peligro_clasificacion?.toLowerCase() === riesgo.peligro_clasificacion?.toLowerCase() &&
          r.peligro_descripcion?.toLowerCase() === riesgo.peligro_descripcion?.toLowerCase()
        );

        if (targetIndex !== -1) {
          // UPDATE
          session.matrixRows[targetIndex] = { ...session.matrixRows[targetIndex], ...row };
          updatedCount++;
        } else {
          // INSERT NEW
          // Asegurar IDs únicos por fila
          row.id = Date.now().toString() + Math.random().toString(36).substring(7);
          session.matrixRows.push(row);
          insertedCount++;
        }
      }

      // Ensure user inheritance for orphaned sessions during upsert
      if (!session.user && userId) {
        session.user = userId;
      }
      if (!session.companyId && companyId) {
        session.companyId = companyId;
      }
      
      // Mongoose needs this flag if we modify mixed Arrays manually
      session.markModified('matrixRows');
      await session.save();

      console.log(`[MatrizIPEVAR Tool] Transacción Masiva Exitosa. Insertados: ${insertedCount}, Actualizados: ${updatedCount}`);

      return JSON.stringify({
        success: true,
        message: `Operación masiva completada satisfactoriamente. Se procesaron ${riesgos.length} riesgos.`,
        stats: { insertados: insertedCount, actualizados: updatedCount }
      });
    } catch (error) {
      console.error('[MatrizIPEVAR Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error procesando el arreglo de riesgos masivos.',
        details: error.message,
      });
    }
  }
}

module.exports = MatrizIPEVAR;
