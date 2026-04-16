const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');

/**
 * SomosSST Tool
 * Permite al agente interactuar con los hitos de la Ruta del Bienestar Integral
 * (Perfil Sociodemográfico, Salud, Cargos, Matriz IPEVAR).
 */
class SomosSST extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'somos_sst';
    this.description =
      'Consulta el expediente integral de uno o varios trabajadores incluyendo su perfil sociodemográfico, información de salud clínica, EPP normativo de su cargo, y los peligros/riesgos específicos a los que está expuesto según la Matriz IPEVAR (GTC-45).';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['consultar_expediente_integral', 'listar_trabajadores', 'resumen_empresa'])
        .describe(
          'La acción a ejecutar. "consultar_expediente_integral" para buscar información profunda a cruzar de un trabajador; "listar_trabajadores" para ver quiénes están registrados; "resumen_empresa" para estadísticas generales.',
        ),
      nombre_o_cargo: z
        .string()
        .optional()
        .describe(
          'Nombre, apellido, cédula, ID, o Nombre del Cargo del trabajador a consultar. Requerido para consultar_expediente_integral.',
        ),
    });
  }

  async _call(input) {
    try {
      const userId = this.req?.user?.id;
      if (!userId) {
        return JSON.stringify({ error: 'Usuario no autenticado para acceder a la base de datos de SomosSST.' });
      }

      // Safe access to schemas
      const PerfilSocioModel = mongoose.models.PerfilSociodemograficoData;
      const PerfilCargoModel = mongoose.models.PerfilCargoData;
      const MatrizPeligrosModel = mongoose.models.MatrizPeligrosData;

      if (!PerfilSocioModel) {
        return JSON.stringify({ error: 'Error interno: El modelo PerfilSociodemograficoData no está cargado en el ecosistema.' });
      }

      const { accion, nombre_o_cargo } = input;

      const socioData = await PerfilSocioModel.findOne({ user: userId });
      
      // ── LISTAR TRABAJADORES ───────────────────────────────────────────
      if (accion === 'listar_trabajadores') {
        if (!socioData || !socioData.trabajadores || socioData.trabajadores.length === 0) {
          return JSON.stringify({ mensaje: 'No hay trabajadores registrados en la base de datos.' });
        }
        const lista = socioData.trabajadores.map(t => ({
          nombre: t.nombre,
          id: t.id,
          cargo: t.cargo,
          diagnostico: t.diagnosticoMedico || 'No registrado'
        }));
        return JSON.stringify({
          mensaje: `Se encontraron ${lista.length} trabajadores.`,
          trabajadores: lista
        });
      }

      // ── CONSULTAR EXPEDIENTE INTEGRAL (CRUCE CASCADA) ─────────────────
      if (accion === 'consultar_expediente_integral') {
        if (!nombre_o_cargo) {
          return JSON.stringify({ error: 'Debes proporcionar un nombre_o_cargo para buscar el expediente.' });
        }

        if (!socioData || !socioData.trabajadores) {
          return JSON.stringify({ error: 'No se encontraron registros de trabajadores para analizar.' });
        }

        const query = nombre_o_cargo.toLowerCase();
        
        // Find matching workers
        const workers = socioData.trabajadores.filter(w =>
          (w.nombre && w.nombre.toLowerCase().includes(query)) ||
          (w.identificacion && String(w.identificacion).includes(query)) ||
          (w.cargo && w.cargo.toLowerCase().includes(query))
        );

        if (workers.length === 0) {
          return JSON.stringify({ error: `No se encontró ningún trabajador o cargo coincidente con: "${nombre_o_cargo}".` });
        }

        // We process up to 3 matches to avoid massive context overflow
        const results = [];
        for (const worker of workers.slice(0, 3)) {
          let workerPayload = {
            perfil_sociodemografico_y_salud: worker,
            perfil_del_cargo: null,
            matriz_peligros_asociados: []
          };

          // 1. Fetch Job Profile requirements if Cargo exists
          let matchedCargoStr = 'Sin cargo';
          if (worker.cargo && PerfilCargoModel) {
             const cargoDataDoc = await PerfilCargoModel.findOne({ user: userId });
             if (cargoDataDoc && cargoDataDoc.perfiles) {
                 const bestProfileMatch = cargoDataDoc.perfiles.find(p => p.nombreCargo && p.nombreCargo.toLowerCase().trim() === worker.cargo.toLowerCase().trim());
                 if (bestProfileMatch) {
                     workerPayload.perfil_del_cargo = {
                         descripcion: bestProfileMatch.descripcion,
                         educacion: bestProfileMatch.educacion,
                         experiencia: bestProfileMatch.experiencia,
                         responsabilidadesSST: bestProfileMatch.responsabilidadesSST,
                         restricciones: bestProfileMatch.restricciones,
                         examenesMedicos: bestProfileMatch.examenesMedicos,
                         elementosProteccion: bestProfileMatch.elementosProteccion
                     };
                     matchedCargoStr = bestProfileMatch.nombreCargo;
                 } else {
                     matchedCargoStr = worker.cargo;
                 }
             }
          }

          // 2. Fetch IPEVAR Matrix Hazards matching the Job Process/Activity
          if (matchedCargoStr !== 'Sin cargo' && MatrizPeligrosModel) {
              const matrizDataDoc = await MatrizPeligrosModel.findOne({ user: userId });
              if (matrizDataDoc && matrizDataDoc.procesos) {
                  // Find Matrix rows where process or activity resembles the Cargo string
                  // Users often map 'cargo' to 'proceso' or 'actividad'
                  const cargoLower = matchedCargoStr.toLowerCase();
                  const relatedHazards = matrizDataDoc.procesos.filter(p => 
                      (p.proceso && p.proceso.toLowerCase().includes(cargoLower)) ||
                      (p.actividad && p.actividad.toLowerCase().includes(cargoLower)) ||
                      (p.zonas && p.zonas.toLowerCase().includes(cargoLower))
                  );

                  // Extract exact requested fields safely
                  workerPayload.matriz_peligros_asociados = relatedHazards.map(h => ({
                      proceso_actividad: `${h.proceso || ''} - ${h.actividad || ''}`,
                      tarea: h.tareas || h.tarea || '',
                      peligro_descripcion: h.peligro_descripcion || h.peligro || '',
                      peligro_clasificacion: h.peligro_clasificacion || '',
                      efectos_posibles: h.efectos_posibles || '',
                      // **Controles Existentes**
                      controles_existentes: {
                        fuente: h.controles_fuente || 'Ninguno',
                        medio: h.controles_medio || 'Ninguno',
                        individuo: h.controles_individuo || 'Ninguno'
                      },
                      // **Intervención y Riesgo Valorados**
                      riesgo_valoracion: {
                        ND: h.nd || 0,
                        NE: h.ne || 0,
                        NP: h.np || 0,
                        NC: h.nc || 0,
                        NR: h.nr || 0,
                        interpretacion_nr: h.interpretacion_nr || '',
                        aceptabilidad: h.aceptabilidad || ''
                      },
                      // **Factores Reducción (Anexo E)**
                      factores_reduccion: h.factores_reduccion || 'No aplica',
                      // **Controles Propuestos (Medidas de Intervención)**
                      controles_propuestos: {
                        eliminacion: h.medida_eliminacion || 'Ninguno',
                        sustitucion: h.medida_sustitucion || 'Ninguno',
                        control_ingenieria: h.medida_ingenieria || 'Ninguno',
                        control_administrativo: h.medida_administrativa || 'Ninguno',
                        equipos_epp: h.medida_eppu || 'Ninguno'
                      }
                  }));
              }
          }

          results.push(workerPayload);
        }

        return JSON.stringify({
          mensaje: `Se procesaron ${results.length} expediente(s) exitosamente realizando cruce de variables sociodemográficas, clínicas, perfil del requerimiento de cargo y mapeo de IPEVAR en cascada.`,
          expedientes: results
        });
      }
      
      // ── RESUMEN EMPRESA ───────────────────────────────────────────────
      if (accion === 'resumen_empresa') {
        const total = socioData?.trabajadores?.length || 0;
        let examenesVencidosCount = 0;
        const currentDate = new Date();
        (socioData?.trabajadores || []).forEach(w => {
            if (w.fechaExamenMedico) {
                try {
                  const diffTime = Math.abs(currentDate - new Date(w.fechaExamenMedico));
                  if (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) >= 300) { examenesVencidosCount++; }
                } catch(e) {}
            } else {
                examenesVencidosCount++;
            }
        });

        return JSON.stringify({
            total_trabajadores: total,
            alertas_medicas_vencidas_o_ausentes: examenesVencidosCount,
            estado_coleccion: 'Disponible'
        });
      }

      return JSON.stringify({ error: `Acción desconocida: "${accion}".` });

    } catch (error) {
      console.error('[SomosSST Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error cruzando los expedientes de la Ruta del Bienestar Integral SomosSST.',
        details: error.message,
      });
    }
  }
}

module.exports = SomosSST;
