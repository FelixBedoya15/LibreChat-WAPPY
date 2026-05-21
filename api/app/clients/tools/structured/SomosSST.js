const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');

/**
 * SomosSST Tool
 * Permite al agente interactuar de manera integral con los 12 Hitos y módulos adicionales
 * del ecosistema SG-SST de la empresa.
 */
class SomosSST extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'somos_sst';
    this.description =
      'Consulta el expediente integral de uno o varios trabajadores (sociodemográfico, clínico, cargos, IPEVAR, capacitaciones, OWAS, ATS, alturas, e investigaciones ATEL) o estadísticas del dashboard general de la empresa.';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['consultar_expediente_integral', 'listar_trabajadores', 'resumen_empresa'])
        .describe(
          'La acción a ejecutar. "consultar_expediente_integral" para buscar información profunda cruzada de un trabajador; "listar_trabajadores" para ver quiénes están registrados; "resumen_empresa" para estadísticas generales de todos los hitos.',
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

      // Load all 12 Hitos and satellite models
      const PerfilSocioModel = modelLoader('PerfilSociodemograficoData', '~/server/routes/sgsst/perfilSociodemografico');
      const PerfilCargoModel = modelLoader('PerfilCargoData', '~/server/routes/sgsst/perfilesCargo');
      const MatrizPeligrosModel = modelLoader('MatrizPeligrosData', '~/server/routes/sgsst/matrizPeligros');
      const ProgramaCapacitacionesModel = modelLoader('ProgramaCapacitacionesData', '~/server/routes/sgsst/programaCapacitaciones');
      const MatrizLegalModel = modelLoader('MatrizLegalData', '~/server/routes/sgsst/matriz');
      const AnalisisVulnerabilidadModel = modelLoader('AnalisisVulnerabilidadData', '~/server/routes/sgsst/analisisVulnerabilidad');
      const ParticipacionIpevarModel = modelLoader('ParticipacionIpevarData', '~/server/routes/sgsst/participacionIpevar');
      const AnalisisTrabajoSeguroModel = modelLoader('AnalisisTrabajoSeguroData', '~/server/routes/sgsst/analisisTrabajoSeguro');
      const MetodoOwasModel = modelLoader('MetodoOwasData', '~/server/routes/sgsst/metodoOwas');
      const PermisoAlturasModel = modelLoader('PermisoAlturasData', '~/server/routes/sgsst/permisoAlturas');
      const ATELAnnualModel = modelLoader('ATELAnnualData', '~/server/routes/sgsst/atel-data');
      const InvestigacionAtelModel = modelLoader('InvestigacionAtelData', '~/models/InvestigacionAtelData');
      const ReporteActosModel = modelLoader('ReporteActosData', '~/server/routes/sgsst/reporteActos');
      const AltaDireccionModel = modelLoader('AltaDireccionData', '~/server/routes/sgsst/altaDireccion');
      const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');

      // Helper to obtain the active company id
      const getActiveCompanyId = async (uid) => {
        let active = await CompanyInfo.findOne({ user: uid, isActive: true });
        if (!active) active = await CompanyInfo.findOne({ user: uid });
        return active ? active._id : null;
      };

      const companyId = await getActiveCompanyId(userId);
      const { accion, nombre_o_cargo } = input;
      const socioData = PerfilSocioModel ? await PerfilSocioModel.findOne({ user: userId }) : null;

      // Load Conversation, Message and File models dynamically for PHVA cycle stage tracking
      let ConversationModel = mongoose.models.Conversation;
      let MessageModel = mongoose.models.Message;
      let FileModel = mongoose.models.File;
      if (!ConversationModel || !MessageModel || !FileModel) {
        try {
          const dbModels = require('~/db/models');
          if (dbModels) {
            if (!ConversationModel) ConversationModel = dbModels.Conversation;
            if (!MessageModel) MessageModel = dbModels.Message;
            if (!FileModel) FileModel = dbModels.File;
          }
        } catch (e) {
          console.warn('[SomosSST Tool] Failed to load Conversation/Message/File models dynamically:', e.message);
        }
      }

      // Helper to retrieve latest tagged report conversation and its AI message content
      const getLatestReportMeta = async (tag) => {
        if (!ConversationModel) return null;
        let convo = null;
        if (companyId) {
          convo = await ConversationModel.findOne({
            user: userId,
            tags: { $all: [tag, `company-${companyId}`] }
          })
          .select('conversationId title updatedAt tags')
          .sort({ updatedAt: -1 })
          .lean();
        }
        if (!convo) {
          convo = await ConversationModel.findOne({
            user: userId,
            tags: tag
          })
          .select('conversationId title updatedAt tags')
          .sort({ updatedAt: -1 })
          .lean();
        }
        if (!convo) return null;

        let textSample = '';
        let messageId = null;
        if (MessageModel) {
          const msg = await MessageModel.findOne({
            conversationId: convo.conversationId,
            isCreatedByUser: false
          })
          .select('messageId text')
          .sort({ createdAt: -1 })
          .lean();
          if (msg) {
            if (msg.text) textSample = msg.text;
            messageId = msg.messageId;
          }
        }
        return {
          configurado: true,
          titulo: convo.title,
          conversationId: convo.conversationId,
          messageId,
          fecha_actualizacion: convo.updatedAt,
          texto: textSample
        };
      };

      // Helper to extract compliance percentage via regex
      const extractCompliancePercentage = (text) => {
        if (!text) return null;
        const cleanText = text.replace(/<[^>]*>/g, ' ');
        const match = cleanText.match(/(?:cumplimiento|calificación|resultado).*?(\d+(?:\.\d+)?)\s*%/i) || 
                      cleanText.match(/(\d+(?:\.\d+)?)\s*%.*?(?:cumplimiento|calificación|resultado)/i) ||
                      cleanText.match(/(\d+(?:\.\d+)?)\s*%/);
        return match ? `${match[1]}%` : null;
      };

      // Helper to extract SG-SST responsible name via regex
      const extractResponsableName = (text) => {
        if (!text) return null;
        const cleanText = text.replace(/<[^>]*>/g, ' ');
        const match = cleanText.match(/(?:nombre del responsable|responsable asignado|asignado a|nombre:)\s*([A-Za-záéíóúÁÉÍÓÚñÑ\s.]{3,40})/i);
        return match ? match[1].trim() : null;
      };

      // ── LISTAR TRABAJADORES ───────────────────────────────────────────
      if (accion === 'listar_trabajadores') {
        if (!socioData || !socioData.trabajadores || socioData.trabajadores.length === 0) {
          return JSON.stringify({ mensaje: 'No hay trabajadores registrados en la base de datos (Hito 1: Perfil Sociodemográfico).' });
        }

        const lista = [];
        const currentDate = new Date();

        let accidentedCedulas = new Set();
        if (InvestigacionAtelModel) {
          const allAccidents = await InvestigacionAtelModel.find({ user: userId, companyId }).lean();
          allAccidents.forEach(acc => {
            if (acc.formData?.afectadoCedula) {
              accidentedCedulas.add(String(acc.formData.afectadoCedula).trim());
            }
          });
        }

        for (const t of socioData.trabajadores) {
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

          lista.push({
            nombre: t.nombre,
            identificacion: t.identificacion,
            cargo: t.cargo || 'Sin cargo',
            diagnostico: t.diagnosticoMedico || 'No registrado',
            alertas: {
              examen_medico_vencido: hasMedicalAlert,
              accidente_registrado: accidentedCedulas.has(String(t.identificacion).trim())
            }
          });
        }

        return JSON.stringify({
          mensaje: `Se encontraron ${lista.length} trabajadores registrados.`,
          trabajadores: lista
        });
      }

      // ── CONSULTAR EXPEDIENTE INTEGRAL (CRUCE CASCADA MULTIVARIABLE Y PHVA) ────
      if (accion === 'consultar_expediente_integral') {
        if (!nombre_o_cargo) {
          return JSON.stringify({ error: 'Debes proporcionar un nombre_o_cargo para buscar el expediente.' });
        }

        if (!socioData || !socioData.trabajadores) {
          return JSON.stringify({ error: 'No se encontraron registros de trabajadores para analizar en el perfil sociodemográfico.' });
        }

        const query = nombre_o_cargo.toLowerCase();
        
        // Find matching workers by name, identification, or cargo
        const workers = socioData.trabajadores.filter(w =>
          (w.nombre && w.nombre.toLowerCase().includes(query)) ||
          (w.identificacion && String(w.identificacion).includes(query)) ||
          (w.cargo && w.cargo.toLowerCase().includes(query))
        );

        if (workers.length === 0) {
          return JSON.stringify({ error: `No se encontró ningún trabajador o cargo coincidente con: "${nombre_o_cargo}".` });
        }

        // Gather deep profile cascading for up to 3 matches to avoid huge token limit overflow
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
            perfil_sociodemografico_y_salud: {
              diagnostico_clinico: worker.diagnosticoMedico || 'Ninguno registrado',
              fecha_examen_medico: worker.fechaExamenMedico || 'No registrado',
              restricciones_medicas: worker.restriccionesMedicas || worker.restricciones || 'Ninguna registrada',
              recomendaciones_medicas: worker.recomendacionesMedicas || 'Ninguna registrada'
            },
            perfil_del_cargo: null,
            matriz_peligros_asociados: [],
            capacitaciones_registradas: [],
            plan_emergencias_vulnerabilidades: { brigadista_evaluador: false },
            participacion_ipevar: [],
            pasos_ats_registrados: [],
            observaciones_ergonomicas_owas: [],
            permisos_alturas: [],
            investigaciones_accidentes: [],
            reportes_actos_inseguros: [],
            vinculacion_etapas_phva: {}
          };

          // 1. Perfil del Cargo (Hito 2)
          if (wCargo && PerfilCargoModel) {
            const cargoDoc = await PerfilCargoModel.findOne({ user: userId, companyId }).lean();
            if (cargoDoc && cargoDoc.perfiles) {
              const profile = cargoDoc.perfiles.find(p => p.nombreCargo && p.nombreCargo.toLowerCase().trim() === wCargo.toLowerCase().trim());
              if (profile) {
                workerPayload.perfil_del_cargo = {
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

          // 2. Matriz de Peligros IPEVAR (Hito 3)
          if (wCargo && MatrizPeligrosModel) {
            const matrizDoc = await MatrizPeligrosModel.findOne({ user: userId, companyId }).lean();
            if (matrizDoc && matrizDoc.procesos) {
              const cargoLower = wCargo.toLowerCase();
              const relatedHazards = matrizDoc.procesos.filter(p => 
                (p.proceso && p.proceso.toLowerCase().includes(cargoLower)) ||
                (p.actividad && p.actividad.toLowerCase().includes(cargoLower)) ||
                (p.zonas && p.zonas.toLowerCase().includes(cargoLower))
              );
              workerPayload.matriz_peligros_asociados = relatedHazards.map(h => ({
                proceso_actividad: `${h.proceso || ''} - ${h.actividad || ''}`,
                tarea: h.tareas || h.tarea || '',
                peligro_descripcion: h.peligro_descripcion || h.peligro || '',
                peligro_clasificacion: h.peligro_clasificacion || '',
                efectos_posibles: h.efectos_posibles || '',
                controles_existentes: {
                  fuente: h.controles_fuente || 'Ninguno',
                  medio: h.controles_medio || 'Ninguno',
                  individuo: h.controles_individuo || 'Ninguno'
                },
                riesgo_valoracion: {
                  ND: h.nd || 0,
                  NE: h.ne || 0,
                  NP: h.np || 0,
                  NC: h.nc || 0,
                  NR: h.nr || 0,
                  interpretacion_nr: h.interpretacion_nr || '',
                  aceptabilidad: h.aceptabilidad || ''
                },
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

          // 3. Capacitaciones (Hito 4)
          if (ProgramaCapacitacionesModel) {
            const capDoc = await ProgramaCapacitacionesModel.findOne({ user: userId, companyId }).lean();
            if (capDoc && capDoc.sesiones) {
              const matchedSessions = capDoc.sesiones.filter(s => 
                s.trabajadoresRegistrados && s.trabajadoresRegistrados.some(tr => 
                  (tr.nombre && tr.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                  (tr.cedula && String(tr.cedula).trim() === wId)
                )
              );
              workerPayload.capacitaciones_registradas = matchedSessions.map(s => {
                const reg = s.trabajadoresRegistrados.find(tr => 
                  (tr.nombre && tr.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                  (tr.cedula && String(tr.cedula).trim() === wId)
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

          // 4. Plan de Emergencias / Vulnerabilidades (Hito 6)
          if (AnalisisVulnerabilidadModel) {
            const vulnDoc = await AnalisisVulnerabilidadModel.findOne({ user: userId, companyId }).lean();
            if (vulnDoc && vulnDoc.evaluadoresList) {
              const isEvaluator = vulnDoc.evaluadoresList.some(ev => 
                (ev.nombre && ev.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                (ev.cedula && String(ev.cedula).trim() === wId)
              );
              workerPayload.plan_emergencias_vulnerabilidades.brigadista_evaluador = isEvaluator;
            }
          }

          // 5. Participación IPEVAR (Hito 7)
          if (ParticipacionIpevarModel) {
            const partDoc = await ParticipacionIpevarModel.findOne({ user: userId, companyId }).lean();
            if (partDoc) {
              const list = partDoc.participacionesList || [];
              const inbox = partDoc.inboxPublico || [];
              const matchedPart = [...list, ...inbox].filter(p => 
                (p.trabajador && p.trabajador.nombre && p.trabajador.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                (p.trabajador && p.trabajador.cedula && String(p.trabajador.cedula).trim() === wId) ||
                (p.nombre && p.nombre.toLowerCase().includes(wName.toLowerCase()))
              );
              workerPayload.participacion_ipevar = matchedPart.map(p => ({
                fecha: p.createdAt || p.fecha || 'No especificada',
                peligro_percibido: p.peligroPercibido || p.peligro || p.comentarios || 'No especificado',
                propuesta_control: p.propuestaControl || p.sugerencia || 'Ninguna'
              }));
            }
          }

          // 6. ATS (Análisis de Trabajo Seguro) (Hito 8)
          if (AnalisisTrabajoSeguroModel) {
            const atsDoc = await AnalisisTrabajoSeguroModel.findOne({ user: userId, companyId }).lean();
            if (atsDoc) {
              const inAts = (atsDoc.trabajadoresList || []).some(w => 
                (w.nombre && w.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                (w.cedula && String(w.cedula).trim() === wId)
              );
              if (inAts) {
                workerPayload.pasos_ats_registrados.push({
                  actividad: atsDoc.formData?.actividad || 'Actividad ATS',
                  fecha: atsDoc.formData?.fecha || 'No especificada',
                  herramientas: atsDoc.formData?.herramientas || 'No especificadas',
                  secuencia_pasos: atsDoc.formData?.secuenciaPasos || []
                });
              }
            }
          }

          // 7. Método OWAS (Ergonomía) (Hito 9)
          if (MetodoOwasModel) {
            const owasDoc = await MetodoOwasModel.findOne({ user: userId, companyId }).lean();
            if (owasDoc) {
              const matchedObs = (owasDoc.observaciones || []).filter(o => 
                (o.trabajadorNombre && o.trabajadorNombre.toLowerCase().includes(wName.toLowerCase())) ||
                (o.trabajador && o.trabajador.toLowerCase().includes(wName.toLowerCase()))
              );
              workerPayload.observaciones_ergonomicas_owas = matchedObs.map(o => ({
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

          // 8. Permiso de Alturas (Hito 10)
          if (PermisoAlturasModel) {
            const alturaDoc = await PermisoAlturasModel.findOne({ user: userId, companyId }).lean();
            if (alturaDoc) {
              const hasPermit = (alturaDoc.trabajadoresList || []).some(w => 
                (w.nombre && w.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                (w.cedula && String(w.cedula).trim() === wId)
              );
              if (hasPermit) {
                workerPayload.permisos_alturas.push({
                  fecha: alturaDoc.formData?.fecha || 'No especificada',
                  descripcion_trabajo: alturaDoc.formData?.descripcionTrabajo || 'Trabajo en Alturas',
                  vigencia: alturaDoc.formData?.vigencia || 'No especificada',
                  aprobado: alturaDoc.formData?.aprobado || true
                });
              }
            }
          }

          // 9. Investigación de Accidentes (Hito 12)
          if (InvestigacionAtelModel) {
            const allInvest = await InvestigacionAtelModel.find({ user: userId, companyId }).lean();
            const matchedInvest = allInvest.filter(i => 
              (i.formData?.afectadoNombre && i.formData.afectadoNombre.toLowerCase().includes(wName.toLowerCase())) ||
              (i.formData?.afectadoCedula && String(i.formData.afectadoCedula).trim() === wId) ||
              (i.testigosList && i.testigosList.some(t => t.nombre && t.nombre.toLowerCase().includes(wName.toLowerCase())))
            );
            workerPayload.investigaciones_accidentes = matchedInvest.map(i => ({
              fecha: i.formData?.fechaAccidente || 'No especificada',
              tipo_evento: i.formData?.tipoEvento || 'Accidente de Trabajo',
              descripcion: i.formData?.descripcionAccidente || 'No especificada',
              causas_inmediatas: i.formData?.causasInmediatas || '',
              causas_basicas: i.formData?.causasBasicas || '',
              planes_accion: i.formData?.planesAccion || []
            }));
          }

          // 10. Reportes de Actos Inseguros (Extra)
          if (ReporteActosModel) {
            const actosDoc = await ReporteActosModel.findOne({ user: userId, companyId }).lean();
            if (actosDoc) {
              const matchedReports = (actosDoc.inboxPublico || []).filter(r => 
                (r.trabajador && r.trabajador.nombre && r.trabajador.nombre.toLowerCase().includes(wName.toLowerCase())) ||
                (r.trabajador && r.trabajador.cedula && String(r.trabajador.cedula).trim() === wId) ||
                (r.nombre && r.nombre.toLowerCase().includes(wName.toLowerCase()))
              );
              workerPayload.reportes_actos_inseguros = matchedReports.map(r => ({
                fecha: r.createdAt || 'No especificada',
                descripcion: r.descripcion || r.detalles || 'No especificada',
                tipo: r.tipo || 'Acto/Condición Insegura',
                estado: r.status || 'Reportado'
              }));
            }
          }

          // 11. Vinculación en Etapas PHVA (Bóveda Legal)
          const vinculacionPHVA = {
            Planear: {
              diagnostico_inicial: { mencionado: false, coincidencias: [] },
              politica_sst: { mencionado: false, coincidencias: [] },
              objetivos_sst: { mencionado: false, coincidencias: [] },
              reglamento_higiene: { mencionado: false, coincidencias: [] },
              reglamento_interno_rit: { mencionado: false, coincidencias: [] },
              responsable_sgsst: { asignado: false, cargo_coincide: false }
            },
            Hacer: {
              perfil_sociodemografico: { registrado: true },
              perfil_del_cargo: { configurado: !!workerPayload.perfil_del_cargo },
              matriz_peligros_asociados: { total_peligros: workerPayload.matriz_peligros_asociados.length },
              capacitaciones_registradas: { total_sesiones: workerPayload.capacitaciones_registradas.length },
              vulnerabilidades_emergencia: { brigadista_evaluador: workerPayload.plan_emergencias_vulnerabilidades.brigadista_evaluador },
              participacion_ipevar: { total_reportes: workerPayload.participacion_ipevar.length },
              analisis_trabajo_seguro: { total_ATS: workerPayload.pasos_ats_registrados.length },
              metodo_owas: { total_observaciones: workerPayload.observaciones_ergonomicas_owas.length },
              permiso_alturas: { total_permisos: workerPayload.permisos_alturas.length },
              investigacion_atel: { total_investigaciones: workerPayload.investigaciones_accidentes.length },
              reporte_actos_inseguros: { total_reportes: workerPayload.reportes_actos_inseguros.length }
            },
            Verificar: {
              informe_auditoria: { mencionado: false, coincidencias: [] },
              revision_alta_direccion: { mencionado: false, cargo_coincide: false, es_revisor: false }
            },
            Actuar: {
              matriz_acpm: { total_archivos_vinculados: 0, nombres_archivos: [] }
            }
          };

          const checkMention = (text) => {
            if (!text) return { mencionado: false, coincidencias: [] };
            const cleanText = text.replace(/<[^>]*>/g, ' ');
            const found = [];
            if (wName && cleanText.toLowerCase().includes(wName.toLowerCase())) {
              found.push('Nombre Completo');
            }
            if (wCargo && cleanText.toLowerCase().includes(wCargo.toLowerCase())) {
              found.push(`Cargo: ${wCargo}`);
            }
            if (wId && cleanText.includes(wId)) {
              found.push('Cédula/Identificación');
            }
            return {
              mencionado: found.length > 0,
              coincidencias: found
            };
          };

          // Query PHVA reports
          const diagReport = await getLatestReportMeta('sgsst-diagnostico');
          if (diagReport && diagReport.texto) {
            vinculacionPHVA.Planear.diagnostico_inicial = checkMention(diagReport.texto);
          }

          const polReport = await getLatestReportMeta('sgsst-politica');
          if (polReport && polReport.texto) {
            vinculacionPHVA.Planear.politica_sst = checkMention(polReport.texto);
          }

          const objReport = await getLatestReportMeta('sgsst-objetivos');
          if (objReport && objReport.texto) {
            vinculacionPHVA.Planear.objetivos_sst = checkMention(objReport.texto);
          }

          const rhsReport = await getLatestReportMeta('sgsst-reglamento-higiene');
          if (rhsReport && rhsReport.texto) {
            vinculacionPHVA.Planear.reglamento_higiene = checkMention(rhsReport.texto);
          }

          const ritReport = await getLatestReportMeta('sgsst-reglamento-interno');
          if (ritReport && ritReport.texto) {
            vinculacionPHVA.Planear.reglamento_interno_rit = checkMention(ritReport.texto);
          }

          const respReport = await getLatestReportMeta('sgsst-responsable');
          if (respReport && respReport.texto) {
            const respName = extractResponsableName(respReport.texto);
            const isAssigned = (wName && respName && respName.toLowerCase().includes(wName.toLowerCase())) ||
                               (respReport.texto.toLowerCase().includes(wName.toLowerCase())) ||
                               (wId && respReport.texto.includes(wId));
            vinculacionPHVA.Planear.responsable_sgsst = {
              asignado: !!isAssigned,
              cargo_coincide: respReport.texto.toLowerCase().includes(wCargo.toLowerCase())
            };
          }

          const audReport = await getLatestReportMeta('sgsst-auditoria');
          if (audReport && audReport.texto) {
            vinculacionPHVA.Verificar.informe_auditoria = checkMention(audReport.texto);
          }

          // Check Alta Dirección
          if (AltaDireccionModel) {
            const altaDoc = await AltaDireccionModel.findOne({ user: userId, companyId }).lean();
            if (altaDoc) {
              const isRevisor = altaDoc.reviewerInfo?.cedula === wId ||
                                (altaDoc.reviewerInfo?.nombre && wName && altaDoc.reviewerInfo.nombre.toLowerCase().includes(wName.toLowerCase()));
              const mentions = checkMention(JSON.stringify(altaDoc));
              vinculacionPHVA.Verificar.revision_alta_direccion = {
                mencionado: mentions.mencionado,
                cargo_coincide: mentions.coincidencias.some(c => c.startsWith('Cargo')),
                es_revisor: !!isRevisor
              };
            }
          }

          // Check ACPM uploaded files
          if (FileModel) {
            const acpmFiles = await FileModel.find({
              user: userId,
              $or: [
                { sgsst_category: 'acpm' },
                { category: 'acpm' },
                { tag: 'acpm' }
              ]
            }).select('filename name').lean();
            if (acpmFiles && acpmFiles.length > 0) {
              const matchedFiles = acpmFiles.filter(f => {
                const fName = (f.filename || f.name || '').toLowerCase();
                return (wName && fName.includes(wName.toLowerCase())) || (wCargo && fName.includes(wCargo.toLowerCase()));
              });
              vinculacionPHVA.Actuar.matriz_acpm = {
                total_archivos_vinculados: matchedFiles.length,
                nombres_archivos: matchedFiles.map(f => f.filename || f.name)
              };
            }
          }

          workerPayload.vinculacion_etapas_phva = vinculacionPHVA;

          results.push(workerPayload);
        }

        return JSON.stringify({
          mensaje: `Se procesaron exitosamente ${results.length} expediente(s) con cruce en cascada de todo el ecosistema de SomosSST.`,
          expedientes: results
        });
      }

      // ── RESUMEN EMPRESA (DASHBOARD METRICO GLOBAL Y CUMPLIMIENTO PHVA) ──
      if (accion === 'resumen_empresa') {
        const resumen = {
          total_trabajadores: 0,
          alertas_medicas_vencidas_o_ausentes: 0,
          perfiles_cargo_configurados: 0,
          matriz_peligros: {
            total_filas: 0,
            riesgos_inaceptables: 0
          },
          programa_capacitaciones: {
            total_sesiones: 0,
            sesiones_completadas: 0,
            asistencia_general: '0%'
          },
          matriz_legal: {
            total_requisitos: 0,
            cumplimiento_porcentaje: '0%'
          },
          plan_emergencias_vulnerabilidades: {
            amenazas_detectadas: 0,
            brigadistas_evaluadores: 0
          },
          participacion_trabajadores: {
            total_reportes: 0
          },
          analisis_trabajo_seguro: {
            total_documentos: 0
          },
          metodo_owas_ergonomia: {
            total_observaciones: 0,
            alertas_criticas_cat3_cat4: 0
          },
          permisos_altura: {
            total_permisos: 0
          },
          estadisticas_siniestralidad_atel: {
            total_eventos_incidentes: 0,
            total_dias_incapacidad: 0
          },
          investigaciones_accidentes: {
            total_investigaciones: 0
          },
          reportes_actos_inseguros: {
            total_reportes: 0
          },
          revision_alta_direccion: {
            estado: 'No configurado',
            reviewer: 'No especificado'
          },
          boveda_legal_phva: {
            Planear: {
              diagnostico_inicial: { configurado: false, titulo: null, fecha: null, cumplimiento: '0%' },
              politica_sst: { configurado: false, titulo: null, fecha: null },
              objetivos_sst: { configurado: false, titulo: null, fecha: null },
              matriz_legal: { configurado: false, total_requisitos: 0, cumplimiento: '0%' },
              reglamento_higiene: { configurado: false, titulo: null, fecha: null },
              reglamento_interno_rit: { configurado: false, titulo: null, fecha: null },
              responsable_sgsst: { configurado: false, titulo: null, fecha: null, lider_asignado: null }
            },
            Hacer: {
              perfil_sociodemografico: { configurado: false, total_trabajadores: 0, alertas_vencidas: 0 },
              perfiles_cargo: { configurado: false, total_cargos: 0 },
              control_peligros_ipevar: { configurado: false, total_peligros: 0, riesgos_inaceptables: 0 },
              programa_capacitaciones: { configurado: false, total_sesiones: 0, asistencia: '0%' },
              analisis_vulnerabilidad: { configurado: false, amenazas_detectadas: 0, brigadistas_evaluadores: 0 },
              participacion_ipevar: { configurado: false, total_reportes: 0 },
              analisis_trabajo_seguro: { configurado: false, total_documentos: 0 },
              metodo_owas: { configurado: false, total_observaciones: 0, alertas_criticas: 0 },
              permiso_alturas: { configurado: false, total_permisos: 0 },
              estadisticas_atel: { configurado: false, total_eventos: 0, total_dias_incapacidad: 0 },
              investigacion_atel: { configurado: false, total_investigaciones: 0 },
              reporte_actos_inseguros: { configurado: false, total_reportes: 0 }
            },
            Verificar: {
              informe_auditoria: { configurado: false, titulo: null, fecha: null },
              revision_alta_direccion: { configurado: false, estado: 'No configurado', reviewer: 'No especificado', fecha: null }
            },
            Actuar: {
              matriz_acpm: { configurado: false, total_planes_o_archivos: 0 }
            }
          }
        };

        const currentDate = new Date();

        // Hito 1: Perfil Sociodemográfico
        if (socioData && socioData.trabajadores) {
          resumen.total_trabajadores = socioData.trabajadores.length;
          socioData.trabajadores.forEach(w => {
            if (w.fechaExamenMedico) {
              try {
                const diffTime = Math.abs(currentDate - new Date(w.fechaExamenMedico));
                if (Math.ceil(diffTime / (1000 * 60 * 60 * 24)) >= 300) {
                  resumen.alertas_medicas_vencidas_o_ausentes++;
                }
              } catch (e) {
                resumen.alertas_medicas_vencidas_o_ausentes++;
              }
            } else {
              resumen.alertas_medicas_vencidas_o_ausentes++;
            }
          });
        }

        // Hito 2: Perfiles de Cargo
        if (PerfilCargoModel) {
          const cargoDoc = await PerfilCargoModel.findOne({ user: userId, companyId }).lean();
          if (cargoDoc && cargoDoc.perfiles) {
            resumen.perfiles_cargo_configurados = cargoDoc.perfiles.length;
          }
        }

        // Hito 3: Matriz Peligros IPEVAR
        if (MatrizPeligrosModel) {
          const matrizDoc = await MatrizPeligrosModel.findOne({ user: userId, companyId }).lean();
          if (matrizDoc && matrizDoc.procesos) {
            resumen.matriz_peligros.total_filas = matrizDoc.procesos.length;
            matrizDoc.procesos.forEach(p => {
              const nr = p.nr || 0;
              const aceptabilidad = String(p.aceptabilidad || '').toLowerCase();
              if (nr >= 150 || aceptabilidad.includes('no aceptable') || aceptabilidad === 'no') {
                resumen.matriz_peligros.riesgos_inaceptables++;
              }
            });
          }
        }

        // Hito 4: Capacitaciones
        if (ProgramaCapacitacionesModel) {
          const capDoc = await ProgramaCapacitacionesModel.findOne({ user: userId, companyId }).lean();
          if (capDoc && capDoc.sesiones) {
            resumen.programa_capacitaciones.total_sesiones = capDoc.sesiones.length;
            resumen.programa_capacitaciones.sesiones_completadas = capDoc.sesiones.filter(s => s.estado === 'Completada').length;

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
              resumen.programa_capacitaciones.asistencia_general = `${Math.round((totalAsistio / totalReg) * 100)}%`;
            }
          }
        }

        // Hito 5: Matriz Legal
        if (MatrizLegalModel) {
          const legalDoc = await MatrizLegalModel.findOne({ user: userId, companyId }).lean();
          if (legalDoc && legalDoc.statuses) {
            resumen.matriz_legal.total_requisitos = legalDoc.statuses.length;
            const cumpleCount = legalDoc.statuses.filter(s => s === 'cumple' || s.status === 'cumple').length;
            if (legalDoc.statuses.length > 0) {
              resumen.matriz_legal.cumplimiento_porcentaje = `${Math.round((cumpleCount / legalDoc.statuses.length) * 100)}%`;
            }
          }
        }

        // Hito 6: Emergencias y Vulnerabilidades
        if (AnalisisVulnerabilidadModel) {
          const vulnDoc = await AnalisisVulnerabilidadModel.findOne({ user: userId, companyId }).lean();
          if (vulnDoc) {
            resumen.plan_emergencias_vulnerabilidades.amenazas_detectadas = (vulnDoc.formData?.amenazasList || []).length;
            resumen.plan_emergencias_vulnerabilidades.brigadistas_evaluadores = (vulnDoc.evaluadoresList || []).length;
          }
        }

        // Hito 7: Participación IPEVAR de Trabajadores
        if (ParticipacionIpevarModel) {
          const partDoc = await ParticipacionIpevarModel.findOne({ user: userId, companyId }).lean();
          if (partDoc) {
            resumen.participacion_trabajadores.total_reportes = (partDoc.participacionesList || []).length + (partDoc.inboxPublico || []).length;
          }
        }

        // Hito 8: ATS (Análisis de Trabajo Seguro)
        if (AnalisisTrabajoSeguroModel) {
          const atsDoc = await AnalisisTrabajoSeguroModel.findOne({ user: userId, companyId }).lean();
          if (atsDoc) {
            resumen.analisis_trabajo_seguro.total_documentos = 1;
          }
        }

        // Hito 9: Método OWAS (Ergonomía)
        if (MetodoOwasModel) {
          const owasDoc = await MetodoOwasModel.findOne({ user: userId, companyId }).lean();
          if (owasDoc && owasDoc.observaciones) {
            resumen.metodo_owas_ergonomia.total_observaciones = owasDoc.observaciones.length;
            resumen.metodo_owas_ergonomia.alertas_criticas_cat3_cat4 = owasDoc.observaciones.filter(o => o.categoria === 3 || o.categoria === 4 || o.riesgo === 3 || o.riesgo === 4).length;
          }
        }

        // Hito 10: Permisos de Trabajo en Alturas
        if (PermisoAlturasModel) {
          const alturaDoc = await PermisoAlturasModel.findOne({ user: userId, companyId }).lean();
          if (alturaDoc) {
            resumen.permisos_altura.total_permisos = 1;
          }
        }

        // Hito 11: Estadísticas ATEL
        if (ATELAnnualModel) {
          const atelDocs = await ATELAnnualModel.find({ user: userId, companyId }).lean();
          atelDocs.forEach(annual => {
            if (annual.months) {
              const monthObj = annual.months instanceof Map ? Object.fromEntries(annual.months) : annual.months;
              Object.values(monthObj).forEach(m => {
                if (m.events) {
                  resumen.estadisticas_siniestralidad_atel.total_eventos_incidentes += m.events.length;
                  m.events.forEach(e => {
                    if (e.diasIncapacidad) resumen.estadisticas_siniestralidad_atel.total_dias_incapacidad += Number(e.diasIncapacidad);
                  });
                }
              });
            }
          });
        }

        // Hito 12: Investigaciones ATEL
        if (InvestigacionAtelModel) {
          const count = await InvestigacionAtelModel.countDocuments({ user: userId, companyId });
          resumen.investigaciones_accidentes.total_investigaciones = count;
        }

        // Reporte Actos Inseguros (Extra)
        if (ReporteActosModel) {
          const actosDoc = await ReporteActosModel.findOne({ user: userId, companyId }).lean();
          if (actosDoc) {
            resumen.reportes_actos_inseguros.total_reportes = (actosDoc.inboxPublico || []).length;
          }
        }

        // Alta Dirección (Extra)
        if (AltaDireccionModel) {
          const altaDoc = await AltaDireccionModel.findOne({ user: userId, companyId }).lean();
          if (altaDoc) {
            resumen.revision_alta_direccion.estado = altaDoc.reviewerInfo?.nombre ? 'Completado' : 'Configurado / Pendiente de Firma';
            resumen.revision_alta_direccion.reviewer = altaDoc.reviewerInfo?.nombre || 'No especificado';
          }
        }

        // ── POPULATE COHERENT PHVA STAGES COMPLIANCE (Bóveda Legal) ──────
        // 1. Diagnóstico Inicial
        const diagR = await getLatestReportMeta('sgsst-diagnostico');
        if (diagR) {
          resumen.boveda_legal_phva.Planear.diagnostico_inicial = {
            configurado: true,
            titulo: diagR.titulo,
            fecha: diagR.fecha_actualizacion,
            cumplimiento: extractCompliancePercentage(diagR.texto) || 'No especificado'
          };
        }

        // 2. Política SST
        const polR = await getLatestReportMeta('sgsst-politica');
        if (polR) {
          resumen.boveda_legal_phva.Planear.politica_sst = {
            configurado: true,
            titulo: polR.titulo,
            fecha: polR.fecha_actualizacion
          };
        }

        // 3. Objetivos SST
        const objR = await getLatestReportMeta('sgsst-objetivos');
        if (objR) {
          resumen.boveda_legal_phva.Planear.objetivos_sst = {
            configurado: true,
            titulo: objR.titulo,
            fecha: objR.fecha_actualizacion
          };
        }

        // 4. Matriz Legal
        if (MatrizLegalModel) {
          const legalDoc = await MatrizLegalModel.findOne({ user: userId, companyId }).lean();
          if (legalDoc && legalDoc.statuses && legalDoc.statuses.length > 0) {
            const cumpleCount = legalDoc.statuses.filter(s => s === 'cumple' || s.status === 'cumple').length;
            resumen.boveda_legal_phva.Planear.matriz_legal = {
              configurado: true,
              total_requisitos: legalDoc.statuses.length,
              cumplimiento: `${Math.round((cumpleCount / legalDoc.statuses.length) * 100)}%`
            };
          }
        }

        // 5. Reglamento Higiene
        const rhsR = await getLatestReportMeta('sgsst-reglamento-higiene');
        if (rhsR) {
          resumen.boveda_legal_phva.Planear.reglamento_higiene = {
            configurado: true,
            titulo: rhsR.titulo,
            fecha: rhsR.fecha_actualizacion
          };
        }

        // 6. Reglamento Interno RIT
        const ritR = await getLatestReportMeta('sgsst-reglamento-interno');
        if (ritR) {
          resumen.boveda_legal_phva.Planear.reglamento_interno_rit = {
            configurado: true,
            titulo: ritR.titulo,
            fecha: ritR.fecha_actualizacion
          };
        }

        // 7. Responsable SG-SST
        const respR = await getLatestReportMeta('sgsst-responsable');
        if (respR) {
          resumen.boveda_legal_phva.Planear.responsable_sgsst = {
            configurado: true,
            titulo: respR.titulo,
            fecha: respR.fecha_actualizacion,
            lider_asignado: extractResponsableName(respR.texto) || 'No especificado'
          };
        }

        // 8. Análisis Vulnerabilidad (Hacer)
        if (AnalisisVulnerabilidadModel) {
          const vulnDoc = await AnalisisVulnerabilidadModel.findOne({ user: userId, companyId }).lean();
          if (vulnDoc) {
            resumen.boveda_legal_phva.Hacer.analisis_vulnerabilidad = {
              configurado: true,
              amenazas_detectadas: (vulnDoc.formData?.amenazasList || []).length,
              brigadistas_evaluadores: (vulnDoc.evaluadoresList || []).length
            };
          }
        }

        // 9. Informe de Auditoría (Verificar)
        const audR = await getLatestReportMeta('sgsst-auditoria');
        if (audR) {
          resumen.boveda_legal_phva.Verificar.informe_auditoria = {
            configurado: true,
            titulo: audR.titulo,
            fecha: audR.fecha_actualizacion
          };
        }

        // 10. Revisión por Alta Dirección (Verificar)
        if (AltaDireccionModel) {
          const altaDoc = await AltaDireccionModel.findOne({ user: userId, companyId }).lean();
          if (altaDoc) {
            resumen.boveda_legal_phva.Verificar.revision_alta_direccion = {
              configurado: true,
              estado: altaDoc.reviewerInfo?.nombre ? 'Completado y Firmado' : 'Configurado / Pendiente de Firma',
              reviewer: altaDoc.reviewerInfo?.nombre || 'No especificado',
              fecha: altaDoc.reviewerInfo?.fecha || altaDoc.updatedAt
            };
          }
        }

        // 11. Matriz ACPM (Actuar)
        if (FileModel) {
          const acpmCount = await FileModel.countDocuments({
            user: userId,
            $or: [
              { sgsst_category: 'acpm' },
              { category: 'acpm' },
              { tag: 'acpm' }
            ]
          });
          resumen.boveda_legal_phva.Actuar.matriz_acpm = {
            configurado: acpmCount > 0,
            total_planes_o_archivos: acpmCount
          };
        }

        // Synchronize and populate Hacer sub-properties in boveda_legal_phva
        resumen.boveda_legal_phva.Hacer.perfil_sociodemografico = {
          configurado: resumen.total_trabajadores > 0,
          total_trabajadores: resumen.total_trabajadores,
          alertas_vencidas: resumen.alertas_medicas_vencidas_o_ausentes
        };
        resumen.boveda_legal_phva.Hacer.perfiles_cargo = {
          configurado: resumen.perfiles_cargo_configurados > 0,
          total_cargos: resumen.perfiles_cargo_configurados
        };
        resumen.boveda_legal_phva.Hacer.control_peligros_ipevar = {
          configurado: resumen.matriz_peligros.total_filas > 0,
          total_peligros: resumen.matriz_peligros.total_filas,
          riesgos_inaceptables: resumen.matriz_peligros.riesgos_inaceptables
        };
        resumen.boveda_legal_phva.Hacer.programa_capacitaciones = {
          configurado: resumen.programa_capacitaciones.total_sesiones > 0,
          total_sesiones: resumen.programa_capacitaciones.total_sesiones,
          asistencia: resumen.programa_capacitaciones.asistencia_general
        };
        resumen.boveda_legal_phva.Hacer.participacion_ipevar = {
          configurado: resumen.participacion_trabajadores.total_reportes > 0,
          total_reportes: resumen.participacion_trabajadores.total_reportes
        };
        resumen.boveda_legal_phva.Hacer.analisis_trabajo_seguro = {
          configurado: resumen.analisis_trabajo_seguro.total_documentos > 0,
          total_documentos: resumen.analisis_trabajo_seguro.total_documentos
        };
        resumen.boveda_legal_phva.Hacer.metodo_owas = {
          configurado: resumen.metodo_owas_ergonomia.total_observaciones > 0,
          total_observaciones: resumen.metodo_owas_ergonomia.total_observaciones,
          alertas_criticas: resumen.metodo_owas_ergonomia.alertas_criticas_cat3_cat4
        };
        resumen.boveda_legal_phva.Hacer.permiso_alturas = {
          configurado: resumen.permisos_altura.total_permisos > 0,
          total_permisos: resumen.permisos_altura.total_permisos
        };
        resumen.boveda_legal_phva.Hacer.estadisticas_atel = {
          configurado: resumen.estadisticas_siniestralidad_atel.total_eventos_incidentes > 0,
          total_eventos: resumen.estadisticas_siniestralidad_atel.total_eventos_incidentes,
          total_dias_incapacidad: resumen.estadisticas_siniestralidad_atel.total_dias_incapacidad
        };
        resumen.boveda_legal_phva.Hacer.investigacion_atel = {
          configurado: resumen.investigaciones_accidentes.total_investigaciones > 0,
          total_investigaciones: resumen.investigaciones_accidentes.total_investigaciones
        };
        resumen.boveda_legal_phva.Hacer.reporte_actos_inseguros = {
          configurado: resumen.reportes_actos_inseguros.total_reportes > 0,
          total_reportes: resumen.reportes_actos_inseguros.total_reportes
        };

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
