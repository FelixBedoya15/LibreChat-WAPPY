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
        proceso: z.string().describe('El proceso o área general.'),
        zona: z.string().describe('Lugar o zona de trabajo / trayecto.'),
        actor_vial: z.string().describe('Actor vial (Peatón, Pasajero, Conductor de motocicleta, Conductor de vehículo liviano, Conductor de vehículo pesado, Ciclista, etc.).'),
        tipo_desplazamiento: z.enum(['Misional', 'In itinere']).describe('Tipo de desplazamiento.'),
        factor_riesgo: z.enum(['Factor Humano', 'Factor Vehicular', 'Factor Infraestructura', 'Entorno/Otros']).describe('Factor de riesgo vial analizado.'),
        peligro_descripcion: z.string().describe('Descripción del riesgo vial (ej. exceso de velocidad, microsueños, frenos desgastados, lluvia, etc.).'),
        consecuencias: z.string().describe('Posibles efectos, lesiones o consecuencias en la salud.'),
        controles_existentes_persona: z.string().default('Ninguno').describe('Controles en la persona.'),
        controles_existentes_vehiculo: z.string().default('Ninguno').describe('Controles en el vehículo.'),
        controles_existentes_via: z.string().default('Ninguno').describe('Controles en la vía / entorno.'),
        probabilidad: z.number().describe('Nivel de Probabilidad (1 a 4).'),
        severidad: z.number().describe('Nivel de Consecuencia/Severidad (10, 25, 60 o 100).'),
        medida_eliminacion: z.string().default('Ninguno').describe('Medidas: Eliminación.'),
        medida_sustitucion: z.string().default('Ninguno').describe('Medidas: Sustitución.'),
        medida_ingenieria: z.string().default('Ninguno').describe('Medidas: Controles de ingeniería.'),
        medida_administrativa: z.string().default('Ninguno').describe('Medidas: Administrativos.'),
        medida_eppu: z.string().default('Ninguno').describe('Medidas: EPP técnicos y seguridad pasiva.'),
        factores_reduccion: z.string().default('No aplica').describe('Explicación detallada de cómo reducirá el riesgo la intervención y su relación costo-beneficio.'),
        responsable: z.string().default('Ninguno').describe('Cargo responsable de la implementación de los controles.'),
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
        const tempId = `temp-${userId}`;
        const tempSession = await PESVMatrix.findOne({ conversationId: tempId, user: userId });
        if (tempSession) {
          tempSession.conversationId = conversationId;
          if (companyId) tempSession.companyId = companyId;
          await tempSession.save();
          session = tempSession;
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
          rows = rows.filter(r => r.proceso && r.proceso.toLowerCase().includes(filtro_proceso.toLowerCase()));
        }
        if (filtro_actor_vial) {
          rows = rows.filter(r => r.actor_vial && r.actor_vial.toLowerCase().includes(filtro_actor_vial.toLowerCase()));
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

      for (const riesgo of riesgos) {
        // Calificación de riesgo PESV: Probabilidad * Severidad
        const probabilidad = Number(riesgo.probabilidad) || 0;
        const severidad = Number(riesgo.severidad) || 0;
        const nivel_riesgo = probabilidad * severidad;

        // Interpretación simplificada del nivel de riesgo vial
        let interpretacion_nr = 'Bajo';
        let aceptabilidad = 'Aceptable';
        
        if (nivel_riesgo >= 200) {
          interpretacion_nr = 'Crítico';
          aceptabilidad = 'No Aceptable';
        } else if (nivel_riesgo >= 100) {
          interpretacion_nr = 'Alto';
          aceptabilidad = 'No Aceptable o Aceptable con Control Específico';
        } else if (nivel_riesgo >= 40) {
          interpretacion_nr = 'Medio';
          aceptabilidad = 'Aceptable con Control Específico';
        }

        const row = {
          ...riesgo,
          nivel_riesgo,
          interpretacion_nr,
          aceptabilidad,
        };

        // Búsqueda por clave compuesta para actualización o inserción
        const targetIndex = session.matrixRows.findIndex(r => 
          r.proceso?.toLowerCase() === riesgo.proceso?.toLowerCase() &&
          r.actor_vial?.toLowerCase() === riesgo.actor_vial?.toLowerCase() &&
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
