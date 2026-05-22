const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');

/**
 * SomosSST Tool
 * Permite al agente interactuar de manera integral con los 5 Hitos del
 * MÓDULO PRINCIPAL MOTOR BIO-INDIVIDUAL de SomosSST.
 */
class SomosSST extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'somos_sst';
    this.description =
      'Consulta el expediente integral de uno o varios trabajadores (sociodemográfico, clínico, cargos, IPEVAR, capacitaciones, OWAS, ATS, alturas, e investigaciones ATEL) o estadísticas del dashboard general de la empresa bajo los 5 Hitos del Motor Bio-Individual.';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['consultar_expediente_integral', 'listar_trabajadores', 'resumen_empresa'])
        .describe(
          'La acción a ejecutar. "consultar_expediente_integral" para buscar información profunda cruzada de un trabajador; "listar_trabajadores" para ver quiénes están registrados; "resumen_empresa" para estadísticas generales de los 5 Hitos.',
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

      // Dynamic model load helper to ensure models are registered in mongoose
      const modelLoader = (name, path) => {
        if (!mongoose.models[name]) {
          try {
            require(path);
          } catch (e) {
            console.warn(`[SomosSST Tool] Failed to load model ${name} from ${path}:`, e.message);
          }
        }
        return mongoose.models[name];
      };

      // Load 10 Motor Bio-Individual models and CompanyInfo
      const SgsstWorkerModel = modelLoader('SgsstWorker', '~/models/SgsstWorker');
      const PerfilSocioModel = modelLoader('PerfilSociodemograficoData', '~/server/routes/sgsst/perfilSociodemografico');
      const PerfilCargoModel = modelLoader('PerfilCargoData', '~/server/routes/sgsst/perfilesCargo');
      const MatrizPeligrosModel = modelLoader('MatrizPeligrosData', '~/server/routes/sgsst/matrizPeligros');
      const ProgramaCapacitacionesModel = modelLoader('ProgramaCapacitacionesData', '~/server/routes/sgsst/programaCapacitaciones');
      const ParticipacionIpevarModel = modelLoader('ParticipacionIpevarData', '~/server/routes/sgsst/participacionIpevar');
      const AnalisisTrabajoSeguroModel = modelLoader('AnalisisTrabajoSeguroData', '~/server/routes/sgsst/analisisTrabajoSeguro');
      const MetodoOwasModel = modelLoader('MetodoOwasData', '~/server/routes/sgsst/metodoOwas');
      const PermisoAlturasModel = modelLoader('PermisoAlturasData', '~/server/routes/sgsst/permisoAlturas');
      const ATELAnnualModel = modelLoader('ATELAnnualData', '~/server/routes/sgsst/atel-data');
      const InvestigacionAtelModel = modelLoader('InvestigacionAtelData', '~/models/InvestigacionAtelData');
      const ReporteActosModel = modelLoader('ReporteActosData', '~/server/routes/sgsst/reporteActos');
      const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');

      // Helper to obtain the active company id
      const getActiveCompanyId = async (uid) => {
        let active = await CompanyInfo.findOne({ user: uid, isActive: true });
        if (!active) active = await CompanyInfo.findOne({ user: uid });
        return active ? active._id : null;
      };

      const companyId = await getActiveCompanyId(userId);
      const { accion, nombre_o_cargo } = input;

      // Enforce strict active company filter to keep only current valid data and avoid mistakes
      const buildQueryObj = (uid) => {
        return { user: uid, companyId };
      };

      const queryObj = buildQueryObj(userId);
      const socioData = PerfilSocioModel ? await PerfilSocioModel.findOne(queryObj) : null;

      // ── ACTION: LISTAR TRABAJADORES ───────────────────────────────────────────
      if (accion === 'listar_trabajadores') {
        const currentDate = new Date();
        const listaMap = new Map();

        // 1. Load from PerfilSociodemograficoData (SocioData)
        if (socioData && socioData.trabajadores) {
          for (const t of socioData.trabajadores) {
            const cleanId = String(t.identificacion || '').trim();
            if (!cleanId) continue;

            let hasMedicalAlert = false;
            if (t.fechaExamenMedico) {
              try {
                const diffTime = Math.abs(currentDate - new Date(t.fechaExamenMedico));
                if (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) >= 300) {
                  hasMedicalAlert = true;
                }
              } catch (e) {}
            } else {
              hasMedicalAlert = true;
            }

            listaMap.set(cleanId, {
              nombre: t.nombre,
              identificacion: cleanId,
              cargo: t.cargo || 'Sin cargo',
              diagnostico: t.diagnosticoMedico || 'No registrado',
              fitScore: t.biocentricScore || 0,
              fitAlerts: t.biocentricAlerts || [],
              alertas: {
                examen_medico_vencido: hasMedicalAlert,
                accidente_registrado: false
              }
            });
          }
        }

        // 2. Supplement with SgsstWorker master profiles (Oráculo Predictivo H1 details)
        if (SgsstWorkerModel) {
          const masterWorkers = await SgsstWorkerModel.find(queryObj).lean();
          for (const w of masterWorkers) {
            const cleanId = String(w.documento || '').trim();
            if (!cleanId) continue;

            let existing = listaMap.get(cleanId);
            if (!existing) {
              existing = {
                nombre: w.nombre,
                identificacion: cleanId,
                cargo: w.perfilId || 'Sin cargo',
                diagnostico: w.condicionesSalud || 'No registrado',
                alertas: {
                  examen_medico_vencido: true,
                  accidente_registrado: false
                }
              };
            }

            // Sync Oráculo Predictivo values
            existing.fitScore = w.fitScore || w.biocentricScore || existing.fitScore || 0;
            existing.fitAlerts = w.fitAlerts || w.biocentricAlerts || existing.fitAlerts || [];
            if (w.condicionesSalud) existing.diagnostico = w.condicionesSalud;
            if (w.atel && w.atel.length > 0) existing.alertas.accidente_registrado = true;

            listaMap.set(cleanId, existing);
          }
        }

        // 3. Mark accident records from Investigaciones
        if (InvestigacionAtelModel) {
          const allAccidents = await InvestigacionAtelModel.find(queryObj).lean();
          allAccidents.forEach(acc => {
            if (acc.formData?.afectadoCedula) {
              const doc = String(acc.formData.afectadoCedula).trim();
              const existing = listaMap.get(doc);
              if (existing) {
                existing.alertas.accidente_registrado = true;
              }
            }
          });
        }

        const trabajadores = Array.from(listaMap.values());
        if (trabajadores.length === 0) {
          return JSON.stringify({ mensaje: 'No hay trabajadores registrados en la base de datos (Huella Biocéntrica).' });
        }

        return JSON.stringify({
          mensaje: `Se encontraron ${trabajadores.length} trabajadores registrados en el Motor Bio-Individual.`,
          trabajadores: trabajadores
        });
      }

      // ── ACTION: CONSULTAR EXPEDIENTE INTEGRAL (CRUCE CASCADA MULTIVARIABLE) ──
      if (accion === 'consultar_expediente_integral') {
        if (!nombre_o_cargo) {
          return JSON.stringify({ error: 'Debes proporcionar un nombre_o_cargo para buscar el expediente.' });
        }

        const query = nombre_o_cargo.toLowerCase();
        const listaMap = new Map();

        // 1. Gather all potential workers from PerfilSocio
        if (socioData && socioData.trabajadores) {
          const matched = socioData.trabajadores.filter(w =>
            (w.nombre && w.nombre.toLowerCase().includes(query)) ||
            (w.identificacion && String(w.identificacion).includes(query)) ||
            (w.cargo && w.cargo.toLowerCase().includes(query))
          );
          matched.forEach(w => {
            const cleanId = String(w.identificacion || '').trim();
            listaMap.set(cleanId, {
              source: 'socio',
              nombre: w.nombre,
              identificacion: cleanId,
              cargo: w.cargo || 'Sin cargo',
              genero: w.genero || 'No especificado',
              edad: w.edad || 'No especificado',
              telefono: w.telefono || 'No especificado',
              correo: w.correo || 'No especificado',
              diagnostico: w.diagnosticoMedico || 'Ninguno registrado',
              fechaExamenMedico: w.fechaExamenMedico || 'No registrado',
              restricciones: w.restriccionesMedicas || w.restricciones || 'Ninguna registrada',
              recomendaciones: w.recomendacionesMedicas || 'Ninguna registrada',
              fitScore: w.biocentricScore || 0,
              fitAlerts: w.biocentricAlerts || []
            });
          });
        }

        // 2. Gather from SgsstWorker master profile
        if (SgsstWorkerModel) {
          const matchedMaster = await SgsstWorkerModel.find({
            ...queryObj,
            $or: [
              { nombre: { $regex: query, $options: 'i' } },
              { documento: { $regex: query, $options: 'i' } },
              { perfilId: { $regex: query, $options: 'i' } }
            ]
          }).lean();

          matchedMaster.forEach(w => {
            const cleanId = String(w.documento || '').trim();
            let existing = listaMap.get(cleanId);
            if (!existing) {
              existing = {
                source: 'master',
                nombre: w.nombre,
                identificacion: cleanId,
                cargo: w.perfilId || 'Sin cargo',
                genero: w.genero || 'No especificado',
                diagnostico: w.condicionesSalud || 'Ninguno registrado',
                restricciones: 'Ninguna registrada',
                recomendaciones: 'Ninguna registrada'
              };
            }
            existing.fitScore = w.fitScore || w.biocentricScore || existing.fitScore || 0;
            existing.fitAlerts = w.fitAlerts || w.biocentricAlerts || existing.fitAlerts || [];
            existing.riesgosBioIndividual = w.riesgosBioIndividual || [];
            existing.bioChartConclusions = w.bioChartConclusions || {};
            existing.atel_logs = w.atel || [];
            existing.actos_inseguros_logs = w.actos_inseguros || [];
            existing.participaciones_ipevar_logs = w.participaciones_ipevar || [];
            existing.capacitaciones_logs = w.capacitaciones || [];
            existing.ats_logs = w.ats || [];

            listaMap.set(cleanId, existing);
          });
        }

        const workers = Array.from(listaMap.values());
        if (workers.length === 0) {
          return JSON.stringify({ error: `No se encontró ningún trabajador o cargo coincidente con: "${nombre_o_cargo}".` });
        }

        // Deep-profile Cascading for up to 3 matches
        const results = [];
        for (const worker of workers.slice(0, 3)) {
          const wName = worker.nombre ? worker.nombre.trim() : '';
          const wId = worker.identificacion ? String(worker.identificacion).trim() : '';
          const wCargo = worker.cargo ? worker.cargo.trim() : '';

          let workerPayload = {
            trabajador_informacion_basica: {
              nombre: wName,
              identificacion: wId,
              cargo: wCargo,
              genero: worker.genero || 'No especificado',
              edad: worker.edad || 'No especificado',
              telefono: worker.telefono || 'No especificado',
              correo: worker.correo || 'No especificado'
            },
            hito_1_huella_biocentrica: {
              perfil_sociodemografico: {
                registrado: true,
                edad: worker.edad || 'No especificado',
                genero: worker.genero || 'No especificado'
              },
              perfil_del_cargo: null,
              informe_condiciones_salud: {
                diagnostico_clinico: worker.diagnostico || 'Ninguno registrado',
                fecha_examen_medico: worker.fechaExamenMedico || 'No registrado',
                restricciones_medicas: worker.restricciones || 'Ninguna registrada',
                recomendaciones_medicas: worker.recomendaciones || 'Ninguna registrada'
              },
              oraculo_predictivo_h1: {
                indice_biocentrico_fit_score: worker.fitScore || 0,
                alertas_biocentricas_clinicas: worker.fitAlerts || []
              }
            },
            hito_2_nucleo_bio_evaluativo: {
              matriz_bio_ipevar_general: [],
              riesgos_bio_individuales_especificos: worker.riesgosBioIndividual || []
            },
            hito_3_dinamica_de_exposicion: {
              participaciones_ipevar: [],
              reportes_actos_inseguros: [],
              programa_capacitaciones: [],
              analisis_trabajo_seguro_ats: [],
              permiso_trabajo_en_alturas: [],
              metodo_owas_ergonomia: []
            },
            hito_4_traumatismo_y_curacion: {
              accidentes_registrados: worker.atel_logs || [],
              investigaciones_accidentes: []
            },
            hito_5_oraculo_predictivo: {
              centro_de_inteligencia_predictiva: {
                conclusiones_ia: worker.bioChartConclusions?.conclusiones || worker.bioChartConclusions?.resumen || 'Sin conclusiones predictivas registradas aún.',
                recomendaciones: worker.bioChartConclusions?.recomendaciones || []
              }
            }
          };

          // ── Hito 1: Cargo Profile
          if (wCargo && PerfilCargoModel) {
            const cargoDoc = await PerfilCargoModel.findOne(queryObj).lean();
            if (cargoDoc && cargoDoc.perfiles) {
              const profile = cargoDoc.perfiles.find(p => p.nombreCargo && p.nombreCargo.toLowerCase().trim() === wCargo.toLowerCase().trim());
              if (profile) {
                workerPayload.hito_1_huella_biocentrica.perfil_del_cargo = {
                  descripcion: profile.descripcion || 'Sin descripción',
                  educacion: profile.educacion || 'No especificado',
                  experiencia: profile.experiencia || 'No especificado',
                  responsabilidadesSST: profile.responsabilidadesSST || [],
                  restricciones: profile.restricciones || '',
                  examenesMedicos: profile.examenesMedicos || [],
                  elementosProteccion: profile.elementosProteccion || [],
                  controlesFuente: profile.controlesFuenteSeleccionados || [],
                  controlesMedio: profile.controlesMedioSeleccionados || []
                };
              }
            }
          }

          // ── Hito 2: Matriz Bio-IPEVAR (General cargo hazards) - nested peligros parsing!
          if (wCargo && MatrizPeligrosModel) {
            const matrizDoc = await MatrizPeligrosModel.findOne(queryObj).lean();
            if (matrizDoc && matrizDoc.procesos) {
              const cargoLower = wCargo.toLowerCase();
              const relatedProcesses = matrizDoc.procesos.filter(p => 
                (p.proceso && p.proceso.toLowerCase().includes(cargoLower)) ||
                (p.actividad && p.actividad.toLowerCase().includes(cargoLower)) ||
                (p.zona && p.zona.toLowerCase().includes(cargoLower)) ||
                (p.tarea && p.tarea.toLowerCase().includes(cargoLower))
              );

              const ipevarList = [];
              for (const proc of relatedProcesses) {
                if (proc.peligros && Array.isArray(proc.peligros)) {
                  for (const pel of proc.peligros) {
                    ipevarList.push({
                      proceso_actividad: `${proc.proceso || ''} - ${proc.actividad || ''}`,
                      tarea: proc.tarea || '',
                      peligro_descripcion: pel.descripcionPeligro || '',
                      peligro_clasificacion: pel.clasificacion || '',
                      efectos_posibles: pel.efectosPosibles || '',
                      controles_existentes: {
                        fuente: pel.fuenteGeneradora || 'Ninguno',
                        medio: pel.medioExistente || 'Ninguno',
                        individuo: pel.individuoControl || 'Ninguno'
                      },
                      riesgo_valoracion: {
                        ND: pel.nivelDeficiencia || 0,
                        NE: pel.nivelExposicion || 0,
                        NP: pel.nivelProbabilidad || 0,
                        NC: pel.nivelConsecuencia || 0,
                        NR: pel.nivelRiesgo || 0,
                        interpretacion_nr: pel.interpretacionNR || '',
                        aceptabilidad: pel.aceptabilidad || ''
                      },
                      controles_propuestos: {
                        eliminacion: pel.eliminacion || 'Ninguno',
                        sustitucion: pel.sustitucion || 'Ninguno',
                        control_ingenieria: pel.controlIngenieria || 'Ninguno',
                        control_administrativo: pel.controlAdministrativo || 'Ninguno',
                        equipos_epp: pel.epp || 'Ninguno'
                      }
                    });
                  }
                }
              }
              workerPayload.hito_2_nucleo_bio_evaluativo.matriz_bio_ipevar_general = ipevarList;
            }
          }

          // ── Hito 3: Participación IPEVAR
          if (ParticipacionIpevarModel) {
            const partDoc = await ParticipacionIpevarModel.findOne(queryObj).lean();
            if (partDoc) {
              const list = partDoc.participacionesList || [];
              const inbox = partDoc.inboxPublico || [];
              const matchedPart = [...list, ...inbox].filter(p => 
                (wName && p.trabajador && p.trabajador.nombre && p.trabajador.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                (wId && p.trabajador && p.trabajador.cedula && String(p.trabajador.cedula).trim() === wId) ||
                (wName && p.nombre && p.nombre.toLowerCase().includes(wName.toLowerCase()))
              );
              workerPayload.hito_3_dinamica_de_exposicion.participaciones_ipevar = matchedPart.map(p => ({
                fecha: p.createdAt || p.fecha || 'No especificada',
                peligro_percibido: p.peligroPercibido || p.peligro || p.comentarios || 'No especificado',
                propuesta_control: p.propuestaControl || p.sugerencia || 'Ninguna'
              }));
            }
          }
          if (worker.participaciones_ipevar_logs && worker.participaciones_ipevar_logs.length > 0 && workerPayload.hito_3_dinamica_de_exposicion.participaciones_ipevar.length === 0) {
            workerPayload.hito_3_dinamica_de_exposicion.participaciones_ipevar = worker.participaciones_ipevar_logs.map(p => ({
              fecha: p.fecha || 'No especificada',
              peligro_percibido: p.descripcion || 'Participación IPEVAR',
              propuesta_control: 'Ninguna'
            }));
          }

          // ── Hito 3: Reportes de Actos Inseguros
          if (ReporteActosModel) {
            const actosDoc = await ReporteActosModel.findOne(queryObj).lean();
            if (actosDoc) {
              const matchedReports = (actosDoc.inboxPublico || []).filter(r => 
                (wName && r.trabajador && r.trabajador.nombre && r.trabajador.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                (wId && r.trabajador && r.trabajador.cedula && String(r.trabajador.cedula).trim() === wId) ||
                (wName && r.nombre && r.nombre.toLowerCase().includes(wName.toLowerCase()))
              );
              workerPayload.hito_3_dinamica_de_exposicion.reportes_actos_inseguros = matchedReports.map(r => ({
                fecha: r.createdAt || 'No especificada',
                descripcion: r.descripcion || r.detalles || 'No especificada',
                tipo: r.tipo || 'Acto/Condición Insegura',
                estado: r.status || 'Reportado'
              }));
            }
          }
          if (worker.actos_inseguros_logs && worker.actos_inseguros_logs.length > 0 && workerPayload.hito_3_dinamica_de_exposicion.reportes_actos_inseguros.length === 0) {
            workerPayload.hito_3_dinamica_de_exposicion.reportes_actos_inseguros = worker.actos_inseguros_logs.map(r => ({
              fecha: r.fecha || 'No especificada',
              descripcion: r.descripcion || 'Reporte de acto/condición',
              tipo: r.tipo || 'No especificado',
              estado: 'Reportado'
            }));
          }

          // ── Hito 3: Programa de Capacitaciones
          if (ProgramaCapacitacionesModel) {
            const capDoc = await ProgramaCapacitacionesModel.findOne(queryObj).lean();
            if (capDoc && capDoc.sesiones) {
              const matchedSessions = capDoc.sesiones.filter(s => 
                s.trabajadoresRegistrados && s.trabajadoresRegistrados.some(tr => 
                  (wName && tr.nombre && tr.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                  (wId && tr.cedula && String(tr.cedula).trim() === wId)
                )
              );
              workerPayload.hito_3_dinamica_de_exposicion.programa_capacitaciones = matchedSessions.map(s => {
                const reg = s.trabajadoresRegistrados.find(tr => 
                  (wName && tr.nombre && tr.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                  (wId && tr.cedula && String(tr.cedula).trim() === wId)
                );
                return {
                  tema: s.tema,
                  fecha: s.fecha,
                  estado: s.estado,
                  asistio: reg ? reg.asistio : false
                };
              });
            }
          }
          if (worker.capacitaciones_logs && worker.capacitaciones_logs.length > 0 && workerPayload.hito_3_dinamica_de_exposicion.programa_capacitaciones.length === 0) {
            workerPayload.hito_3_dinamica_de_exposicion.programa_capacitaciones = worker.capacitaciones_logs.map(c => ({
              tema: c.nombre || 'Capacitación',
              fecha: c.fecha || 'No especificada',
              estado: 'Completada',
              asistio: true
            }));
          }

          // ── Hito 3: ATS
          if (AnalisisTrabajoSeguroModel) {
            const atsDoc = await AnalisisTrabajoSeguroModel.findOne(queryObj).lean();
            if (atsDoc) {
              const inAts = (atsDoc.trabajadoresList || []).some(w => 
                (wName && w.nombre && w.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                (wId && w.cedula && String(w.cedula).trim() === wId)
              );
              if (inAts) {
                workerPayload.hito_3_dinamica_de_exposicion.analisis_trabajo_seguro_ats.push({
                  actividad: atsDoc.formData?.actividad || 'Actividad ATS',
                  fecha: atsDoc.formData?.fecha || 'No especificada',
                  herramientas: atsDoc.formData?.herramientas || 'No especificadas',
                  secuencia_pasos: atsDoc.formData?.secuenciaPasos || []
                });
              }
            }
          }
          if (worker.ats_logs && worker.ats_logs.length > 0 && workerPayload.hito_3_dinamica_de_exposicion.analisis_trabajo_seguro_ats.length === 0) {
            workerPayload.hito_3_dinamica_de_exposicion.analisis_trabajo_seguro_ats = worker.ats_logs.map(a => ({
              actividad: a.descripcion || 'Trabajo seguro',
              fecha: a.fecha || 'No especificada',
              herramientas: 'No registradas',
              secuencia_pasos: []
            }));
          }

          // ── Hito 3: Permiso de Trabajo en Alturas
          if (PermisoAlturasModel) {
            const alturaDoc = await PermisoAlturasModel.findOne(queryObj).lean();
            if (alturaDoc) {
              const hasPermit = (alturaDoc.trabajadoresList || []).some(w => 
                (wName && w.nombre && w.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                (wId && w.cedula && String(w.cedula).trim() === wId)
              );
              if (hasPermit) {
                workerPayload.hito_3_dinamica_de_exposicion.permiso_trabajo_en_alturas.push({
                  fecha: alturaDoc.formData?.fecha || 'No especificada',
                  descripcion_trabajo: alturaDoc.formData?.descripcionTrabajo || 'Trabajo en Alturas',
                  vigencia: alturaDoc.formData?.vigencia || 'No especificada',
                  aprobado: alturaDoc.formData?.aprobado || true
                });
              }
            }
          }

          // ── Hito 3: Método OWAS
          if (MetodoOwasModel) {
            const owasDoc = await MetodoOwasModel.findOne(queryObj).lean();
            if (owasDoc) {
              const matchedObs = (owasDoc.observaciones || []).filter(o => 
                (wName && o.trabajadorNombre && o.trabajadorNombre.toLowerCase().includes(wName.toLowerCase())) ||
                (wName && o.trabajador && o.trabajador.toLowerCase().includes(wName.toLowerCase()))
              );
              workerPayload.hito_3_dinamica_de_exposicion.metodo_owas_ergonomia = matchedObs.map(o => ({
                tarea: o.tarea || o.actividad || 'No especificada',
                postura: {
                  espalda: o.espalda || 1,
                  brazos: o.brazos || 1,
                  piernas: o.piernas || 1,
                  carga: o.carga || 1
                },
                categoria_riesgo: o.categoria || o.riesgo || 1,
                acciones_correctivas: o.accionCorrectiva || o.sugerencia || 'No requerida'
              }));
            }
          }

          // ── Hito 4: Investigaciones de Accidentes
          if (InvestigacionAtelModel) {
            const allInvest = await InvestigacionAtelModel.find(queryObj).lean();
            const matchedInvest = allInvest.filter(i => 
              (wName && i.formData?.afectadoNombre && i.formData.afectadoNombre.toLowerCase().includes(wName.toLowerCase())) ||
              (wId && i.formData?.afectadoCedula && String(i.formData.afectadoCedula).trim() === wId) ||
              (wName && i.testigosList && i.testigosList.some(t => t.nombre && t.nombre.toLowerCase().includes(wName.toLowerCase())))
            );
            workerPayload.hito_4_traumatismo_y_curacion.investigaciones_accidentes = matchedInvest.map(i => ({
              fecha: i.formData?.fechaAccidente || 'No especificada',
              tipo_evento: i.formData?.tipoEvento || 'Accidente de Trabajo',
              descripcion: i.formData?.descripcionAccidente || 'No especificada',
              causas_inmediatas: i.formData?.causasInmediatas || '',
              causas_basicas: i.formData?.causasBasicas || '',
              planes_accion: i.formData?.planesAccion || []
            }));
          }

          results.push(workerPayload);
        }

        return JSON.stringify({
          mensaje: `Se procesaron exitosamente ${results.length} expediente(s) con enfoque en el Motor Bio-Individual de SomosSST.`,
          expedientes: results
        });
      }

      // ── ACTION: RESUMEN EMPRESA (DASHBOARD METRICO GLOBAL) ───────────────────
      if (accion === 'resumen_empresa') {
        const resumen = {
          total_trabajadores: 0,
          hito_1_huella_biocentrica_global: {
            total_perfiles_cargo: 0,
            examenes_salud_vencidos: 0,
            indice_biocentrico_promedio_empresa: 100,
            trabajadores_con_alertas_biocentricas: 0
          },
          hito_2_nucleo_bio_evaluativo_global: {
            total_procesos_evaluados: 0,
            total_peligros_identificados: 0,
            riesgos_inaceptables_ipevar: 0
          },
          hito_3_dinamica_de_exposicion_global: {
            asistencia_general_capacitaciones: '0%',
            total_participaciones_ipevar: 0,
            total_reportes_actos_inseguros: 0,
            total_ats_autorizados: 0,
            total_permisos_alturas: 0,
            total_evaluaciones_owas: 0,
            alertas_posturales_criticas_owas: 0
          },
          hito_4_traumatismo_y_curacion_global: {
            total_eventos_incidentes: 0,
            dias_totales_incapacidad: 0,
            total_investigaciones_accidentes: 0
          },
          hito_5_oraculo_predictivo_global: {
            resumen_salud_corporativa_ia: 'Estable. No se registran incidentes graves recientes.'
          }
        };

        const currentDate = new Date();
        const seenWorkers = new Set();
        let totalFitScore = 0;
        let fitCount = 0;

        // 1. Gather master workers (Hito 1)
        if (SgsstWorkerModel) {
          const masterList = await SgsstWorkerModel.find(queryObj).lean();
          resumen.total_trabajadores = masterList.length;
          masterList.forEach(w => {
            const cleanId = String(w.documento || '').trim();
            seenWorkers.add(cleanId);

            // Health exam status
            if (w.atel && w.atel.length > 0) {
              resumen.hito_4_traumatismo_y_curacion_global.total_eventos_incidentes += w.atel.length;
            }

            // Oráculo H1 metrics
            const score = w.fitScore || w.biocentricScore || 0;
            if (score > 0) {
              totalFitScore += score;
              fitCount++;
            }
            const alerts = w.fitAlerts || w.biocentricAlerts || [];
            if (alerts.length > 0) {
              resumen.hito_1_huella_biocentrica_global.trabajadores_con_alertas_biocentricas++;
            }
          });
        }

        // 2. Gather from PerfilSocio if master list is smaller
        if (socioData && socioData.trabajadores) {
          socioData.trabajadores.forEach(w => {
            const cleanId = String(w.identificacion || '').trim();
            if (!seenWorkers.has(cleanId)) {
              seenWorkers.add(cleanId);
              const score = w.biocentricScore || 0;
              if (score > 0) {
                totalFitScore += score;
                fitCount++;
              }
              const alerts = w.biocentricAlerts || [];
              if (alerts.length > 0) {
                resumen.hito_1_huella_biocentrica_global.trabajadores_con_alertas_biocentricas++;
              }
            }

            // Examen Médico Alert Check
            if (w.fechaExamenMedico) {
              try {
                const diffTime = Math.abs(currentDate - new Date(w.fechaExamenMedico));
                if (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) >= 300) {
                  resumen.hito_1_huella_biocentrica_global.examenes_salud_vencidos++;
                }
              } catch (e) {
                resumen.hito_1_huella_biocentrica_global.examenes_salud_vencidos++;
              }
            } else {
              resumen.hito_1_huella_biocentrica_global.examenes_salud_vencidos++;
            }
          });
          resumen.total_trabajadores = seenWorkers.size;
        }

        // Calc average biocentric score
        if (fitCount > 0) {
          resumen.hito_1_huella_biocentrica_global.indice_biocentrico_promedio_empresa = Math.round(totalFitScore / fitCount);
        }

        // Hito 1: Cargo Profiles Completed
        if (PerfilCargoModel) {
          const cargoDoc = await PerfilCargoModel.findOne(queryObj).lean();
          if (cargoDoc && cargoDoc.perfiles) {
            resumen.hito_1_huella_biocentrica_global.total_perfiles_cargo = cargoDoc.perfiles.length;
          }
        }

        // Hito 2: Matriz Bio-IPEVAR (Núcleo Bio-Evaluativo)
        if (MatrizPeligrosModel) {
          const matrizDoc = await MatrizPeligrosModel.findOne(queryObj).lean();
          if (matrizDoc && matrizDoc.procesos) {
            resumen.hito_2_nucleo_bio_evaluativo_global.total_procesos_evaluados = matrizDoc.procesos.length;
            matrizDoc.procesos.forEach(p => {
              if (p.peligros && Array.isArray(p.peligros)) {
                p.peligros.forEach(pel => {
                  resumen.hito_2_nucleo_bio_evaluativo_global.total_peligros_identificados++;
                  const nr = pel.nivelRiesgo || 0;
                  const aceptabilidad = String(pel.aceptabilidad || '').toLowerCase();
                  if (nr >= 150 || aceptabilidad.includes('no aceptable') || aceptabilidad === 'no') {
                    resumen.hito_2_nucleo_bio_evaluativo_global.riesgos_inaceptables_ipevar++;
                  }
                });
              }
            });
          }
        }

        // Hito 3: Programa de Capacitaciones (Dinámica de Exposición)
        if (ProgramaCapacitacionesModel) {
          const capDoc = await ProgramaCapacitacionesModel.findOne(queryObj).lean();
          if (capDoc && capDoc.sesiones) {
            let totalReg = 0;
            let totalAsistio = 0;
            capDoc.sesiones.forEach(s => {
              if (s.trabajadoresRegistrados) {
                s.trabajadoresRegistrados.forEach(tr => {
                  totalReg++;
                  if (tr.asistio) totalAsistio++;
                });
              }
            });
            if (totalReg > 0) {
              resumen.hito_3_dinamica_de_exposicion_global.asistencia_general_capacitaciones = `${Math.round((totalAsistio / totalReg) * 100)}%`;
            }
          }
        }

        // Hito 3: Participación IPEVAR
        if (ParticipacionIpevarModel) {
          const partDoc = await ParticipacionIpevarModel.findOne(queryObj).lean();
          if (partDoc) {
            resumen.hito_3_dinamica_de_exposicion_global.total_participaciones_ipevar = (partDoc.participacionesList || []).length + (partDoc.inboxPublico || []).length;
          }
        }

        // Hito 3: Actos Inseguros
        if (ReporteActosModel) {
          const actosDoc = await ReporteActosModel.findOne(queryObj).lean();
          if (actosDoc) {
            resumen.hito_3_dinamica_de_exposicion_global.total_reportes_actos_inseguros = (actosDoc.inboxPublico || []).length;
          }
        }

        // Hito 3: ATS
        if (AnalisisTrabajoSeguroModel) {
          const atsDoc = await AnalisisTrabajoSeguroModel.findOne(queryObj).lean();
          if (atsDoc) {
            resumen.hito_3_dinamica_de_exposicion_global.total_ats_autorizados = 1;
          }
        }

        // Hito 3: Permisos de Alturas
        if (PermisoAlturasModel) {
          const alturaDoc = await PermisoAlturasModel.findOne(queryObj).lean();
          if (alturaDoc) {
            resumen.hito_3_dinamica_de_exposicion_global.total_permisos_alturas = 1;
          }
        }

        // Hito 3: Método OWAS
        if (MetodoOwasModel) {
          const owasDoc = await MetodoOwasModel.findOne(queryObj).lean();
          if (owasDoc && owasDoc.observaciones) {
            resumen.hito_3_dinamica_de_exposicion_global.total_evaluaciones_owas = owasDoc.observaciones.length;
            resumen.hito_3_dinamica_de_exposicion_global.alertas_posturales_criticas_owas = owasDoc.observaciones.filter(o => o.categoria === 3 || o.categoria === 4 || o.riesgo === 3 || o.riesgo === 4).length;
          }
        }

        // Hito 4: Estadísticas ATEL
        if (ATELAnnualModel) {
          const atelDocs = await ATELAnnualModel.find(queryObj).lean();
          let monthEventsCount = 0;
          atelDocs.forEach(annual => {
            if (annual.months) {
              const monthObj = annual.months instanceof Map ? Object.fromEntries(annual.months) : annual.months;
              Object.values(monthObj).forEach(m => {
                if (m.events) {
                  monthEventsCount += m.events.length;
                  m.events.forEach(e => {
                    if (e.diasIncapacidad) resumen.hito_4_traumatismo_y_curacion_global.dias_totales_incapacidad += Number(e.diasIncapacidad);
                  });
                }
              });
            }
          });
          if (monthEventsCount > 0 && resumen.hito_4_traumatismo_y_curacion_global.total_eventos_incidentes === 0) {
            resumen.hito_4_traumatismo_y_curacion_global.total_eventos_incidentes = monthEventsCount;
          }
        }

        // Hito 4: Investigaciones
        if (InvestigacionAtelModel) {
          resumen.hito_4_traumatismo_y_curacion_global.total_investigaciones_accidentes = await InvestigacionAtelModel.countDocuments(queryObj);
        }

        // Hito 5: Oráculo Predictivo Global conclusion synthesis
        let lowFitWorkers = resumen.hito_1_huella_biocentrica_global.trabajadores_con_alertas_biocentricas;
        let unacceptableHazards = resumen.hito_2_nucleo_bio_evaluativo_global.riesgos_inaceptables_ipevar;
        let criticalPostures = resumen.hito_3_dinamica_de_exposicion_global.alertas_posturales_criticas_owas;

        if (lowFitWorkers > 0 || unacceptableHazards > 0 || criticalPostures > 0) {
          resumen.hito_5_oraculo_predictivo_global.resumen_salud_corporativa_ia = `Alerta predictiva activa: Se identifican ${lowFitWorkers} trabajadores con susceptibilidades de salud en Oráculo H1, ${unacceptableHazards} riesgos inaceptables en Matriz Bio-IPEVAR y ${criticalPostures} tareas con posturas críticas evaluadas por OWAS. Se sugiere intervención ergonómica focalizada.`;
        }

        return JSON.stringify(resumen);
      }

      return JSON.stringify({ error: `Acción desconocida: "${accion}".` });

    } catch (error) {
      console.error('[SomosSST Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error cruzando los expedientes del ecosistema de SomosSST.',
        details: error.message,
      });
    }
  }
}

module.exports = SomosSST;
