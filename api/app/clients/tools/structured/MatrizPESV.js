const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');
const PESVMatrix = require('~/models/PESVWorkspaceSession');
const CompanyInfo = require('~/models/CompanyInfo');

class MatrizPESV extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'matriz_pesv';
    this.description =
      'Lee, añade, evalúa o actualiza riesgos viales directamente en la Matriz PESV de la conversación actual. Usa esta herramienta para leer, documentar o evaluar un peligro vial según el Plan Estratégico de Seguridad Vial.';
    this.req = fields.req;
    this.schema = z.object({
      accion: z.enum(['leer', 'escribir', 'borrar', 'consultar_contexto_sgsst']).describe('Usa consultar_contexto_sgsst para datos de la empresa, leer para consultar, escribir para guardar, borrar para eliminar.'),
      filtro_proceso: z.string().optional().describe('Filtro para leer, o cargo a buscar en el contexto sgsst.'),
      filtro_actor_vial: z.string().optional().describe('Filtro por actor vial (ej: peatón, conductor).'),
      filtro_peligro: z.string().optional().describe('Filtro para leer.'),
      ids_a_borrar: z.array(z.string()).optional().describe('Arreglo de IDs de los riesgos que deseas eliminar. Solamente usado cuando accion="borrar".'),
      riesgos: z.array(z.object({
        grupo_trabajo: z.string().describe('Clasificación Grupos de trabajo (ej. OPERATIVO, ADMINISTRATIVO).'),
        cargo: z.string().describe('Cargo individual del trabajador.'),
        tipo_desplazamiento: z.string().describe('Tipo de desplazamiento ("Misional" o "In itinere").'),
        rol_via: z.string().describe('Rol en la vía (Conductor de vehículo pesado, Conductor de vehículo liviano, Conductor de motocicleta, Peatón, Pasajero, Ciclista, Otro).'),
        factor_riesgo: z.string().describe('Factor de riesgo (Factor Humano, Factor Vehicular, Factor Infraestructura, Entorno/Otros).'),
        peligro_descripcion: z.string().describe('Descripción del peligro o riesgo vial analizado.'),
        np_cualitativo: z.string().describe('Nivel de Probabilidad cualitativo: "MUY PROBABLE", "MEDIANAMENTE PROBABLE", "PROBABLE", "POCO PROBABLE" o "NO ES PROBABLE".'),
        ne_cualitativo: z.string().describe('Nivel de Exposición cualitativo: "CONSTANTE", "FRECUENTE", "OCASIONAL", "ESPORADICO" o "MINIMA".'),
        nc_cualitativo: z.string().describe('Nivel de Consecuencia cualitativo: "CRITICO", "PELIGROSO", "MODERADO", "MARGINAL" o "INSIGNIFICANTE".'),
        controles_existentes_descripcion: z.string().default('Ninguno').describe('Interpretación o descripción de los controles existentes.'),
        controles_existentes_tipo: z.string().default('Ninguno').describe('Tipo de control (INDIVIDUO, MEDIO, MEDIO-INDIVIDUO, VEHICULO, INFRAESTRUCTURA).'),
        tratamiento_accion: z.string().default('Ninguno').describe('Acción de tratamiento (ACEPTARLO, EVITARLO, ELIMINAR LA FUENTE QUE OCACIONA, MODIFICAR LOS FACTORES DE EXPOSICION).'),
        plan_accion_medio: z.string().default('Ninguno').describe('Planes propuestos para el medio.'),
        plan_accion_individuo: z.string().default('Ninguno').describe('Planes propuestos para el individuo.'),
        responsable: z.string().default('Responsable PESV').describe('Cargo responsable del control.'),
        fecha_programacion: z.string().default('Permanente').describe('Fecha o frecuencia de programación.'),
        estado: z.string().default('PLANEADA').describe('Estado de la tarea ("PLANEADA" o "CERRADA").'),
        observaciones: z.string().default('').describe('Observaciones adicionales.')
      })).optional().describe('Lista de riesgos viales. OBLIGATORIO si accion="escribir". Vacío en otros casos.')
    });
  }

  async _call(input, runManager) {
    try {
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        const errorMsg = 'No se encontró un ID de conversación válido para guardar la matriz PESV.';
        console.error(`[MatrizPESV Tool] ${errorMsg}`);
        return JSON.stringify({ error: errorMsg });
      }

      const { accion, riesgos, filtro_proceso, filtro_actor_vial, filtro_peligro, ids_a_borrar } = input;

      const userId = this.req?.user?.id;
      let companyId = null;
      if (userId) {
        let active = await CompanyInfo.findOne({ user: userId, isActive: true });
        if (!active) active = await CompanyInfo.findOne({ user: userId });
        companyId = active ? active._id : null;
      }

      let session = await PESVMatrix.findOne({ conversationId });
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
          const tempSession = await PESVMatrix.findOne({ conversationId: tempId, user: userId });
          if (tempSession) {
            tempSession.conversationId = conversationId;
            if (companyId) tempSession.companyId = companyId;
            await tempSession.save();
            session = tempSession;
          }
        }
      }

      if (accion === 'consultar_contexto_sgsst') {
         if (!userId) { return JSON.stringify({ error: 'No autenticado para acceder al contexto.' }); }
         
         const PerfilCargoModel = mongoose.models.PerfilCargoData;
         const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData;

         let payload = {};

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
                     numero_trabajadores: companyConf.workerCount || 'N/A',
                     responsable_sst: companyConf.responsibleSST || 'N/A'
                 };
             }
         }

         if (PerfilCargoModel) {
             const cargoDataDoc = await PerfilCargoModel.findOne({ user: userId }).lean();
             if (cargoDataDoc && cargoDataDoc.perfiles) {
                 let perfiles = cargoDataDoc.perfiles;
                 if (filtro_proceso) {
                     perfiles = perfiles.filter(p => p.nombreCargo && p.nombreCargo.toLowerCase().includes(filtro_proceso.toLowerCase()));
                 }
                 payload.perfiles_cargo_encontrados = perfiles.map(p => ({
                     cargo: p.nombreCargo,
                     responsabilidadesSST: p.responsabilidadesSST || 'Ninguna definida',
                     epp_estricto: p.elementosProteccion || 'No documentado'
                 }));
             }
         }

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
                     limitacionesBiomecanicas: t.limitacionesBiomecanicas || ''
                 }));
             }
         }

         return JSON.stringify({
            mensaje: "Contexto SGSST de la compañía recuperado exitosamente para la matriz PESV.",
            advertencia: "MEMORIZA ESTA INFORMACIÓN PARA EVALUAR CONDUCTORES, VEHÍCULOS Y CONTROLES VIALES AL ESCRIBIR TUS FILAS.",
            datos: payload
         });
      }

      if (accion === 'leer') {
        if (!session || !session.matrixRows || session.matrixRows.length === 0) {
          return JSON.stringify({ mensaje: 'La matriz PESV está vacía. No hay riesgos viales registrados aún.', resultados: [] });
        }
        
        let rows = session.matrixRows;
        if (filtro_proceso) {
          rows = rows.filter(r => 
            (r.grupo_trabajo && r.grupo_trabajo.toLowerCase().includes(filtro_proceso.toLowerCase())) ||
            (r.cargo && r.cargo.toLowerCase().includes(filtro_proceso.toLowerCase()))
          );
        }
        if (filtro_actor_vial) {
          rows = rows.filter(r => r.rol_via && r.rol_via.toLowerCase().includes(filtro_actor_vial.toLowerCase()));
        }
        if (filtro_peligro) {
          rows = rows.filter(r => r.peligro_descripcion && r.peligro_descripcion.toLowerCase().includes(filtro_peligro.toLowerCase()));
        }
        
        return JSON.stringify({
          mensaje: `Se encontraron ${rows.length} riesgos viales en el PESV.`,
          totalRegistros: session.matrixRows.length,
          resultados: rows
        });
      }

      if (accion === 'borrar') {
        if (!session || !session.matrixRows || session.matrixRows.length === 0) {
          return JSON.stringify({ error: 'La matriz PESV está vacía. No hay riesgos para borrar.' });
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
          mensaje: `Se eliminaron exitosamente ${deletedCount} riesgos viales de la base de datos PESV.`,
          totalRegistrosRestantes: session.matrixRows.length
        });
      }

      if (!riesgos || !Array.isArray(riesgos)) {
        return JSON.stringify({ error: "El objeto debe contener un array 'riesgos' para escribir." });
      }

      if (!session) {
        session = new PESVMatrix({
          conversationId,
          user: userId || undefined,
          companyId: companyId || undefined,
          matrixRows: []
        });
      }

      let insertedCount = 0;
      let updatedCount = 0;

      const mapNP = (lbl) => {
        const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (norm.includes('MUY PROBABLE')) return 5;
        if (norm.includes('MEDIANAMENTE') || norm.includes('MEDIA')) return 4;
        if (norm.includes('POCO PROBABLE')) return 2;
        if (norm.includes('NO ES PROBABLE') || norm.includes('NO PROBABLE')) return 1;
        if (norm.includes('PROBABLE')) return 3;
        return 3;
      };

      const mapNE = (lbl) => {
        const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (norm.includes('CONSTANTE')) return 5;
        if (norm.includes('FRECUENTE')) return 4;
        if (norm.includes('OCASIONAL')) return 3;
        if (norm.includes('ESPORADICO')) return 2;
        if (norm.includes('MINIMA')) return 1;
        return 3;
      };

      const mapNC = (lbl) => {
        const norm = String(lbl || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (norm.includes('CRITICO')) return 5;
        if (norm.includes('PELIGROSO')) return 4;
        if (norm.includes('MODERADO')) return 3;
        if (norm.includes('MARGINAL')) return 2;
        if (norm.includes('INSIGNIFICANTE')) return 1;
        return 3;
      };

      const getNPLabel = (val) => {
        if (val === 5) return 'MUY PROBABLE';
        if (val === 4) return 'MEDIANAMENTE PROBABLE';
        if (val === 2) return 'POCO PROBABLE';
        if (val === 1) return 'NO ES PROBABLE';
        return 'PROBABLE';
      };

      const getNELabel = (val) => {
        if (val === 5) return 'CONSTANTE';
        if (val === 4) return 'FRECUENTE';
        if (val === 2) return 'ESPORADICO';
        if (val === 1) return 'MINIMA';
        return 'OCASIONAL';
      };

      const getNCLabel = (val) => {
        if (val === 5) return 'CRITICO';
        if (val === 4) return 'PELIGROSO';
        if (val === 2) return 'MARGINAL';
        if (val === 1) return 'INSIGNIFICANTE';
        return 'MODERADO';
      };

      for (const riesgo of riesgos) {
        // Calificación de riesgo vial (Suma de Probabilidad + Exposición + Consecuencia)
        const np_cuantitativo = Number(riesgo.np_cuantitativo) || mapNP(riesgo.np_cualitativo);
        const ne_cuantitativo = Number(riesgo.ne_cuantitativo) || mapNE(riesgo.ne_cualitativo);
        const nc_cuantitativo = Number(riesgo.nc_cuantitativo) || mapNC(riesgo.nc_cualitativo);
        const calificacion = np_cuantitativo + ne_cuantitativo + nc_cuantitativo;

        let nivel_riesgo = 'NIVEL DE RIESGO BAJO';
        let aceptabilidad = 'ACEPTABLE';
        
        if (calificacion >= 12) {
          nivel_riesgo = 'NIVEL DE RIESGO ALTO o CRITICO';
          aceptabilidad = 'NO ACEPTABLE';
        } else if (calificacion >= 8) {
          nivel_riesgo = 'NIVEL DE RIESGO MEDIO o MODERADO';
          aceptabilidad = 'ACEPTABLE CON CONTROL ESPECIFICO';
        }

        const row = {
          ...riesgo,
          np_cuantitativo,
          ne_cuantitativo,
          nc_cuantitativo,
          np_cualitativo: getNPLabel(np_cuantitativo),
          ne_cualitativo: getNELabel(ne_cuantitativo),
          nc_cualitativo: getNCLabel(nc_cuantitativo),
          calificacion,
          nivel_riesgo,
          aceptabilidad,
        };

        // Búsqueda por clave compuesta para actualización o inserción
        const targetIndex = session.matrixRows.findIndex(r => 
          r.grupo_trabajo?.toLowerCase() === riesgo.grupo_trabajo?.toLowerCase() &&
          r.cargo?.toLowerCase() === riesgo.cargo?.toLowerCase() &&
          r.peligro_descripcion?.toLowerCase() === riesgo.peligro_descripcion?.toLowerCase()
        );

        if (targetIndex !== -1) {
          session.matrixRows[targetIndex] = { ...session.matrixRows[targetIndex], ...row };
          updatedCount++;
        } else {
          row.id = Date.now().toString() + Math.random().toString(36).substring(7);
          session.matrixRows.push(row);
          insertedCount++;
        }
      }

      if (!session.user && userId) {
        session.user = userId;
      }
      if (!session.companyId && companyId) {
        session.companyId = companyId;
      }
      
      session.markModified('matrixRows');
      await session.save();

      // Clean up temporary session if this is a real conversation
      if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
        const tempId = `temp-${userId}`;
        await mongoose.models.PESVWorkspaceSession.deleteOne({ conversationId: tempId, user: userId });
        console.log(`[MatrizPESV Tool] Cleaned up temporary session for user ${userId}`);
      }

      return JSON.stringify({
        success: true,
        message: `Operación masiva PESV completada. Se procesaron ${riesgos.length} riesgos viales.`,
        stats: { insertados: insertedCount, actualizados: updatedCount }
      });
    } catch (error) {
      console.error('[MatrizPESV Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error procesando el arreglo de riesgos viales.',
        details: error.message,
      });
    }
  }
}

module.exports = MatrizPESV;
