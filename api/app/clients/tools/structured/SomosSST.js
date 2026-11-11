const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');
const {
  normalizeBirthDateYmd,
  toUtcNoonDateOrNull,
  calculateAgeFromBirthDate,
} = require('~/server/routes/sgsst/birthDateHelper');

/**
 * SomosSST Tool
 * Permite al agente interactuar de manera integral con la plataforma SOMOS SST (anteriormente conocida como Gestor SG-SST en /sgsst),
 * la cual está dividida en 2 MÓDULOS PRINCIPALES:
 * 1. Módulo Motor Bio-Individual (Bio Motor): Gestión humana, huella biocéntrica y los 5 Hitos.
 * 2. Módulo Ecosistema SG-SST General: Gestión normativa, políticas, diagnósticos, capacitaciones y matrices de riesgo.
 */
class SomosSST extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'somos_sst';
    this.description =
      'Herramienta oficial de SOMOS SST (anteriormente SGSST). Permite consultar y editar cualquier información en sus 2 MÓDULOS PRINCIPALES: el Motor Bio-Individual (Bio Motor - expediente del trabajador, exámenes médicos, accidentes ATEL, Hitos) y el Ecosistema SG-SST General (matrices GTC45, EPP, alturas, ATS, capacitaciones, políticas y estadísticas en tiempo real).';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum([
          'consultar_expediente_integral',
          'listar_trabajadores',
          'resumen_empresa',
          'actualizar_examen_medico',
          'registrar_accidente_atel',
          'actualizar_hito_tarea',
          'editar_cualquier_aplicativo',
          'consultar_informacion_empresa',
          'actualizar_informacion_empresa',
          'generar_informe_html',
          'consultar_historial_informes',
          'consultar_planes_y_sistema',
          'consultar_centro_control_acpm',
          'crear_actividad_acpm',
          'actualizar_actividad_acpm',
          'crear_trabajador',
          'importar_sociodemografico_drive',
          'alimentar_sociodemografico_masivo',
          'importar_hito1_drive',
          'retirar_trabajador',
          'eliminar_trabajador',
          'actualizar_trabajador',
          'generar_informe_aplicativo',
          'registrar_equipo_alturas',
        ])
        .describe(
          'La acción a ejecutar: consultar_expediente_integral, listar_trabajadores, resumen_empresa, consultar_informacion_empresa, crear_trabajador, importar_sociodemografico_drive (alimentar Perfil Sociodemográfico y Condiciones de Salud desde Drive), importar_hito1_drive (buscar y alimentar aplicativos del Hito 1: Matriz IPEVR GTC-45, Matriz PESV, Matriz Compatibilidad SGA, Análisis de Vulnerabilidad, Diagnóstico 0312 o Responsable SST desde Google Drive con gemini-3.5-flash-lite), alimentar_sociodemografico_masivo, retirar_trabajador, actualizar_trabajador, eliminar_trabajador, actualizar_informacion_empresa, editar_cualquier_aplicativo, generar_informe_aplicativo (genera o extrae el informe oficial HTML corporativo de cualquiera de los 42 aplicativos Hito 1-8 y lo deja listo para Canvas/Email), registrar_equipo_alturas, generar_informe_html, consultar_historial_informes, consultar_planes_y_sistema, consultar_centro_control_acpm, crear_actividad_acpm, o actualizar_actividad_acpm.',
        ),
      modulo: z
        .string()
        .optional()
        .describe('Identificador del nodo Hito o aplicativo de Somos SST (ej: "hito1_dofa", "hito2_matriz_ipevar", "hito7_investigacion_atel", "contexto", "diagnostico", "equipos_alturas").'),
      hitoNodeId: z
        .string()
        .optional()
        .describe('ID canónico del nodo Hito activo (ej: "hito1_dofa", "hito3_owas", "hito7_auditoria") para generar_informe_aplicativo.'),
      forzar_regeneracion: z
        .boolean()
        .optional()
        .describe('Si es true en generar_informe_aplicativo, regenera el informe oficial HTML con datos en vivo de MongoDB.'),
      enfoque: z
        .string()
        .optional()
        .describe('Instrucciones o enfoque técnico adicional para generar_informe_aplicativo.'),
      razon_social: z.string().optional().describe('Razón Social o Nombre de la empresa.'),
      tipo_empresa: z.string().optional().describe('Tipo de empresa: "Persona Jurídica" o "Persona Natural".'),
      nit: z.string().optional().describe('NIT o documento de identificación tributaria de la empresa.'),
      representante_legal: z.string().optional().describe('Nombre del Representante Legal.'),
      cedula_representante: z.string().optional().describe('Cédula del Representante Legal.'),
      numero_trabajadores: z.coerce.number().optional().describe('Número total de trabajadores.'),
      arl: z.string().optional().describe('Nombre de la ARL a la que está afiliada la empresa (ej: Sura, Positiva, Colmena, Bolívar).'),
      actividad_economica: z.string().optional().describe('Actividad económica principal de la empresa.'),
      nivel_riesgo: z.string().optional().describe('Nivel de riesgo ARL principal (I, II, III, IV, V).'),
      ciiu: z.string().optional().describe('Código CIIU de la actividad económica.'),
      direccion: z.string().optional().describe('Dirección física de la sede principal.'),
      ciudad: z.string().optional().describe('Ciudad o municipio de la sede principal.'),
      departamento: z.string().optional().describe('Departamento de la sede principal.'),
      telefono: z.string().optional().describe('Teléfono de contacto de la empresa.'),
      correo: z.string().optional().describe('Correo electrónico institucional de la empresa.'),
      datos_json: z.string().optional().describe('Objeto JSON stringificado o texto con datos estructurados para inserción o actualización masiva en el aplicativo.'),
      tipo_informe: z
        .string()
        .optional()
        .describe('Tipo de informe HTML a generar (ej: "resumen_ejecutivo", "accidentalidad_atel", "expediente_trabajador", "matriz_peligros", "informe_clinico_preventivo").'),
      titulo_informe: z
        .string()
        .optional()
        .describe('Título del informe HTML.'),
      contenido_html: z
        .string()
        .optional()
        .describe('Contenido HTML personalizado o estructurado para el cuerpo del informe.'),
      nombre_o_cargo: z
        .string()
        .optional()
        .describe(
          'Nombre, apellido, cédula, ID, o Nombre del Cargo del trabajador a consultar o modificar (o nombre completo al crearlo con crear_trabajador).',
        ),
      cargo_trabajador: z
        .string()
        .optional()
        .describe('Cargo del trabajador al crearlo con crear_trabajador (ej: "Analista de Operaciones").'),
      fecha_nacimiento: z
        .string()
        .optional()
        .describe('Fecha de nacimiento del trabajador (ej: "1988-07-21" o "21/07/1988") para crear_trabajador o actualizar_trabajador.'),
      fechaNacimiento: z
        .string()
        .optional()
        .describe('Alias de fecha_nacimiento en formato YYYY-MM-DD.'),
      nombre_aplicativo: z
        .string()
        .optional()
        .describe('Nombre del aplicativo o módulo a editar (ej: "empresa", "cargos" (perfiles de cargo), "estudio_puesto" (EPT), "auditoria", "diagnostico", "epp", "alturas", "ats", "vehiculos", "capacitaciones", "gtc45", "owas", "actos", "vulnerabilidad", "plan_emergencias", "contexto", "oportunidades", "compras", "contratistas", "gestion_cambio", "quimicos", "kanban", "politica", "matriz_legal", "rhs", "rit").'),
      identificador_o_filtro: z
        .string()
        .optional()
        .describe('Cédula, nombre, código o filtro para ubicar el registro exacto dentro del aplicativo.'),
      campo_a_modificar: z
        .string()
        .optional()
        .describe('Nombre de la propiedad o campo a modificar en el aplicativo.'),
      nuevo_valor: z
        .string()
        .optional()
        .describe('El nuevo valor que se asignará al campo.'),
      fecha_examen: z
        .string()
        .optional()
        .describe('Fecha del examen médico en formato YYYY-MM-DD. Requerido para actualizar_examen_medico.'),
      diagnostico_medico: z
        .string()
        .optional()
        .describe('Concepto o diagnóstico del examen (ej: "Apto sin restricciones", "Apto con restricciones").'),
      restricciones_medicas: z
        .string()
        .optional()
        .describe('Restricciones o recomendaciones médicas asignadas al trabajador.'),
      fecha_accidente: z
        .string()
        .optional()
        .describe('Fecha del accidente o evento ATEL en formato YYYY-MM-DD (o extraída automáticamente si envías texto_furat_completo).'),
      tipo_evento: z
        .string()
        .optional()
        .describe('Tipo de evento ATEL: "AT" (Accidente de Trabajo), "EL" (Enfermedad Laboral), "Incidente", "Ausentismo".'),
      descripcion_accidente: z
        .string()
        .optional()
        .describe('Descripción detallada del accidente o suceso.'),
      dias_incapacidad: z.coerce
        .number()
        .optional()
        .describe('Número de días de incapacidad generados por el evento ATEL.'),
      gravedad: z
        .string()
        .optional()
        .describe('Gravedad del evento (ej: "Leve", "Grave", "Mortal").'),
      parte_cuerpo: z
        .string()
        .optional()
        .describe('Parte del cuerpo afectada en el accidente.'),
      cedula_trabajador: z
        .string()
        .optional()
        .describe('Cédula o número de documento del trabajador afectado en el evento ATEL.'),
      hora_accidente: z
        .string()
        .optional()
        .describe('Hora del accidente o incidente ATEL en formato HH:MM (24 horas).'),
      lugar_accidente: z
        .string()
        .optional()
        .describe('Sitio, área o sede donde ocurrió el accidente o incidente ATEL.'),
      actividad_momento: z
        .string()
        .optional()
        .describe('Actividad u ocupación que realizaba el trabajador en el momento del evento ATEL.'),
      agente_causal: z
        .string()
        .optional()
        .describe('Máquina, herramienta, superficie o agente causante del evento ATEL.'),
      naturaleza_lesion: z
        .string()
        .optional()
        .describe('Naturaleza de la lesión (ej: "Golpe / Contusión", "Herida / Laceración", "Fractura", "Esguince / Torcedura", "Sin lesión (Incidente)").'),
      texto_furat_completo: z
        .string()
        .optional()
        .describe('Texto completo extraído del formulario FURAT o reporte de accidente (ej. leído desde Google Drive) para mapear sus 23 campos y ejecutar la investigación Res. 1401 dentro del aplicativo.'),
      archivo_drive_id: z
        .string()
        .optional()
        .describe('ID del archivo origen en Google Drive para control de idempotencia y trazabilidad en Investigación ATEL.'),
      nombre_archivo_drive: z
        .string()
        .optional()
        .describe('Nombre del archivo origen en Google Drive (ej: "FURAT_Trabajador.pdf").'),
      nombre_tarea_o_hito: z
        .string()
        .optional()
        .describe('Nombre o descripción del hito o tarea del SG-SST a actualizar.'),
      nuevo_estado: z
        .string()
        .optional()
        .describe('Nuevo estado del hito o tarea (ej: "Completado", "En Proceso", "Pendiente", "done", "todo").'),
      titulo_actividad: z
        .string()
        .optional()
        .describe('Título de la actividad para el Centro de Control ACPM.'),
      descripcion_actividad: z
        .string()
        .optional()
        .describe('Descripción o detalles de la actividad ACPM.'),
      fecha_vencimiento: z
        .string()
        .optional()
        .describe('Fecha de vencimiento para la actividad ACPM (ej: YYYY-MM-DD o "mañana").'),
      estado_actividad: z
        .string()
        .optional()
        .describe('Estado de la actividad ACPM: "todo", "due_soon", "overdue", "done".'),
      tipo_actividad: z
        .string()
        .optional()
        .describe('Tipo de actividad ACPM: "manual", "medical_exam", "training", "other".'),
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

      // Helper to obtain the target company document (prioritizing req.companyId / assignedCompany before isActive)
      const getActiveCompanyDoc = async (uid) => {
        const explicitCompanyId =
          this.req?.companyId ||
          this.req?.body?.companyId ||
          (this.req?.user?.isSubUser && this.req?.user?.assignedCompany ? this.req.user.assignedCompany : null);
        if (explicitCompanyId && mongoose.Types.ObjectId.isValid(String(explicitCompanyId))) {
          const explicit = await CompanyInfo.findOne({ _id: explicitCompanyId, user: uid });
          if (explicit) return explicit;
        }
        let active = await CompanyInfo.findOne({ user: uid, isActive: true });
        if (!active) active = await CompanyInfo.findOne({ user: uid });
        return active;
      };

      const getActiveCompanyId = async (uid) => {
        const active = await getActiveCompanyDoc(uid);
        return active ? active._id : null;
      };

      const companyId = await getActiveCompanyId(userId);
      const activeCompanyId = companyId;
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

        let censusWidget = null;
        try {
          const { buildGenerativeWidgetForTool } = require('~/server/routes/voice/tenshiOpenBotEngine');
          censusWidget = buildGenerativeWidgetForTool('wappy_consultar_trabajadores', {}, { trabajadores });
        } catch (_) {}

        return JSON.stringify({
          mensaje: `Se encontraron ${trabajadores.length} trabajadores registrados en el Motor Bio-Individual.`,
          trabajadores: trabajadores,
          ...(censusWidget ? { widget: censusWidget } : {}),
        });
      }

      // ── ACTION: IMPORTAR PERFIL SOCIODEMOGRÁFICO Y CONDICIONES DE SALUD DESDE GOOGLE DRIVE / MASIVO ──
      if (
        accion === 'importar_sociodemografico_drive' ||
        accion === 'alimentar_sociodemografico_masivo' ||
        (accion === 'crear_trabajador' && input.datos_json)
      ) {
        const { importAndSyncSociodemografico } = require('~/server/routes/sgsst/sociodemograficoDriveService');
        const syncRes = await importAndSyncSociodemografico({
          userId,
          carpeta: input.nombre_o_cargo || input.identificador_o_filtro || '',
          archivo: input.campo_a_modificar || input.nuevo_valor || '',
          datos_json: input.datos_json || null,
        });
        return JSON.stringify(syncRes);
      }

      // ── ACTION: IMPORTAR APLICATIVOS DE HITO 1 DESDE GOOGLE DRIVE ─────────────
      if (accion === 'importar_hito1_drive') {
        const { importAndSyncHito1 } = require('~/server/routes/sgsst/hito1DriveService');
        const hito1Res = await importAndSyncHito1({
          userId,
          modulo: input.modulo || input.aplicativo || input.campo_a_modificar || 'auto',
          carpeta: input.nombre_o_cargo || input.identificador_o_filtro || '',
          archivo: input.nuevo_valor || '',
          fileId: input.datos_json?.fileId || '',
        });
        return JSON.stringify(hito1Res);
      }

      // ── ACTION: CREAR TRABAJADOR (CON INTEGRACIÓN AUTOMÁTICA DE EPT PENDIENTE) ─
      if (accion === 'crear_trabajador') {
        const rawName = input.nombre_o_cargo || '';
        const rawDoc = input.identificador_o_filtro || '';
        const rawCargo = input.cargo_trabajador || input.campo_a_modificar || 'Puesto Operativo / Administrativo';

        if (!rawName || !rawDoc) {
          return JSON.stringify({
            error: 'Debes proporcionar nombre_o_cargo (nombre completo) e identificador_o_filtro (cédula) para registrar al trabajador.',
          });
        }

        const cleanDoc = String(rawDoc).trim();
        const cleanName = String(rawName).trim();
        const cleanCargo = String(rawCargo).trim();

        // 1. Cargar o crear PerfilSociodemograficoData
        let perfil = PerfilSocioModel ? await PerfilSocioModel.findOne({ companyId }) : null;
        if (!perfil && PerfilSocioModel) {
          perfil = new PerfilSocioModel({
            user: userId,
            companyId,
            trabajadores: [],
          });
        }

        if (!perfil) {
          return JSON.stringify({ error: 'No se pudo acceder al modelo de Perfil Sociodemográfico.' });
        }

        let existingWorker = perfil.trabajadores.find(
          (w) => w.identificacion && String(w.identificacion).trim() === cleanDoc
        );

        // 2. Buscar si existen Estudios de Puesto de Trabajo (EPT) previos en el chat para esta cédula
        let integratedEpt = false;
        let eptSummary = '';
        try {
          const EstudioPuestoTrabajo = mongoose.models.EstudioPuestoTrabajo || require('~/models/EstudioPuestoTrabajo');
          if (EstudioPuestoTrabajo) {
            const previousStudies = await EstudioPuestoTrabajo.find({
              companyId,
              workerId: cleanDoc,
            }).sort({ createdAt: -1 });

            if (previousStudies && previousStudies.length > 0) {
              const latestEpt = previousStudies[0];
              integratedEpt = true;
              const dateStr = latestEpt.createdAt ? new Date(latestEpt.createdAt).toLocaleDateString('es-CO') : 'Reciente';
              eptSummary = `EPT Ergonómico Integrado (${dateStr}): ${latestEpt.cargo || cleanCargo}. Riesgo: ${latestEpt.riskLevel || 'Evaluado'}. Nivel de Acción: ${latestEpt.actionLevel || '1'}.`;

              // Actualizar los estudios previos con el nombre oficial del trabajador
              await EstudioPuestoTrabajo.updateMany(
                { companyId, workerId: cleanDoc },
                { $set: { workerName: cleanName, cargo: cleanCargo } }
              );
            }
          }
        } catch (eptErr) {
          console.warn('[SomosSST Tool] Error checking pending EPT for worker creation:', eptErr.message);
        }

        let parsedExtraJson = {};
        if (input.datos_json) {
          try {
            parsedExtraJson = typeof input.datos_json === 'string' ? JSON.parse(input.datos_json) : input.datos_json;
          } catch (_) {}
        }
        const rawBirthInput =
          input.fechaNacimiento ??
          input.fecha_nacimiento ??
          parsedExtraJson?.fechaNacimiento ??
          parsedExtraJson?.fecha_nacimiento;
        const normBirthYmd =
          rawBirthInput !== undefined ? normalizeBirthDateYmd(rawBirthInput) : '';
        const derivedAge = normBirthYmd
          ? calculateAgeFromBirthDate(normBirthYmd)
          : calculateAgeFromBirthDate('', parsedExtraJson?.edad);

        let workerResult;
        if (existingWorker) {
          existingWorker.nombre = cleanName;
          if (cleanCargo) existingWorker.cargo = cleanCargo;
          if (normBirthYmd) {
            existingWorker.fechaNacimiento = normBirthYmd;
            if (derivedAge !== undefined) existingWorker.edad = String(derivedAge);
          } else if (derivedAge !== undefined && !existingWorker.edad) {
            existingWorker.edad = String(derivedAge);
          }
          if (integratedEpt && (!existingWorker.diagnosticoMedico || !existingWorker.diagnosticoMedico.includes('EPT Ergonómico'))) {
            existingWorker.diagnosticoMedico = existingWorker.diagnosticoMedico
              ? `${existingWorker.diagnosticoMedico} | ${eptSummary}`
              : eptSummary;
          }
          workerResult = existingWorker;
        } else {
          const newWorkerEntry = {
            id: new mongoose.Types.ObjectId().toString(),
            nombre: cleanName,
            identificacion: cleanDoc,
            cargo: cleanCargo,
            ...(normBirthYmd ? { fechaNacimiento: normBirthYmd } : {}),
            ...(derivedAge !== undefined ? { edad: String(derivedAge) } : {}),
            diagnosticoMedico: integratedEpt ? eptSummary : '',
            recomendacionesMedicas: integratedEpt ? 'Seguimiento biomecánico e higiene postural según EPT previo.' : '',
            completedByAI: true,
          };
          perfil.trabajadores.push(newWorkerEntry);
          workerResult = newWorkerEntry;
        }

        perfil.markModified('trabajadores');
        await perfil.save();

        // Sincronizar conteo en CompanyInfo
        try {
          const activeCount = perfil.trabajadores.filter(w => {
            const est = (w.estadoLaboral || w.estado || '').toLowerCase().trim();
            return est !== 'retirado' && est !== 'inactivo';
          }).length;
          if (companyId) {
            const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
            await CompanyInfo.updateOne({ _id: companyId }, { $set: { workerCount: activeCount } }).catch(() => {});
          }
        } catch (_) {}

        // 3. Sincronizar en SgsstWorker
        if (SgsstWorkerModel) {
          const workerSetFields = {
            user: userId,
            companyId,
            documento: cleanDoc,
            nombre: cleanName,
            cargo: cleanCargo,
            perfilId: cleanDoc,
            condicionesSalud: integratedEpt ? eptSummary : '',
            updatedAt: new Date(),
          };
          if (workerResult.fechaNacimiento) {
            workerSetFields.fechaNacimiento = toUtcNoonDateOrNull(workerResult.fechaNacimiento, true);
          }
          await SgsstWorkerModel.findOneAndUpdate(
            { companyId, documento: cleanDoc },
            {
              $set: workerSetFields,
            },
            { upsert: true, new: true }
          ).catch((e) => console.warn('[SomosSST] SgsstWorker upsert err:', e.message));
        }

        return JSON.stringify({
          success: true,
          mensaje: integratedEpt
            ? `✅ Trabajador ${cleanName} (C.C. ${cleanDoc}) registrado con éxito en el Perfil Sociodemográfico. ¡Se detectó y vinculó automáticamente su Estudio de Puesto de Trabajo (EPT) previo realizado en el chat! (${eptSummary})`
            : `✅ Trabajador ${cleanName} (C.C. ${cleanDoc}, Cargo: ${cleanCargo}) registrado exitosamente en el Perfil Sociodemográfico de la empresa.`,
          trabajador: {
            nombre: cleanName,
            identificacion: cleanDoc,
            cargo: cleanCargo,
            fechaNacimiento: workerResult.fechaNacimiento || '',
            edad: workerResult.edad || '',
            eptIntegrado: integratedEpt,
            diagnosticoMedico: workerResult.diagnosticoMedico || '',
          },
        });
      }

      // ── ACTION: RETIRAR O DAR DE BAJA TRABAJADOR ──
      if (accion === 'retirar_trabajador' || accion === 'eliminar_trabajador') {
        const rawTarget = input.identificador_o_filtro || input.nombre_o_cargo || '';
        if (!rawTarget) {
          return JSON.stringify({ error: 'Debes proporcionar la cédula o nombre del trabajador a retirar.' });
        }
        const cleanTarget = String(rawTarget).trim();
        const motivo = input.campo_a_modificar || input.nuevo_valor || 'Terminación de contrato';
        const fecha = new Date().toISOString().split('T')[0];

        let perfil = PerfilSocioModel ? await PerfilSocioModel.findOne({ companyId }) : null;
        if (!perfil && !companyId && PerfilSocioModel) {
          perfil = await PerfilSocioModel.findOne({ user: userId });
        }

        let workerFound = null;
        if (perfil && Array.isArray(perfil.trabajadores)) {
          for (const w of perfil.trabajadores) {
            const match =
              String(w.id || '').trim().toLowerCase() === cleanTarget.toLowerCase() ||
              String(w.identificacion || '').trim() === cleanTarget ||
              (w.nombre && w.nombre.toLowerCase().includes(cleanTarget.toLowerCase()));
            if (match) {
              w.estadoLaboral = 'Retirado';
              w.fechaRetiro = fecha;
              w.motivoRetiro = motivo;
              workerFound = w;
              break;
            }
          }
          if (workerFound) {
            perfil.markModified('trabajadores');
            await perfil.save();

            // Sincronizar conteo en CompanyInfo
            try {
              const activeCount = perfil.trabajadores.filter(w => {
                const est = (w.estadoLaboral || w.estado || '').toLowerCase().trim();
                return est !== 'retirado' && est !== 'inactivo';
              }).length;
              if (companyId) {
                const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
                await CompanyInfo.updateOne({ _id: companyId }, { $set: { workerCount: activeCount } }).catch(() => {});
              }
            } catch (_) {}
          }
        }

        if (SgsstWorkerModel && workerFound) {
          await SgsstWorkerModel.updateMany(
            {
              user: userId,
              ...(companyId ? { companyId } : {}),
              $or: [
                { perfilId: workerFound.identificacion || cleanTarget },
                { documento: workerFound.identificacion || cleanTarget },
                { nombre: { $regex: new RegExp(workerFound.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
              ],
            },
            {
              $set: {
                estadoLaboral: 'Retirado',
                fechaRetiro: fecha,
                motivoRetiro: motivo,
              },
            }
          ).catch(() => {});
        }

        if (!workerFound) {
          return JSON.stringify({ error: `No se encontró al trabajador "${cleanTarget}" en la nómina para marcar como retirado.` });
        }

        return JSON.stringify({
          success: true,
          mensaje: `✅ Trabajador ${workerFound.nombre} (C.C. ${workerFound.identificacion || cleanTarget}) marcado como Retirado exitosamente en el Perfil Sociodemográfico. Se conserva su historial de 20 años y pasa a la pestaña 'Retirados'.`,
          trabajador: {
            nombre: workerFound.nombre,
            identificacion: workerFound.identificacion,
            estadoLaboral: 'Retirado',
            fechaRetiro: fecha,
            motivoRetiro: motivo,
          },
        });
      }

      // ── ACTION: ACTUALIZAR TRABAJADOR ──
      if (accion === 'actualizar_trabajador') {
        const rawTarget = input.identificador_o_filtro || input.nombre_o_cargo || '';
        if (!rawTarget) {
          return JSON.stringify({ error: 'Debes proporcionar la cédula o nombre del trabajador a actualizar.' });
        }
        const cleanTarget = String(rawTarget).trim();
        let perfil = PerfilSocioModel ? await PerfilSocioModel.findOne({ companyId }) : null;
        if (!perfil && !companyId && PerfilSocioModel) {
          perfil = await PerfilSocioModel.findOne({ user: userId });
        }

        let parsedUpdateJson = {};
        if (input.datos_json) {
          try {
            parsedUpdateJson = typeof input.datos_json === 'string' ? JSON.parse(input.datos_json) : input.datos_json;
          } catch (_) {}
        }

        let workerFound = null;
        if (perfil && Array.isArray(perfil.trabajadores)) {
          for (const w of perfil.trabajadores) {
            const match =
              String(w.id || '').trim().toLowerCase() === cleanTarget.toLowerCase() ||
              String(w.identificacion || '').trim() === cleanTarget ||
              (w.nombre && w.nombre.toLowerCase().includes(cleanTarget.toLowerCase()));
            if (match) {
              if (input.cargo_trabajador) w.cargo = input.cargo_trabajador;
              const rawFieldKey = String(input.campo_a_modificar || '').trim();
              const normFieldKey = rawFieldKey
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
              const isBirthFieldMod =
                normFieldKey === 'fechanacimiento' ||
                normFieldKey === 'fechadenacimiento' ||
                normFieldKey === 'nacimiento' ||
                normFieldKey === 'birthdate';

              if (rawFieldKey && input.nuevo_valor !== undefined) {
                if (isBirthFieldMod) {
                  w.fechaNacimiento = normalizeBirthDateYmd(input.nuevo_valor);
                } else {
                  w[rawFieldKey] = input.nuevo_valor;
                }
              }

              const explicitBirthUpdate =
                input.fechaNacimiento ??
                input.fecha_nacimiento ??
                parsedUpdateJson?.fechaNacimiento ??
                parsedUpdateJson?.fecha_nacimiento;
              if (explicitBirthUpdate !== undefined) {
                w.fechaNacimiento = normalizeBirthDateYmd(explicitBirthUpdate);
              }

              if (w.fechaNacimiento) {
                const normBirth = normalizeBirthDateYmd(w.fechaNacimiento);
                w.fechaNacimiento = normBirth;
                if (normBirth) {
                  const calcAge = calculateAgeFromBirthDate(normBirth);
                  if (calcAge !== undefined) {
                    w.edad = String(calcAge);
                  }
                }
              }

              workerFound = w;
              break;
            }
          }
          if (workerFound) {
            perfil.markModified('trabajadores');
            await perfil.save();

            // Sincronizar conteo en CompanyInfo
            try {
              const activeCount = perfil.trabajadores.filter(w => {
                const est = (w.estadoLaboral || w.estado || '').toLowerCase().trim();
                return est !== 'retirado' && est !== 'inactivo';
              }).length;
              if (companyId) {
                const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
                await CompanyInfo.updateOne({ _id: companyId }, { $set: { workerCount: activeCount } }).catch(() => {});
              }
            } catch (_) {}

            // Sincronizar también en SgsstWorker
            if (SgsstWorkerModel) {
              const swSet = {
                updatedAt: new Date(),
              };
              if (workerFound.nombre) swSet.nombre = workerFound.nombre;
              if (workerFound.cargo) swSet.cargo = workerFound.cargo;
              if (workerFound.genero) swSet.genero = workerFound.genero;
              if (workerFound.eps !== undefined) swSet.eps = workerFound.eps;
              if (workerFound.afp !== undefined) swSet.afp = workerFound.afp;
              if (workerFound.fechaNacimiento !== undefined) {
                swSet.fechaNacimiento = toUtcNoonDateOrNull(workerFound.fechaNacimiento, true);
              }
              await SgsstWorkerModel.updateMany(
                {
                  user: userId,
                  ...(companyId ? { companyId } : {}),
                  $or: [
                    { perfilId: workerFound.identificacion || cleanTarget },
                    { documento: workerFound.identificacion || cleanTarget },
                  ],
                },
                { $set: swSet }
              ).catch((e) => console.warn('[SomosSST] SgsstWorker update sync err:', e.message));
            }
          }
        }

        if (!workerFound) {
          return JSON.stringify({ error: `No se encontró al trabajador "${cleanTarget}" para actualizar.` });
        }

        return JSON.stringify({
          success: true,
          mensaje: `✅ Trabajador ${workerFound.nombre} actualizado exitosamente.`,
          trabajador: workerFound,
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
            const rawPerfiles = cargoDoc?.perfilesList || cargoDoc?.perfiles || [];
            if (Array.isArray(rawPerfiles) && rawPerfiles.length > 0) {
              const profile = rawPerfiles.find(p => {
                const pName = p.nombreCargo || p.nombre || '';
                return pName && pName.toLowerCase().trim() === wCargo.toLowerCase().trim();
              });
              if (profile) {
                workerPayload.hito_1_huella_biocentrica.perfil_del_cargo = {
                  nombreCargo: profile.nombreCargo || profile.nombre || wCargo,
                  descripcion: profile.descripcion || profile.funcionesPrincipales || 'Sin descripción',
                  educacion: profile.educacion || 'No especificado',
                  experiencia: profile.experiencia || 'No especificado',
                  responsabilidadesSST: profile.responsabilidadesSST || [],
                  restricciones: profile.restricciones || '',
                  examenesMedicos: profile.examenesMedicos || [],
                  elementosProteccion: profile.elementosProteccion || profile.epp || [],
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
        if (this.req?.user?.personalization?.memories === false) {
          return JSON.stringify({
            exito: false,
            mensaje: 'La memoria del usuario está desactivada. No hay métricas ni información corporativa disponibles.',
          });
        }
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
          const rawPerfiles = cargoDoc?.perfilesList || cargoDoc?.perfiles || [];
          if (Array.isArray(rawPerfiles)) {
            resumen.hito_1_huella_biocentrica_global.total_perfiles_cargo = rawPerfiles.length;
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

        // Fallback a Matriz Oficial IPEVAR / GTC45 si el modelo legacy no tiene datos
        if (resumen.hito_2_nucleo_bio_evaluativo_global.total_peligros_identificados === 0) {
          try {
            const GTC45WorkspaceSession = mongoose.models.GTC45WorkspaceSession || require('~/models/GTC45WorkspaceSession');
            if (GTC45WorkspaceSession) {
              const officialConvoId = `official-${companyId || userId}`;
              const gtcDoc = (await GTC45WorkspaceSession.findOne({ user: userId, ...(companyId ? { companyId } : {}), isOfficial: true }).lean())
                || (await GTC45WorkspaceSession.findOne({ conversationId: officialConvoId }).lean())
                || (!companyId ? await GTC45WorkspaceSession.findOne({ user: userId, 'matrixRows.0': { $exists: true } }).sort({ updatedAt: -1 }).lean() : null);
              if (gtcDoc && Array.isArray(gtcDoc.matrixRows)) {
                resumen.hito_2_nucleo_bio_evaluativo_global.total_peligros_identificados = gtcDoc.matrixRows.length;
                const distinctProc = new Set(gtcDoc.matrixRows.map(r => r.proceso).filter(Boolean));
                resumen.hito_2_nucleo_bio_evaluativo_global.total_procesos_evaluados = distinctProc.size || 1;
                gtcDoc.matrixRows.forEach(r => {
                  const nr = Number(r.nr || r.nivelRiesgo || 0);
                  const interp = String(r.interpretacion || r.aceptabilidad || '').toLowerCase();
                  if (nr >= 150 || interp.includes('no aceptable') || interp.includes('i')) {
                    resumen.hito_2_nucleo_bio_evaluativo_global.riesgos_inaceptables_ipevar++;
                  }
                });
              }
            }
          } catch (_) {}
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

      // ── ACTION: ACTUALIZAR EXAMEN MEDICO ───────────────────────────────────
      if (accion === 'actualizar_examen_medico') {
        if (!nombre_o_cargo) {
          return JSON.stringify({ error: 'Debes proporcionar la identificación o nombre del trabajador (nombre_o_cargo).' });
        }
        const queryStr = nombre_o_cargo.toLowerCase().trim();
        let updatedCount = 0;
        let workerName = '';

        // 1. Update in PerfilSociodemograficoData
        if (PerfilSocioModel) {
          const socioDoc = await PerfilSocioModel.findOne(queryObj);
          if (socioDoc && socioDoc.trabajadores) {
            let found = false;
            for (const t of socioDoc.trabajadores) {
              if (
                (t.nombre && t.nombre.toLowerCase().includes(queryStr)) ||
                (t.identificacion && String(t.identificacion).includes(queryStr))
              ) {
                if (input.fecha_examen) t.fechaExamenMedico = input.fecha_examen;
                if (input.diagnostico_medico) t.diagnosticoMedico = input.diagnostico_medico;
                if (input.restricciones_medicas) {
                  t.recomendacionesMedicas = input.restricciones_medicas;
                }
                workerName = t.nombre;
                found = true;
                updatedCount++;
              }
            }
            if (found) {
              socioDoc.markModified('trabajadores');
              await socioDoc.save();
            }
          }
        }

        // 2. Update in SgsstWorkerModel master record
        if (SgsstWorkerModel) {
          const masterWorker = await SgsstWorkerModel.findOne({
            ...queryObj,
            $or: [
              { nombre: { $regex: queryStr, $options: 'i' } },
              { documento: { $regex: queryStr, $options: 'i' } }
            ]
          });
          if (masterWorker) {
            if (input.diagnostico_medico) masterWorker.condicionesSalud = input.diagnostico_medico;
            await masterWorker.save();
            if (!workerName) workerName = masterWorker.nombre;
            updatedCount++;
          }
        }

        if (updatedCount === 0) {
          return JSON.stringify({ error: `No se encontró ningún trabajador coincidente con "${nombre_o_cargo}" para actualizar su examen médico.` });
        }

        return JSON.stringify({
          exito: true,
          mensaje: `Se actualizó exitosamente el expediente médico del trabajador "${workerName || nombre_o_cargo}".`,
          detalles: {
            fechaExamen: input.fecha_examen || 'Conservada',
            diagnostico: input.diagnostico_medico || 'Conservado',
            restricciones: input.restricciones_medicas || 'Conservadas'
          }
        });
      }

      // ── ACTION: REGISTRAR ACCIDENTE ATEL ────────────────────────────────────
      if (accion === 'registrar_accidente_atel') {
        let extraJsonFields = {};
        if (input.datos_json && typeof input.datos_json === 'string') {
          try {
            const parsed = JSON.parse(input.datos_json);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              extraJsonFields = parsed;
            }
          } catch (_) {
            // Si datos_json es texto libre, sumarlo como apoyo documental
          }
        }

        const rawDocText =
          input.texto_furat_completo ||
          (input.datos_json && Object.keys(extraJsonFields).length === 0 ? input.datos_json : '') ||
          '';

        if (!input.fecha_accidente && !extraJsonFields.fechaEvento && !extraJsonFields.fecha_accidente && !rawDocText.trim()) {
          return JSON.stringify({
            error: 'Debes proporcionar la fecha_accidente (YYYY-MM-DD) o el texto_furat_completo del reporte ATEL.',
          });
        }

        const {
          runAtelAppInvestigationPipeline,
        } = require('~/server/services/investigacionAtelPipelineService');

        const pipelineRes = await runAtelAppInvestigationPipeline({
          req: this.req,
          userId,
          companyId,
          inputFields: {
            ...extraJsonFields,
            nombre_o_cargo: nombre_o_cargo || extraJsonFields.afectadoNombre || '',
            afectadoNombre: extraJsonFields.afectadoNombre || nombre_o_cargo || '',
            cedula_trabajador: input.cedula_trabajador || extraJsonFields.afectadoCedula || '',
            cargo_trabajador: input.cargo_trabajador || extraJsonFields.afectadoCargo || '',
            fecha_accidente: input.fecha_accidente || extraJsonFields.fechaEvento || extraJsonFields.fecha_accidente || '',
            hora_accidente: input.hora_accidente || extraJsonFields.horaEvento || '',
            lugar_accidente: input.lugar_accidente || extraJsonFields.lugarEvento || '',
            departamento: input.departamento || extraJsonFields.departamento || '',
            municipio: input.ciudad || extraJsonFields.municipio || '',
            actividad_momento: input.actividad_momento || extraJsonFields.actividadMomento || '',
            tipo_evento: input.tipo_evento || extraJsonFields.tipoEvento || '',
            gravedad: input.gravedad || extraJsonFields.gravedad || '',
            descripcion_accidente: input.descripcion_accidente || extraJsonFields.descripcionHechos || '',
            naturaleza_lesion: input.naturaleza_lesion || extraJsonFields.naturalezaLesion || '',
            parte_cuerpo: input.parte_cuerpo || extraJsonFields.parteCuerpo || '',
            dias_incapacidad:
              input.dias_incapacidad !== undefined
                ? input.dias_incapacidad
                : extraJsonFields.diasIncapacidad,
            agente_causal: input.agente_causal || extraJsonFields.agenteCausal || '',
            afectadoArl: input.arl || extraJsonFields.afectadoArl || '',
          },
          rawDocumentText: rawDocText,
          sourceDriveFileId: input.archivo_drive_id || extraJsonFields.sourceDriveFileId || '',
          fileName: input.nombre_archivo_drive || extraJsonFields.sourceDriveFileName || '',
          generateOfficialReport: true,
          modelName: 'gemini-3.6-flash',
        });

        return JSON.stringify({
          exito: true,
          alreadyProcessed: Boolean(pipelineRes.alreadyProcessed),
          caseId: pipelineRes.caseId,
          aplicativoAlimentado: 'Investigación de Accidentes e Incidentes ATEL (Hito 7)',
          informeGeneradoEnAplicativo: Boolean(pipelineRes.reportHtml),
          reportConversationId: pipelineRes.reportConversationId || null,
          reportTitle: pipelineRes.reportTitle || null,
          urlInformeOficial: pipelineRes.reportConversationId
            ? `https://wappy.club/c/${pipelineRes.reportConversationId}`
            : null,
          mensaje: pipelineRes.alreadyProcessed
            ? `El caso ATEL (${pipelineRes.formData?.afectadoNombre || 'Trabajador'} — ${pipelineRes.formData?.fechaEvento || ''}) ya se encontraba registrado e investigado previamente en el aplicativo Investigación ATEL (control idempotente activo; no se duplicó el registro).`
            : `Se ejecutó exitosamente el pipeline real en el aplicativo Investigación ATEL (Hito 7): 1) Mapeo de los 23 campos FURAT y cruce 360° con Trabajadores/COPASST, 2) Registro en InvestigacionAtelData + ATELAnnualData + Hoja de Vida Bio-Individual, 3) Generación y guardado en Historial del Informe Oficial HTML Res. 1401 de 2007 (con 5 Porqués, Diagrama de Ishikawa SVG, Árbol de Causas y Firmas Digitales), y 4) Extracción del informe oficial hacia el flujo.`,
          formData: pipelineRes.formData,
          equipoList: pipelineRes.equipoList,
          testigosList: pipelineRes.testigosList,
          summaryMarkdown: pipelineRes.summaryMarkdown,
        });
      }

      // ── ACTION: ACTUALIZAR HITO TAREA ────────────────────────────────────────
      if (accion === 'actualizar_hito_tarea') {
        if (!input.nombre_tarea_o_hito) {
          return JSON.stringify({ error: 'Debes proporcionar el nombre_tarea_o_hito a actualizar.' });
        }
        const tareaStr = input.nombre_tarea_o_hito.toLowerCase().trim();
        const nuevoEstado = input.nuevo_estado || 'Completado';

        let updated = false;
        if (ProgramaCapacitacionesModel) {
          const capDoc = await ProgramaCapacitacionesModel.findOne(queryObj);
          if (capDoc && capDoc.sesiones) {
            for (const s of capDoc.sesiones) {
              if (s.tema && s.tema.toLowerCase().includes(tareaStr)) {
                s.estado = nuevoEstado;
                updated = true;
              }
            }
            if (updated) {
              capDoc.markModified('sesiones');
              await capDoc.save();
            }
          }
        }

        return JSON.stringify({
          exito: true,
          mensaje: `Se actualizó el estado de la tarea/hito "${input.nombre_tarea_o_hito}" a "${nuevoEstado}".`,
          detalles: {
            hito: input.nombre_tarea_o_hito,
            nuevoEstado
          }
        });
      }

      // ── ACTION: CONSULTAR INFORMACION DE LA EMPRESA (COMPANY INFO) ─────────
      if (accion === 'consultar_informacion_empresa') {
        if (this.req?.user?.personalization?.memories === false) {
          return JSON.stringify({
            exito: false,
            mensaje: 'La memoria del usuario está desactivada. No hay información de empresa disponible para este chat.',
          });
        }
        const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
        const targetUserId = (this.req?.user?.isSubUser && this.req?.user?.parentUser)
          ? this.req.user.parentUser
          : userId;

        let company = await getActiveCompanyDoc(targetUserId);

        if (!company) {
          return JSON.stringify({
            exito: false,
            mensaje: 'No se encontró información de empresa activa en SOMOS SST para este usuario.',
          });
        }

        let liveWorkerCount = company.workerCount;
        try {
          const socioDoc = PerfilSocioModel
            ? await PerfilSocioModel.findOne({ user: targetUserId, companyId: company._id }).lean()
            : null;
          if (socioDoc && Array.isArray(socioDoc.trabajadores)) {
            const activeWorkers = socioDoc.trabajadores.filter(w => {
              const est = (w.estadoLaboral || w.estado || '').toLowerCase().trim();
              return est !== 'retirado' && est !== 'inactivo';
            });
            liveWorkerCount = activeWorkers.length;
          }
        } catch (_) {}

        if (liveWorkerCount !== undefined && liveWorkerCount !== null && company.workerCount !== liveWorkerCount) {
          company.workerCount = liveWorkerCount;
          await company.save().catch(() => {});
        }

        return JSON.stringify({
          exito: true,
          mensaje: `Información de la empresa activa "${company.companyName || 'Sin Nombre'}" consultada exitosamente.`,
          empresa: {
            id: company._id,
            razon_social: company.companyName,
            tipo_empresa: company.companyType,
            nit: company.nit,
            representante_legal: company.legalRepresentative,
            cedula_representante: company.legalRepresentativeId,
            numero_trabajadores: liveWorkerCount ?? company.workerCount,
            numero_trabajadores_nomina_activa: liveWorkerCount ?? company.workerCount,
            arl: company.arl,
            actividad_economica: company.economicActivity,
            nivel_riesgo: company.riskLevel,
            ciiu: company.ciiu,
            direccion: company.address,
            ciudad: company.city,
            departamento: company.department,
            telefono: company.phone,
            correo: company.email,
            responsable_sst: company.responsibleSST,
            nivel_formacion_sst: company.formationLevel,
            licencia_sst: company.licenseNumber,
            vigencia_licencia: company.licenseExpiry,
            sedes: company.sedes || [],
          },
        });
      }

      // ── ACTION: ACTUALIZAR INFORMACION DE LA EMPRESA (COMPANY INFO) ─────────
      if (accion === 'actualizar_informacion_empresa') {
        const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
        let company = await getActiveCompanyDoc(userId);
        if (!company) {
          company = new CompanyInfo({ user: userId, isActive: true });
        }

        if (input.razon_social) company.companyName = input.razon_social.trim();
        if (input.tipo_empresa) company.companyType = input.tipo_empresa.trim();
        if (input.nit) company.nit = input.nit.trim();
        if (input.representante_legal) company.legalRepresentative = input.representante_legal.trim();
        if (input.cedula_representante) company.legalRepresentativeId = input.cedula_representante.trim();
        if (input.numero_trabajadores !== undefined) company.workerCount = Number(input.numero_trabajadores) || 0;
        if (input.arl) company.arl = input.arl.trim();
        if (input.actividad_economica) company.economicActivity = input.actividad_economica.trim();
        if (input.nivel_riesgo) company.riskLevel = input.nivel_riesgo.trim();
        if (input.ciiu) company.ciiu = input.ciiu.trim();
        if (input.direccion) company.address = input.direccion.trim();
        if (input.ciudad) company.city = input.ciudad.trim();
        if (input.departamento) company.department = input.departamento.trim();
        if (input.telefono) company.phone = input.telefono.trim();
        if (input.correo) company.email = input.correo.trim();

        await company.save();

        // Sincronizar memoria autónoma global para todos los agentes
        try {
          const { setMemory } = require('~/models');
          const memoryContent = `Razón Social / Nombre: ${company.companyName || 'N/A'}
Tipo de Empresa: ${company.companyType || 'Persona Jurídica'}
Documento de Identidad (NIT / CC): ${company.nit || 'N/A'}
Representante Legal: ${company.legalRepresentative || 'N/A'}
Cédula del Representante Legal: ${company.legalRepresentativeId || 'N/A'}
Número de Trabajadores: ${company.workerCount || 'N/A'}
ARL: ${company.arl || 'N/A'}
Nivel de Riesgo (ARL): ${company.riskLevel || 'N/A'}
Actividad Económica: ${company.economicActivity || 'N/A'}
Código CIIU: ${company.ciiu || 'N/A'}
Dirección: ${company.address || 'N/A'}
Ciudad: ${company.city || 'N/A'}
Departamento: ${company.department || 'N/A'}
Teléfono: ${company.phone || 'N/A'}
Correo: ${company.email || 'N/A'}`;

          await setMemory({
            userId,
            key: 'empresa_sgsst',
            value: memoryContent,
            agentId: 'global',
          });
        } catch (memErr) {
          console.warn('[SomosSST] Warning syncing company memory:', memErr.message);
        }

        return JSON.stringify({
          exito: true,
          mensaje: `Información de la empresa "${company.companyName || 'Activa'}" actualizada y sincronizada exitosamente con la memoria global de WAPPY IA.`,
          empresa: {
            id: company._id,
            razon_social: company.companyName,
            nit: company.nit,
            tipo_empresa: company.companyType,
            representante_legal: company.legalRepresentative,
            cedula_representante: company.legalRepresentativeId,
            numero_trabajadores: company.workerCount,
            arl: company.arl,
            nivel_riesgo: company.riskLevel,
            actividad_economica: company.economicActivity,
            ciiu: company.ciiu,
            direccion: company.address,
            ciudad: company.city,
            departamento: company.department,
            telefono: company.phone,
            correo: company.email
          }
        });
      }

      // ── ACTION: GENERAR INFORME OFICIAL DE APLICATIVO HITO (42 NODOS) ─────────
      if (accion === 'generar_informe_aplicativo') {
        const targetMod = (
          input.hitoNodeId ||
          input.modulo ||
          input.nombre_aplicativo ||
          input.tipo_informe ||
          ''
        ).trim();
        if (!targetMod) {
          return JSON.stringify({
            exito: false,
            error:
              'Debes especificar el parámetro "modulo" o "hitoNodeId" del aplicativo Hito (ej: "hito1_dofa", "hito2_matriz_ipevar", "hito7_investigacion_atel").',
          });
        }

        const {
          resolveHitoReportSpec,
          generateOrExtractOfficialAppReport,
        } = require('~/server/services/hitoAppReportPipelineService');

        const spec = resolveHitoReportSpec(targetMod);
        if (!spec) {
          return JSON.stringify({
            exito: false,
            error: `El módulo "${targetMod}" no corresponde a ninguno de los aplicativos Hito registrados.`,
          });
        }

        const reportResult = await generateOrExtractOfficialAppReport({
          userId,
          companyId: activeCompanyId,
          hitoNodeId: spec.hitoNodeId,
          forceRegenerate: Boolean(input.forzar_regeneracion),
          generateIfMissing: true,
          customInstructions: input.enfoque || input.contenido_html || input.datos_json || '',
          req: this.req,
        });

        return JSON.stringify({
          exito: Boolean(reportResult?.found && reportResult?.reportHtml),
          mensaje: reportResult?.reusedExisting
            ? `Informe oficial existente recuperado para "${spec.reportTitle}" (${reportResult.charCount} caracteres HTML) y vinculado al flujo.`
            : `Informe oficial HTML generado y persistido exitosamente para "${spec.reportTitle}" (${reportResult?.charCount || 0} caracteres HTML).`,
          hitoNodeId: spec.hitoNodeId,
          appId: spec.sgsstAppId,
          reportTitle: reportResult?.reportTitle || spec.reportTitle,
          reportConversationId: reportResult?.reportConversationId || null,
          fileNameSlug: reportResult?.fileNameSlug || null,
          charCount: reportResult?.charCount || 0,
          reusedExisting: Boolean(reportResult?.reusedExisting),
        });
      }

      // Helper compartido para registrar/actualizar Equipos de Protección Contra Caídas (SgsstHeightsData)
      const upsertHeightsEquipmentRecord = async ({ rawFilter, fieldKey, payloadVal }) => {
        if (!activeCompanyId) {
          return { exito: false, error: 'No hay una empresa activa configurada para registrar equipos de alturas.' };
        }
        const SgsstHeightsData = mongoose.models.SgsstHeightsData || require('~/models/SgsstHeightsData');
        const SgsstWorker = mongoose.models.SgsstWorker || require('~/models/SgsstWorker');
        const escapeRx = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const objData = payloadVal && typeof payloadVal === 'object' && !Array.isArray(payloadVal) ? payloadVal : {};
        const lookup = String(
          objData.workerId ||
            objData.documento ||
            objData.cedula ||
            input.cedula_trabajador ||
            rawFilter ||
            input.nombre_o_cargo ||
            '',
        ).trim();

        let workerDoc = null;
        if (lookup) {
          const rx = new RegExp(escapeRx(lookup), 'i');
          workerDoc = await SgsstWorker.findOne({
            companyId: activeCompanyId,
            $or: [{ documento: rx }, { nombre: rx }, { cargo: rx }],
          }).lean();
        }
        let socioWorker = null;
        if (!workerDoc && lookup && socioData && Array.isArray(socioData.trabajadores)) {
          const low = lookup.toLowerCase();
          socioWorker = socioData.trabajadores.find(
            (t) =>
              String(t.identificacion || t.id || '').toLowerCase().includes(low) ||
              String(t.nombre || '').toLowerCase().includes(low),
          );
        }

        const resolvedWorkerId = String(
          workerDoc?.documento ||
            socioWorker?.id ||
            socioWorker?.identificacion ||
            objData.workerId ||
            objData.documento ||
            lookup ||
            'TRAB-ALTURAS-01',
        ).trim();
        const resolvedWorkerName = String(
          workerDoc?.nombre ||
            socioWorker?.nombre ||
            objData.nombreTrabajador ||
            input.nombre_o_cargo ||
            'Trabajador Autorizado Alturas',
        ).trim();
        const resolvedCargo = String(
          workerDoc?.cargo || socioWorker?.cargo || objData.cargo || input.cargo_trabajador || 'Operativo Alturas',
        ).trim();

        let heightsDoc = await SgsstHeightsData.findOne({
          user: userId,
          companyId: activeCompanyId,
          workerId: resolvedWorkerId,
        });
        if (!heightsDoc) {
          heightsDoc = new SgsstHeightsData({
            user: userId,
            companyId: activeCompanyId,
            workerId: resolvedWorkerId,
            nombreTrabajador: resolvedWorkerName,
            cargo: resolvedCargo,
            equipos: [],
          });
        }

        const rawItems = Array.isArray(payloadVal)
          ? payloadVal
          : Array.isArray(objData.equipos)
            ? objData.equipos
            : [objData];

        for (const eq of rawItems) {
          if (!eq || typeof eq !== 'object' || Object.keys(eq).length === 0) {
            if (fieldKey && typeof payloadVal === 'string') {
              heightsDoc.equipos.push({
                id: `eq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                nombre: fieldKey === 'nombre' ? payloadVal : input.titulo_actividad || 'Arnés Cuerpo Completo',
                serial: `SN-${Date.now().toString().slice(-6)}`,
                estado: 'Vigente',
                resultadoInspeccion: 'Aprobado',
                observaciones: payloadVal,
              });
            }
            continue;
          }
          const eqSerial = String(eq.serial || eq.serie || eq.codigo || `SN-${Date.now().toString().slice(-6)}`).trim();
          const eqNombre = String(eq.nombre || eq.equipo || eq.tipo || 'Equipo Protección Contra Caídas').trim();
          const validRes = ['Aprobado', 'Rechazado', 'N/A'].includes(eq.resultadoInspeccion)
            ? eq.resultadoInspeccion
            : 'Aprobado';
          const validEst = ['Vigente', 'Vencido', 'Requiere Inspección', 'Retirado'].includes(eq.estado)
            ? eq.estado
            : 'Vigente';

          const existingIdx = heightsDoc.equipos.findIndex(
            (e) => (eq.id && e.id === eq.id) || (eq.serial && e.serial === eq.serial),
          );
          const normalizedEq = {
            id: eq.id || (existingIdx >= 0 ? heightsDoc.equipos[existingIdx].id : `eq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
            nombre: eqNombre,
            marca: eq.marca || '',
            referencia: eq.referencia || '',
            serial: eqSerial,
            fechaFabricacion: eq.fechaFabricacion || '',
            fechaCompra: eq.fechaCompra || '',
            fechaUltimaInspeccion: eq.fechaUltimaInspeccion || new Date().toISOString().slice(0, 10),
            fechaProximaInspeccion: eq.fechaProximaInspeccion || '',
            inspeccionadoPor: eq.inspeccionadoPor || 'Coordinador Trabajo en Alturas',
            resultadoInspeccion: validRes,
            estado: validEst,
            observaciones: eq.observaciones || '',
          };
          if (existingIdx >= 0) {
            heightsDoc.equipos[existingIdx] = { ...heightsDoc.equipos[existingIdx].toObject?.() || heightsDoc.equipos[existingIdx], ...normalizedEq };
          } else {
            heightsDoc.equipos.push(normalizedEq);
          }
        }

        heightsDoc.markModified('equipos');
        await heightsDoc.save();
        return {
          exito: true,
          mensaje: `Hoja de vida de equipos de alturas actualizada para "${resolvedWorkerName}" (${heightsDoc.equipos.length} equipos registrados).`,
          detalles: {
            aplicativo: 'Hoja de Vida e Inspección de Equipos de Alturas (Res. 4272/2021)',
            trabajador: resolvedWorkerName,
            workerId: resolvedWorkerId,
            totalEquipos: heightsDoc.equipos.length,
          },
        };
      };

      if (accion === 'registrar_equipo_alturas') {
        let parsedEq = input.datos_json;
        if (typeof parsedEq === 'string') {
          try {
            parsedEq = JSON.parse(parsedEq);
          } catch (_) {}
        }
        const resHeights = await upsertHeightsEquipmentRecord({
          rawFilter: input.identificador_o_filtro || input.cedula_trabajador || input.nombre_o_cargo || '',
          fieldKey: input.campo_a_modificar || '',
          payloadVal: parsedEq || (input.nuevo_valor !== undefined ? input.nuevo_valor : {}),
        });
        return JSON.stringify(resHeights);
      }

      // ── ACTION: EDITAR CUALQUIER APLICATIVO (UNIVERSAL MUTATION) ────────────
      if (accion === 'editar_cualquier_aplicativo') {
        const rawTargetApp = input.nombre_aplicativo || input.modulo || input.hitoNodeId;
        if (!rawTargetApp) {
          return JSON.stringify({ error: 'Debes proporcionar el nombre_aplicativo o modulo a editar.' });
        }
        if (!input.campo_a_modificar && !input.datos_json && input.nuevo_valor === undefined) {
          return JSON.stringify({ error: 'Debes proporcionar el campo_a_modificar, nuevo_valor o datos_json.' });
        }

        const appName = String(rawTargetApp).toLowerCase().trim();
        const rawFilterOriginal = (input.identificador_o_filtro || input.nombre_o_cargo || '').trim();
        const filterStr = rawFilterOriginal.toLowerCase();
        const escapeRx = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const fieldToEdit = (input.campo_a_modificar || '').trim();
        let parsedData = input.datos_json;
        if (typeof parsedData === 'string') {
          try {
            parsedData = JSON.parse(parsedData);
          } catch (_) {}
        }
        const newValue = input.nuevo_valor !== undefined ? input.nuevo_valor : parsedData;
        const makeItemId = (prefix = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        // ── 1. EMPRESA (CompanyInfo) ──────────────────────────────────────────
        if (appName === 'empresa' || appName === 'company' || appName === 'informacion_empresa') {
          const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
          let comp = await getActiveCompanyDoc(userId);
          if (!comp) comp = new CompanyInfo({ user: userId, isActive: true });

          const fieldMap = {
            'razon_social': 'companyName',
            'companyname': 'companyName',
            'nombre': 'companyName',
            'nit': 'nit',
            'tipo_empresa': 'companyType',
            'companytype': 'companyType',
            'representante_legal': 'legalRepresentative',
            'legalrepresentative': 'legalRepresentative',
            'cedula_representante': 'legalRepresentativeId',
            'legalrepresentativeid': 'legalRepresentativeId',
            'numero_trabajadores': 'workerCount',
            'workercount': 'workerCount',
            'arl': 'arl',
            'actividad_economica': 'economicActivity',
            'economicactivity': 'economicActivity',
            'nivel_riesgo': 'riskLevel',
            'risklevel': 'riskLevel',
            'ciiu': 'ciiu',
            'direccion': 'address',
            'address': 'address',
            'ciudad': 'city',
            'city': 'city',
            'departamento': 'department',
            'department': 'department',
            'telefono': 'phone',
            'phone': 'phone',
            'correo': 'email',
            'email': 'email',
            'responsable_sst': 'responsibleSST',
            'licencia_sst': 'licenseNumber',
            'vencimiento_licencia': 'licenseExpiry',
            'curso_50h': 'courseStatus',
          };

          if (newValue && typeof newValue === 'object' && !Array.isArray(newValue) && !fieldToEdit) {
            for (const [k, v] of Object.entries(newValue)) {
              const mapped = fieldMap[k.toLowerCase()] || k;
              comp[mapped] = v;
            }
          } else {
            const targetProp = fieldMap[fieldToEdit.toLowerCase()] || fieldToEdit;
            comp[targetProp] = newValue;
          }
          await comp.save();

          return JSON.stringify({
            exito: true,
            mensaje: `Información de la Empresa actualizada exitosamente.`,
            detalles: { aplicativo: 'Información de la Empresa', campo: fieldToEdit || 'datos_json', nuevoValor: newValue }
          });
        }

        // ── 2. ESTUDIO DE PUESTO DE TRABAJO (EPT — SgsstWorker por documento/nombre/cargo) ──
        if (appName.includes('estudio_puesto') || appName === 'ept' || appName.includes('puesto_trabajo')) {
          const EstudioPuestoTrabajo = mongoose.models.EstudioPuestoTrabajo || require('~/models/EstudioPuestoTrabajo');
          const SgsstWorker = mongoose.models.SgsstWorker || require('~/models/SgsstWorker');

          let workerDoc = null;
          if (rawFilterOriginal) {
            const rx = new RegExp(escapeRx(rawFilterOriginal), 'i');
            workerDoc = await SgsstWorker.findOne({
              ...(activeCompanyId ? { companyId: activeCompanyId } : { user: userId }),
              $or: [{ documento: rx }, { nombre: rx }, { cargo: rx }],
            });
          }

          const objPayload = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : {};
          const targetWorkerId = String(
            workerDoc?.documento || objPayload.workerId || objPayload.documento || rawFilterOriginal || 'GEN-01',
          ).trim();
          const targetWorkerName = String(
            workerDoc?.nombre || objPayload.workerName || input.nombre_o_cargo || 'Trabajador Evaluado',
          ).trim();
          const targetCargo = String(
            workerDoc?.cargo || objPayload.cargo || input.cargo_trabajador || 'Cargo Operativo',
          ).trim();

          let eptDoc = await EstudioPuestoTrabajo.findOne({
            ...(activeCompanyId ? { companyId: activeCompanyId } : { user: userId }),
            workerId: targetWorkerId,
          });

          if (!eptDoc) {
            eptDoc = new EstudioPuestoTrabajo({
              companyId: activeCompanyId,
              user: userId,
              workerId: targetWorkerId,
              workerName: targetWorkerName,
              cargo: targetCargo,
              evaluationType: objPayload.evaluationType || 'asistida',
              evaluatorName: objPayload.evaluatorName || 'Tenshi IA - Auditoría Biomecánica',
              channel: 'somos_sst',
              riskLevel: objPayload.riskLevel || 'Medio',
              actionLevel: objPayload.actionLevel || 'Nivel 2 (Se requieren cambios)',
              summaryRecommendation:
                objPayload.summaryRecommendation ||
                'Optimizar postura en estación de trabajo y realizar pausas activas dirigidas.',
            });
          }

          if (Object.keys(objPayload).length > 0 && (!fieldToEdit || fieldToEdit === 'estudio' || fieldToEdit === 'datos')) {
            for (const [k, v] of Object.entries(objPayload)) {
              if (k === 'telemetry' && typeof v === 'object') {
                eptDoc.telemetry = { ...(eptDoc.telemetry || {}), ...v };
              } else {
                eptDoc[k] = v;
              }
            }
          } else if (fieldToEdit && newValue !== undefined) {
            if (fieldToEdit === 'telemetry' && typeof newValue === 'object') {
              eptDoc.telemetry = { ...(eptDoc.telemetry || {}), ...newValue };
            } else {
              eptDoc[fieldToEdit] = newValue;
            }
          }
          await eptDoc.save();

          return JSON.stringify({
            exito: true,
            mensaje: `Estudio de Puesto de Trabajo (EPT) actualizado para "${targetWorkerName}" (${targetCargo}).`,
            detalles: {
              aplicativo: 'Estudio de Puesto de Trabajo (EPT)',
              trabajador: targetWorkerName,
              cedula: targetWorkerId,
              cargo: targetCargo,
              campo: fieldToEdit || 'registro_ept',
            },
          });
        }

        // ── 3. PERFILES DE CARGO (perfilesList + nombreCargo) ─────────────────
        if (appName.includes('cargo') || appName.includes('perfil_cargo')) {
          const PerfilCargoModel = modelLoader('PerfilCargoData', '~/server/routes/sgsst/perfilesCargo');
          let cargoDoc =
            (await PerfilCargoModel.findOne(queryObj)) ||
            (!companyId ? await PerfilCargoModel.findOne({ user: userId }) : null);
          if (!cargoDoc) {
            cargoDoc = new PerfilCargoModel({ user: userId, companyId: activeCompanyId, perfilesList: [] });
          }

          let perfilesList =
            Array.isArray(cargoDoc.perfilesList) && cargoDoc.perfilesList.length > 0
              ? [...cargoDoc.perfilesList]
              : Array.isArray(cargoDoc.perfiles)
                ? [...cargoDoc.perfiles]
                : [];

          let targetIndex = -1;
          if (filterStr) {
            targetIndex = perfilesList.findIndex((p) => {
              const cName = String(p.nombreCargo || p.nombre || '').toLowerCase();
              return (
                (cName && cName.includes(filterStr)) ||
                (p.id && String(p.id).toLowerCase().includes(filterStr))
              );
            });
          }

          const normalizeCargoItem = (rawItem) => {
            const base = rawItem && typeof rawItem === 'object' ? { ...rawItem } : {};
            const resolvedName = String(
              base.nombreCargo || base.nombre || input.nombre_o_cargo || rawFilterOriginal || 'Nuevo Cargo',
            ).trim();
            return {
              id: base.id || makeItemId('cargo'),
              nombreCargo: resolvedName,
              nombre: resolvedName,
              area: base.area || base.departamento || 'Operaciones / SST',
              departamento: base.departamento || base.area || 'Operaciones / SST',
              descripcion:
                base.descripcion ||
                (typeof rawItem === 'string' ? rawItem : 'Descripción y funciones del cargo en el SG-SST.'),
              educacion: base.educacion || 'Bachiller / Técnico o Profesional según rol',
              experiencia: base.experiencia || '6 meses a 1 año',
              responsabilidadesSST:
                base.responsabilidadesSST ||
                'Cumplir las normas, reglamentos e instrucciones del SG-SST y reportar actos/condiciones inseguras.',
              peligrosExpuestos: base.peligrosExpuestos || base.peligros || [],
              elementosProteccion: base.elementosProteccion || base.epp || [],
              examenesMedicos: base.examenesMedicos || [],
              restricciones: base.restricciones || '',
              ...base,
            };
          };

          if (Array.isArray(newValue)) {
            for (const item of newValue) {
              const norm = normalizeCargoItem(item);
              const idx = perfilesList.findIndex(
                (p) => String(p.nombreCargo || p.nombre || '').toLowerCase() === norm.nombreCargo.toLowerCase(),
              );
              if (idx >= 0) perfilesList[idx] = { ...perfilesList[idx], ...norm };
              else perfilesList.push(norm);
            }
          } else if (
            fieldToEdit === 'nuevo_cargo' ||
            fieldToEdit === 'agregar_cargo' ||
            (targetIndex === -1 && (!fieldToEdit || fieldToEdit === 'perfil' || typeof newValue === 'object'))
          ) {
            const norm = normalizeCargoItem(newValue);
            perfilesList.push(norm);
          } else if (targetIndex >= 0) {
            if (newValue && typeof newValue === 'object') {
              const merged = { ...perfilesList[targetIndex], ...newValue };
              const cName = merged.nombreCargo || merged.nombre;
              if (cName) {
                merged.nombreCargo = cName;
                merged.nombre = cName;
              }
              perfilesList[targetIndex] = merged;
            } else if (fieldToEdit) {
              perfilesList[targetIndex][fieldToEdit] = newValue;
              if (fieldToEdit === 'nombre' || fieldToEdit === 'nombreCargo') {
                perfilesList[targetIndex].nombreCargo = newValue;
                perfilesList[targetIndex].nombre = newValue;
              }
            }
          } else {
            return JSON.stringify({
              exito: false,
              error: `No se encontró el perfil de cargo "${rawFilterOriginal}" para modificar "${fieldToEdit}". Usa campo_a_modificar="nuevo_cargo" o envía un objeto en datos_json para crearlo.`,
            });
          }

          cargoDoc.perfilesList = perfilesList;
          cargoDoc.markModified('perfilesList');
          await cargoDoc.save();

          return JSON.stringify({
            exito: true,
            mensaje: `Módulo de Perfiles de Cargo actualizado exitosamente. Total perfiles: ${perfilesList.length}.`,
            detalles: {
              aplicativo: 'Perfiles de Cargo (Roles)',
              totalPerfiles: perfilesList.length,
              campo: fieldToEdit || 'perfilesList',
              filtro: rawFilterOriginal || 'General',
            },
          });
        }

        // ── 4. DIAGNÓSTICO RES. 0312 Y AUDITORÍA INTERNA (Actualización real en DiagnosticoData / AuditoriaData + Trazabilidad) ──
        if (appName.includes('auditoria') || appName.includes('diagnostico') || appName.includes('0312')) {
          const isAudit = appName.includes('auditoria');
          const StateModel = isAudit
            ? mongoose.models.AuditoriaData || require('~/models/AuditoriaData')
            : mongoose.models.DiagnosticoData || require('~/models/DiagnosticoData');
          const reportTag = isAudit ? 'sgsst-auditoria' : 'sgsst-diagnostico';
          const defaultTitle = isAudit
            ? 'Informe de Auditoría Interna SG-SST'
            : 'Diagnóstico Inicial Estándares Mínimos Res. 0312';

          let stateDoc = await StateModel.findOne(queryObj);
          if (!stateDoc) {
            stateDoc = new StateModel({
              user: userId,
              companyId: activeCompanyId,
              statusData: [],
            });
          }

          const statusList = Array.isArray(stateDoc.statusData) ? [...stateDoc.statusData] : [];
          const normalizeEvalStatus = (raw) => {
            const s = String(raw || '').toLowerCase().trim();
            if (['cumple', 'cumplido', 'conforme', 'si', 'sí', 'ok', '100%'].includes(s)) return 'cumple';
            if (['no_cumple', 'no cumple', 'incumple', 'no_conforme', 'no', '0%'].includes(s)) return 'no_cumple';
            if (['parcial', 'en_proceso', 'parcialmente'].includes(s)) return 'parcial';
            if (['no_aplica', 'na', 'n/a'].includes(s)) return 'no_aplica';
            return s || 'cumple';
          };

          const incomingItems = [];
          if (Array.isArray(newValue)) {
            incomingItems.push(...newValue);
          } else if (newValue && typeof newValue === 'object') {
            if (Array.isArray(newValue.statusData)) incomingItems.push(...newValue.statusData);
            else if (Array.isArray(newValue.statuses)) incomingItems.push(...newValue.statuses);
            else if (newValue.itemId || newValue.code || newValue.estandar || rawFilterOriginal) {
              incomingItems.push({
                itemId: newValue.itemId || newValue.code || newValue.estandar || rawFilterOriginal,
                code: newValue.code || newValue.estandar || newValue.itemId || rawFilterOriginal,
                status: newValue.status || newValue.estado || 'cumple',
                observation: newValue.observation || newValue.observacion || newValue.hallazgo || '',
                weight: newValue.weight,
              });
            }
            if (isAudit && newValue.auditorInfo && typeof newValue.auditorInfo === 'object') {
              stateDoc.auditorInfo = { ...(stateDoc.auditorInfo || {}), ...newValue.auditorInfo };
            }
          } else if (rawFilterOriginal || fieldToEdit) {
            const targetCode = rawFilterOriginal || fieldToEdit;
            incomingItems.push({
              itemId: targetCode,
              code: targetCode,
              status: normalizeEvalStatus(newValue),
              observation: input.descripcion_actividad || '',
            });
          }

          for (const rawIt of incomingItems) {
            if (!rawIt || typeof rawIt !== 'object') continue;
            const itemCode = String(rawIt.code || rawIt.itemId || rawIt.estandar || '').trim();
            const itemId = String(rawIt.itemId || rawIt.code || itemCode).trim();
            if (!itemId && !itemCode) continue;
            const normSt = normalizeEvalStatus(rawIt.status || rawIt.estado);
            const idx = statusList.findIndex(
              (x) =>
                (itemId && String(x.itemId || '') === itemId) ||
                (itemCode && String(x.code || '') === itemCode) ||
                (itemCode && String(x.itemId || '').includes(itemCode.replace(/\./g, '_'))),
            );
            const merged = {
              ...(idx >= 0 ? statusList[idx] : {}),
              itemId: idx >= 0 ? statusList[idx].itemId || itemId : itemId,
              code: idx >= 0 ? statusList[idx].code || itemCode : itemCode,
              status: normSt,
              observation:
                rawIt.observation ?? rawIt.observacion ?? rawIt.hallazgo ?? (idx >= 0 ? statusList[idx].observation : ''),
              ...(rawIt.weight !== undefined ? { weight: Number(rawIt.weight) } : {}),
            };
            if (idx >= 0) statusList[idx] = merged;
            else statusList.push(merged);
          }

          stateDoc.statusData = statusList;
          const evaluable = statusList.filter((s) => s && s.status && s.status !== 'pendiente');
          const applicable = evaluable.filter((s) => s.status !== 'no_aplica');
          const cumplidos = applicable.filter((s) => s.status === 'cumple').length;
          const parciales = applicable.filter((s) => s.status === 'parcial').length;
          const compliancePct =
            applicable.length > 0 ? Math.round(((cumplidos + parciales * 0.5) / applicable.length) * 100) : 0;

          if (isAudit) {
            stateDoc.compliancePercentage = compliancePct;
            stateDoc.weightedPercentage = compliancePct;
          } else {
            const hasWeights = statusList.some((s) => Number(s?.weight) > 0);
            if (hasWeights) {
              const earned = statusList.reduce((acc, s) => {
                const w = Number(s?.weight) || 0;
                if (s?.status === 'cumple' || s?.status === 'no_aplica') return acc + w;
                if (s?.status === 'parcial') return acc + w * 0.5;
                return acc;
              }, 0);
              stateDoc.score = Math.min(100, Math.round(earned * 100) / 100);
            } else {
              stateDoc.score = compliancePct;
            }
            stateDoc.compliancePercentage = compliancePct;
            stateDoc.complianceLevel =
              stateDoc.score >= 85 ? 'ACEPTABLE' : stateDoc.score >= 60 ? 'MODERADAMENTE ACEPTABLE' : 'CRÍTICO';
          }

          stateDoc.updatedAt = new Date();
          stateDoc.markModified('statusData');
          await stateDoc.save();

          let conversationId = null;
          try {
            const { saveConvo } = require('~/models/Conversation');
            const { saveMessage } = require('~/models/Message');
            const crypto = require('crypto');

            conversationId = crypto.randomUUID();
            const messageId = crypto.randomUUID();
            const dateStr = new Date().toLocaleString('es-CO');
            const reportTags = [reportTag, ...(activeCompanyId ? [`company-${activeCompanyId}`] : [])];

            const structuredState = JSON.stringify({
              statuses: statusList,
              compliancePercentage: stateDoc.compliancePercentage,
              score: stateDoc.score,
              complianceLevel: stateDoc.complianceLevel,
            });
            const fullReportText = `<!-- SGSST_AUDIT_DATA_V1:${structuredState} -->\n\n# ${input.titulo_informe || defaultTitle}\n**Fecha:** ${dateStr}\n**Cumplimiento Calculado:** ${stateDoc.compliancePercentage}%\n\n### Ítems Evaluados (${statusList.length}):\n${JSON.stringify(incomingItems, null, 2)}`;

            await saveConvo(
              this.req,
              {
                conversationId,
                title: `${defaultTitle} - ${dateStr}`,
                endpoint: reportTag,
                model: reportTag,
                tags: reportTags,
              },
              { context: 'SomosSST Tool Audit/Diagnostic Update' },
            );

            await saveMessage(
              this.req,
              {
                messageId,
                conversationId,
                text: fullReportText,
                sender: isAudit ? 'Auditor SG-SST' : 'SGSST Diagnóstico',
                isCreatedByUser: false,
                parentMessageId: '00000000-0000-0000-0000-000000000000',
              },
              { context: 'SomosSST Tool Audit/Diagnostic Message' },
            );
          } catch (auditErr) {
            console.warn('[SomosSST] Optional traceability convo save warning:', auditErr.message);
          }

          return JSON.stringify({
            exito: true,
            mensaje: `Se actualizó la colección oficial "${isAudit ? 'AuditoriaData' : 'DiagnosticoData'}" (${statusList.length} ítems registrados, cumplimiento: ${stateDoc.compliancePercentage}%).`,
            detalles: {
              aplicativo: defaultTitle,
              totalItemsEvaluados: statusList.length,
              compliancePercentage: stateDoc.compliancePercentage,
              score: stateDoc.score ?? stateDoc.compliancePercentage,
              complianceLevel: stateDoc.complianceLevel || undefined,
              conversationId,
            },
          });
        }

        // ── 5. EQUIPOS DE ALTURAS (ANTES de permiso_alturas) ──────────────────
        if (
          appName.includes('equipo_altura') ||
          appName.includes('equipos_altura') ||
          appName.includes('heights') ||
          appName === 'hito5_equipos_alturas'
        ) {
          const resHeights = await upsertHeightsEquipmentRecord({
            rawFilter: rawFilterOriginal,
            fieldKey: fieldToEdit,
            payloadVal: newValue,
          });
          return JSON.stringify(resHeights);
        }

        // ── 6. REGISTRO E INVENTARIO QUÍMICO (ANTES de compatibilidad SGA) ────
        if (
          appName.includes('registro_quimico') ||
          appName.includes('inventario_quimico') ||
          appName.includes('chemical') ||
          appName === 'hito5_registro_quimico'
        ) {
          const SgsstChemicalData = mongoose.models.SgsstChemicalData || require('~/models/SgsstChemicalData');
          let chemDoc = await SgsstChemicalData.findOne(queryObj);
          if (!chemDoc) {
            chemDoc = new SgsstChemicalData({ user: userId, companyId: activeCompanyId, productos: [] });
          }
          const rawProds = Array.isArray(newValue)
            ? newValue
            : newValue && typeof newValue === 'object' && Array.isArray(newValue.productos)
              ? newValue.productos
              : newValue && typeof newValue === 'object'
                ? [newValue]
                : [{ nombre: rawFilterOriginal || String(newValue || 'Producto Químico') }];

          const normYesNo = (v) => {
            if (v === true) return 'Sí';
            if (v === false) return 'No';
            const s = String(v || '').toLowerCase().trim();
            return ['si', 'sí', 'yes', 'true', '1'].includes(s) ? 'Sí' : 'No';
          };
          const normEstadoFisico = (v) => {
            const s = String(v || '').toLowerCase();
            if (s.includes('sol') || s.includes('sól') || s.includes('polvo')) return 'Sólido';
            if (s.includes('gas') || s.includes('vap')) return 'Gaseoso';
            return 'Líquido';
          };

          for (const p of rawProds) {
            if (!p || typeof p !== 'object') continue;
            const pName = String(p.nombre || p.producto || rawFilterOriginal || 'Producto Químico').trim();
            const idx = chemDoc.productos.findIndex(
              (x) => (p.id && x.id === p.id) || String(x.nombre || '').toLowerCase() === pName.toLowerCase(),
            );
            const normalized = {
              id: p.id || (idx >= 0 ? chemDoc.productos[idx].id : makeItemId('chem')),
              nombre: pName,
              fabricante: p.fabricante || (idx >= 0 ? chemDoc.productos[idx].fabricante : '') || '',
              estadoFisico: p.estadoFisico ? normEstadoFisico(p.estadoFisico) : (idx >= 0 ? chemDoc.productos[idx].estadoFisico : 'Líquido'),
              pictogramasSga: Array.isArray(p.pictogramasSga) ? p.pictogramasSga : (idx >= 0 ? chemDoc.productos[idx].pictogramasSga : []),
              claseOnu: p.claseOnu || p.clasificacion_onu || (idx >= 0 ? chemDoc.productos[idx].claseOnu : '') || '',
              ubicacion: p.ubicacion || (idx >= 0 ? chemDoc.productos[idx].ubicacion : '') || '',
              cantidadAlmacenada: p.cantidadAlmacenada || (idx >= 0 ? chemDoc.productos[idx].cantidadAlmacenada : '') || '',
              tieneFds: p.tieneFds !== undefined ? normYesNo(p.tieneFds) : (idx >= 0 ? chemDoc.productos[idx].tieneFds : 'No'),
              tieneRotuloSga: p.tieneRotuloSga !== undefined ? normYesNo(p.tieneRotuloSga) : (idx >= 0 ? chemDoc.productos[idx].tieneRotuloSga : 'No'),
              requisitosAlmacenamiento: p.requisitosAlmacenamiento || (idx >= 0 ? chemDoc.productos[idx].requisitosAlmacenamiento : '') || '',
              incompatibilidades: Array.isArray(p.incompatibilidades)
                ? p.incompatibilidades
                : p.incompatibilidades
                  ? [String(p.incompatibilidades)]
                  : (idx >= 0 ? chemDoc.productos[idx].incompatibilidades : []),
              trabajadoresExpuestos: Array.isArray(p.trabajadoresExpuestos) ? p.trabajadoresExpuestos : (idx >= 0 ? chemDoc.productos[idx].trabajadoresExpuestos : []),
              observaciones: p.observaciones || (idx >= 0 ? chemDoc.productos[idx].observaciones : '') || '',
            };
            if (fieldToEdit && typeof newValue !== 'object') {
              normalized[fieldToEdit] =
                fieldToEdit === 'tieneFds' || fieldToEdit === 'tieneRotuloSga' ? normYesNo(newValue) : newValue;
            }
            if (idx >= 0) chemDoc.productos[idx] = normalized;
            else chemDoc.productos.push(normalized);
          }

          chemDoc.markModified('productos');
          await chemDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Inventario Químico (SgsstChemicalData) actualizado exitosamente (${chemDoc.productos.length} productos).`,
            detalles: { aplicativo: 'Registro y Rótulo de Productos Químicos (SGA)', totalProductos: chemDoc.productos.length },
          });
        }

        // ── 7. MATRIZ DE COMPATIBILIDAD QUÍMICA SGA (ChemicalCompatibilitySession Oficial) ──
        if (
          appName.includes('compatibil') ||
          appName.includes('quimicos_sga') ||
          appName === 'quimicos' ||
          appName === 'hito3_quimicos_sga'
        ) {
          const ChemicalCompatibilitySession =
            mongoose.models.ChemicalCompatibilitySession || require('~/models/ChemicalCompatibilitySession');
          const officialConvId = `official-chem-${activeCompanyId || userId}`;
          let session = await ChemicalCompatibilitySession.findOne({ conversationId: officialConvId });
          if (!session) {
            session = new ChemicalCompatibilitySession({
              conversationId: officialConvId,
              user: userId,
              companyId: activeCompanyId,
              isOfficial: true,
              officialTitle: 'Matriz Oficial de Compatibilidad Química',
              matrixRows: [],
            });
          }
          const incomingRows = Array.isArray(newValue)
            ? newValue
            : newValue && typeof newValue === 'object' && Array.isArray(newValue.matrixRows)
              ? newValue.matrixRows
              : newValue && typeof newValue === 'object' && Array.isArray(newValue.productos)
                ? newValue.productos
                : newValue && typeof newValue === 'object'
                  ? [newValue]
                  : [];

          for (const r of incomingRows) {
            if (!r || typeof r !== 'object') continue;
            const rName = String(r.nombre || r.producto || rawFilterOriginal || 'Sustancia Química').trim();
            const idx = session.matrixRows.findIndex(
              (x) => (r.id && x.id === r.id) || String(x.nombre || '').toLowerCase() === rName.toLowerCase(),
            );
            const merged = { ...(idx >= 0 ? session.matrixRows[idx] : {}), ...r, nombre: rName };
            if (!merged.id) merged.id = makeItemId('sga');
            if (idx >= 0) session.matrixRows[idx] = merged;
            else session.matrixRows.push(merged);
          }
          if (incomingRows.length === 0 && fieldToEdit) {
            session[fieldToEdit] = newValue;
          }
          session.isOfficial = true;
          if (activeCompanyId) session.companyId = activeCompanyId;
          session.markModified('matrixRows');
          await session.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Matriz Oficial de Compatibilidad Química SGA actualizada (${session.matrixRows.length} sustancias).`,
            detalles: { aplicativo: 'Matriz de Compatibilidad Química SGA', conversationId: officialConvId, totalSustancias: session.matrixRows.length },
          });
        }

        // ── 8. FLOTA VEHICULAR E INSPECCIÓN PREOPERACIONAL (SgsstVehicleData por placa) ──
        if (appName.includes('vehicul') || appName.includes('flota') || appName === 'hito3_vehiculos') {
          const SgsstVehicleData = mongoose.models.SgsstVehicleData || require('~/models/SgsstVehicleData');
          const objVeh = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : {};
          const targetPlaca = String(objVeh.placa || rawFilterOriginal || 'VEH-001').toUpperCase().trim();

          let vehDoc = await SgsstVehicleData.findOne({
            user: userId,
            companyId: activeCompanyId,
            placa: targetPlaca,
          });
          if (!vehDoc) {
            vehDoc = new SgsstVehicleData({
              user: userId,
              companyId: activeCompanyId,
              placa: targetPlaca,
              marca: objVeh.marca || 'Genérica',
              referencia: objVeh.referencia || '',
              modelo: objVeh.modelo || String(new Date().getFullYear()),
              tipo: objVeh.tipo || objVeh.tipoVehiculo || 'Automóvil',
              conductorId: objVeh.conductorId || objVeh.conductorCedula || 'COND-01',
              conductorNombre: objVeh.conductorNombre || objVeh.conductor || input.nombre_o_cargo || 'Conductor Asignado',
              soatVencimiento: objVeh.soatVencimiento || new Date(Date.now() + 31536000000).toISOString().slice(0, 10),
              tecnomecanicaVencimiento: objVeh.tecnomecanicaVencimiento || '',
              kilometrajeActual: Number(objVeh.kilometrajeActual || objVeh.kilometraje || 0),
              inspecciones: [],
            });
          }

          if (fieldToEdit === 'inspeccion' || objVeh.inspeccion) {
            const insp = objVeh.inspeccion || objVeh;
            vehDoc.inspecciones.push({
              fecha: insp.fecha || new Date().toISOString().slice(0, 10),
              kilometraje: Number(insp.kilometraje || vehDoc.kilometrajeActual || 0),
              conductorNombre: insp.conductorNombre || vehDoc.conductorNombre,
              resultado: insp.resultado === 'Rechazado' ? 'Rechazado' : 'Aprobado',
              observaciones: insp.observaciones || '',
              ...insp,
            });
            vehDoc.markModified('inspecciones');
          } else if (Object.keys(objVeh).length > 0) {
            for (const [k, v] of Object.entries(objVeh)) {
              if (k !== '_id') vehDoc[k] = v;
            }
          } else if (fieldToEdit) {
            vehDoc[fieldToEdit] = newValue;
          }
          await vehDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Vehículo con placa "${targetPlaca}" actualizado exitosamente en Flota PESV.`,
            detalles: { aplicativo: 'Inspección y Control de Flota Vehicular', placa: targetPlaca, totalInspecciones: vehDoc.inspecciones.length },
          });
        }

        // ── 9. COMITÉ DE SEGURIDAD VIAL (SgsstPesvComite — ANTES de pesv general) ──
        if (appName.includes('comite_pesv') || appName === 'hito3_comite_pesv') {
          const { SgsstPesvComite } = require('~/models/SgsstCopasst');
          let csvDoc = await SgsstPesvComite.findOne(queryObj);
          if (!csvDoc) {
            csvDoc = new SgsstPesvComite({ user: userId, companyId: activeCompanyId, integrantes: [] });
          }
          if (newValue && typeof newValue === 'object') {
            if (Array.isArray(newValue.integrantes)) csvDoc.integrantes = newValue.integrantes;
            else if (newValue.liderPesv) csvDoc.liderPesv = newValue.liderPesv;
            else if (newValue.nombre) {
              csvDoc.integrantes.push({
                nombre: newValue.nombre,
                cedula: newValue.cedula || '000000',
                cargo: newValue.cargo || 'Integrante CSV',
                rol: newValue.rol || 'Vocal',
              });
            }
          }
          csvDoc.markModified('integrantes');
          await csvDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Comité de Seguridad Vial (CSV) actualizado (${csvDoc.integrantes.length} integrantes).`,
            detalles: { aplicativo: 'Comité de Seguridad Vial (CSV)', totalIntegrantes: csvDoc.integrantes.length },
          });
        }

        // ── 10. MATRIZ PESV OFICIAL (PESVWorkspaceSession) ────────────────────
        if (appName.includes('pesv') || appName === 'hito3_matriz_pesv') {
          const PESVWorkspaceSession =
            mongoose.models.PESVWorkspaceSession || require('~/models/PESVWorkspaceSession');
          const officialPesvId = `official-pesv-${activeCompanyId || userId}`;
          let session = await PESVWorkspaceSession.findOne({ conversationId: officialPesvId });
          if (!session) {
            session = new PESVWorkspaceSession({
              conversationId: officialPesvId,
              user: userId,
              companyId: activeCompanyId,
              isOfficial: true,
              officialTitle: 'Matriz Oficial de Riesgos Viales PESV',
              matrixRows: [],
            });
          }
          const incomingRows = Array.isArray(newValue)
            ? newValue
            : newValue && typeof newValue === 'object' && Array.isArray(newValue.matrixRows)
              ? newValue.matrixRows
              : newValue && typeof newValue === 'object' && Array.isArray(newValue.riesgos)
                ? newValue.riesgos
                : newValue && typeof newValue === 'object'
                  ? [newValue]
                  : [];

          for (const r of incomingRows) {
            if (!r || typeof r !== 'object') continue;
            const np = Number(r.np_cuantitativo) || 3;
            const ne = Number(r.ne_cuantitativo) || 3;
            const nc = Number(r.nc_cuantitativo) || 3;
            const cal = np + ne + nc;
            const row = {
              ...r,
              id: r.id || makeItemId('pesv'),
              np_cuantitativo: np,
              ne_cuantitativo: ne,
              nc_cuantitativo: nc,
              calificacion: cal,
              nivel_riesgo:
                cal >= 12 ? 'NIVEL DE RIESGO ALTO o CRITICO' : cal >= 8 ? 'NIVEL DE RIESGO MEDIO o MODERADO' : 'NIVEL DE RIESGO BAJO',
              aceptabilidad: cal >= 12 ? 'NO ACEPTABLE' : cal >= 8 ? 'ACEPTABLE CON CONTROL ESPECIFICO' : 'ACEPTABLE',
            };
            const idx = session.matrixRows.findIndex(
              (x) =>
                (r.id && x.id === r.id) ||
                (x.cargo && r.cargo && x.cargo.toLowerCase() === r.cargo.toLowerCase() && x.peligro_descripcion === r.peligro_descripcion),
            );
            if (idx >= 0) session.matrixRows[idx] = { ...session.matrixRows[idx], ...row };
            else session.matrixRows.push(row);
          }
          session.isOfficial = true;
          if (activeCompanyId) session.companyId = activeCompanyId;
          session.markModified('matrixRows');
          await session.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Matriz Oficial PESV actualizada (${session.matrixRows.length} riesgos viales).`,
            detalles: { aplicativo: 'Matriz de Riesgos Viales PESV', conversationId: officialPesvId, totalRiesgos: session.matrixRows.length },
          });
        }

        // ── 11. PARTICIPACIÓN IPEVAR COMUNITARIA (ANTES de bio_ipevar e ipevar) ──
        if (appName.includes('participacion')) {
          const ParticipacionModel = modelLoader('ParticipacionIpevarData', '~/server/routes/sgsst/participacionIpevar');
          let partDoc = await ParticipacionModel.findOne(queryObj);
          if (!partDoc) {
            partDoc = new ParticipacionModel({ user: userId, companyId: activeCompanyId, reportes: [] });
          }
          const itemObj = newValue && typeof newValue === 'object' ? newValue : { peligroReportado: String(newValue || ''), area: rawFilterOriginal };
          if (!Array.isArray(partDoc.reportes)) partDoc.reportes = [];
          partDoc.reportes.push({ id: makeItemId('part'), fecha: new Date().toISOString().slice(0, 10), ...itemObj });
          partDoc.markModified('reportes');
          await partDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Reporte de Participación IPEVAR registrado (${partDoc.reportes.length} participaciones).`,
            detalles: { aplicativo: 'Participación IPEVAR Comunitaria', totalReportes: partDoc.reportes.length },
          });
        }

        // ── 12. MATRIZ BIO-IPEVAR INDIVIDUAL (SgsstWorker.riesgosBioIndividual — separado de GTC-45) ──
        if (appName.includes('bio_ipevar') || appName.includes('riesgos_bio') || appName === 'hito4_bio_ipevar') {
          const SgsstWorker = mongoose.models.SgsstWorker || require('~/models/SgsstWorker');
          if (!rawFilterOriginal) {
            return JSON.stringify({
              exito: false,
              error: 'Para editar Matriz Bio-IPEVAR Individual debes indicar la cédula o nombre del trabajador en identificador_o_filtro o nombre_o_cargo.',
            });
          }
          const rx = new RegExp(escapeRx(rawFilterOriginal), 'i');
          const workerDoc = await SgsstWorker.findOne({
            ...(activeCompanyId ? { companyId: activeCompanyId } : { user: userId }),
            $or: [{ documento: rx }, { nombre: rx }],
          });
          if (!workerDoc) {
            return JSON.stringify({
              exito: false,
              error: `No se encontró al trabajador "${rawFilterOriginal}" en SgsstWorker para actualizar riesgosBioIndividual.`,
            });
          }
          const incomingBio = Array.isArray(newValue)
            ? newValue
            : newValue && typeof newValue === 'object' && Array.isArray(newValue.riesgosBioIndividual)
              ? newValue.riesgosBioIndividual
              : newValue && typeof newValue === 'object'
                ? [newValue]
                : [{ peligro: String(newValue || ''), campo: fieldToEdit }];

          if (!Array.isArray(workerDoc.riesgosBioIndividual)) workerDoc.riesgosBioIndividual = [];
          for (const item of incomingBio) {
            workerDoc.riesgosBioIndividual.push({ id: makeItemId('bio'), fecha: new Date().toISOString().slice(0, 10), ...item });
          }
          workerDoc.markModified('riesgosBioIndividual');
          await workerDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Matriz Bio-IPEVAR Individual actualizada para "${workerDoc.nombre}" (${workerDoc.riesgosBioIndividual.length} riesgos individuales).`,
            detalles: { aplicativo: 'Matriz Bio-IPEVAR Individual', trabajador: workerDoc.nombre, documento: workerDoc.documento },
          });
        }

        // ── 13. MATRIZ IPEVR GTC-45 OFICIAL (GTC45WorkspaceSession) ───────────
        if (
          appName.includes('gtc45') ||
          appName.includes('matriz_peligro') ||
          appName.includes('matriz_ipevar') ||
          appName === 'ipevar' ||
          appName === 'peligros' ||
          appName === 'hito2_matriz_ipevar'
        ) {
          const GTC45WorkspaceSession =
            mongoose.models.GTC45WorkspaceSession || require('~/models/GTC45WorkspaceSession');
          const officialGtcId = `official-${activeCompanyId || userId}`;
          let session = await GTC45WorkspaceSession.findOne({ conversationId: officialGtcId });
          if (!session) {
            session = new GTC45WorkspaceSession({
              conversationId: officialGtcId,
              user: userId,
              companyId: activeCompanyId,
              isOfficial: true,
              officialTitle: 'Matriz Oficial IPEVR GTC-45',
              matrixRows: [],
            });
          }

          const incomingRows = Array.isArray(newValue)
            ? newValue
            : newValue && typeof newValue === 'object' && Array.isArray(newValue.matrixRows)
              ? newValue.matrixRows
              : newValue && typeof newValue === 'object' && Array.isArray(newValue.riesgos)
                ? newValue.riesgos
                : newValue && typeof newValue === 'object'
                  ? [newValue]
                  : [];

          for (const riesgo of incomingRows) {
            if (!riesgo || typeof riesgo !== 'object') continue;
            const nd = Number(riesgo.nd ?? 2);
            const ne = Number(riesgo.ne ?? 2);
            const np = nd * ne;
            const nc = Number(riesgo.nc ?? 25);
            const nr = np * nc;
            const interpretacion_nr = nr >= 600 ? 'I' : nr >= 150 ? 'II' : nr >= 40 ? 'III' : 'IV';
            const aceptabilidad =
              interpretacion_nr === 'I'
                ? 'No Aceptable'
                : interpretacion_nr === 'II'
                  ? 'No Aceptable o Aceptable con Control Específico'
                  : interpretacion_nr === 'III'
                    ? 'Mejorable'
                    : 'Aceptable';

            const row = {
              proceso: riesgo.proceso || 'Operativo',
              cargo: riesgo.cargo || rawFilterOriginal || 'General',
              actividad: riesgo.actividad || 'Actividad operativa',
              ...riesgo,
              id: riesgo.id || makeItemId('gtc'),
              nd,
              ne,
              np,
              nc,
              nr,
              interpretacion_nr,
              aceptabilidad,
            };
            const idx = session.matrixRows.findIndex(
              (r) =>
                (riesgo.id && r.id === riesgo.id) ||
                (r.proceso?.toLowerCase() === row.proceso?.toLowerCase() &&
                  r.cargo?.toLowerCase() === row.cargo?.toLowerCase() &&
                  r.peligro_descripcion?.toLowerCase() === row.peligro_descripcion?.toLowerCase()),
            );
            if (idx >= 0) session.matrixRows[idx] = { ...session.matrixRows[idx], ...row, id: session.matrixRows[idx].id || row.id };
            else session.matrixRows.push(row);
          }

          session.isOfficial = true;
          if (activeCompanyId) session.companyId = activeCompanyId;
          session.markModified('matrixRows');
          await session.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Matriz Oficial IPEVR GTC-45 actualizada (${session.matrixRows.length} filas sincronizadas).`,
            detalles: { aplicativo: 'Matriz IPEVR GTC-45 Oficial', conversationId: officialGtcId, totalFilas: session.matrixRows.length },
          });
        }

        // ── 14. PLAN DE EMERGENCIAS PPRE (ANTES de vulnerabilidad/emergencias genérico) ──
        if (
          appName.includes('plan_emergencia') ||
          appName === 'ppre' ||
          appName === 'hito1_plan_emergencias' ||
          appName.includes('simulacro')
        ) {
          const PlanEmergenciasData =
            mongoose.models.PlanEmergenciasData || require('~/models/PlanEmergenciasData');
          let ppreDoc = await PlanEmergenciasData.findOne(queryObj);
          if (!ppreDoc) {
            ppreDoc = new PlanEmergenciasData({ user: userId, companyId: activeCompanyId });
          }

          const objPpre = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : null;
          const arrayFields = [
            'escenariosAmenaza',
            'estructuraSci',
            'procedimientosPon',
            'recursosEquipos',
            'directoriosExternos',
            'simulacrosPlan',
          ];

          const ensurePpreItemDefaults = (arrName, item) => {
            const it = item && typeof item === 'object' ? { ...item } : {};
            if (!it.id) it.id = makeItemId('ppre');
            if (arrName === 'escenariosAmenaza' && !it.amenaza) it.amenaza = it.titulo || String(newValue || 'Sismo / Incendio');
            if (arrName === 'estructuraSci' && !it.rolSci) it.rolSci = it.rol || 'Comandante del Incidente';
            if (arrName === 'procedimientosPon' && !it.tituloEscenario) it.tituloEscenario = it.titulo || 'PON General de Evacuación';
            if (arrName === 'recursosEquipos' && !it.descripcion) it.descripcion = it.nombre || 'Extintor Multipropósito ABC';
            if (arrName === 'directoriosExternos') {
              if (!it.entidad) it.entidad = 'Línea Única de Emergencias';
              if (!it.lineaTelefonica) it.lineaTelefonica = it.telefono || '123';
            }
            if (arrName === 'simulacrosPlan' && !it.tituloSimulacro) {
              it.tituloSimulacro = it.titulo || String(newValue || 'Simulacro Anual de Evacuación');
            }
            return it;
          };

          if (appName.includes('simulacro') && (!fieldToEdit || fieldToEdit === 'simulacro')) {
            const simItem = ensurePpreItemDefaults('simulacrosPlan', objPpre || { tituloSimulacro: String(newValue || 'Simulacro de Evacuación') });
            ppreDoc.simulacrosPlan.push(simItem);
            ppreDoc.markModified('simulacrosPlan');
          } else if (arrayFields.includes(fieldToEdit)) {
            const items = Array.isArray(newValue) ? newValue : [objPpre || { descripcion: String(newValue || '') }];
            for (const rawIt of items) {
              ppreDoc[fieldToEdit].push(ensurePpreItemDefaults(fieldToEdit, rawIt));
            }
            ppreDoc.markModified(fieldToEdit);
          } else if (fieldToEdit === 'sedeData' && objPpre) {
            ppreDoc.sedeData = { ...(ppreDoc.sedeData?.toObject?.() || ppreDoc.sedeData || {}), ...objPpre };
            ppreDoc.markModified('sedeData');
          } else if (objPpre) {
            for (const af of arrayFields) {
              if (Array.isArray(objPpre[af])) {
                for (const rawIt of objPpre[af]) ppreDoc[af].push(ensurePpreItemDefaults(af, rawIt));
                ppreDoc.markModified(af);
              }
            }
            if (objPpre.sedeData && typeof objPpre.sedeData === 'object') {
              ppreDoc.sedeData = { ...(ppreDoc.sedeData?.toObject?.() || ppreDoc.sedeData || {}), ...objPpre.sedeData };
              ppreDoc.markModified('sedeData');
            }
            if (objPpre.amenaza && !objPpre.escenariosAmenaza) {
              ppreDoc.escenariosAmenaza.push(ensurePpreItemDefaults('escenariosAmenaza', objPpre));
              ppreDoc.markModified('escenariosAmenaza');
            }
          } else if (fieldToEdit) {
            if (!ppreDoc.sedeData) ppreDoc.sedeData = {};
            ppreDoc.sedeData[fieldToEdit] = newValue;
            ppreDoc.markModified('sedeData');
          }

          await ppreDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE) actualizado exitosamente.`,
            detalles: {
              aplicativo: 'Plan de Emergencias (PPRE)',
              escenarios: ppreDoc.escenariosAmenaza?.length || 0,
              simulacros: ppreDoc.simulacrosPlan?.length || 0,
            },
          });
        }

        // ── 15. ANÁLISIS DE VULNERABILIDAD (Escribe estrictamente en doc.formData.amenazasList) ──
        if (appName.includes('vulnerabil') || appName === 'hito6_vulnerabilidad') {
          const VulnModel = modelLoader('AnalisisVulnerabilidadData', '~/server/routes/sgsst/analisisVulnerabilidad');
          let vulnDoc = await VulnModel.findOne(queryObj);
          if (!vulnDoc) {
            vulnDoc = new VulnModel({
              user: userId,
              companyId: activeCompanyId,
              formData: { amenazasList: [] },
            });
          }
          if (!vulnDoc.formData || typeof vulnDoc.formData !== 'object') {
            vulnDoc.formData = { amenazasList: [] };
          }
          if (!Array.isArray(vulnDoc.formData.amenazasList)) {
            vulnDoc.formData.amenazasList = [];
          }

          const incomingThreats = Array.isArray(newValue)
            ? newValue
            : newValue && typeof newValue === 'object' && Array.isArray(newValue.amenazasList)
              ? newValue.amenazasList
              : newValue && typeof newValue === 'object' && Array.isArray(newValue.formData?.amenazasList)
                ? newValue.formData.amenazasList
                : newValue && typeof newValue === 'object'
                  ? [newValue]
                  : [{ amenaza: rawFilterOriginal || String(newValue || 'Amenaza Identificada'), origen: 'Natural', probabilidad: 'Probable' }];

          for (const th of incomingThreats) {
            if (!th || typeof th !== 'object') continue;
            const tName = String(th.amenaza || th.nombre || rawFilterOriginal || 'Amenaza').trim();
            const idx = vulnDoc.formData.amenazasList.findIndex(
              (x) => (th.id && x.id === th.id) || String(x.amenaza || x.nombre || '').toLowerCase() === tName.toLowerCase(),
            );
            const merged = {
              ...(idx >= 0 ? vulnDoc.formData.amenazasList[idx] : {}),
              ...th,
              id: th.id || (idx >= 0 ? vulnDoc.formData.amenazasList[idx].id : makeItemId('vuln')),
              amenaza: tName,
            };
            if (idx >= 0) vulnDoc.formData.amenazasList[idx] = merged;
            else vulnDoc.formData.amenazasList.push(merged);
          }

          vulnDoc.updatedAt = new Date();
          vulnDoc.markModified('formData');
          await vulnDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Análisis de Vulnerabilidad actualizado en formData.amenazasList (${vulnDoc.formData.amenazasList.length} amenazas).`,
            detalles: {
              aplicativo: 'Análisis de Amenazas y Vulnerabilidad',
              totalAmenazas: vulnDoc.formData.amenazasList.length,
            },
          });
        }

        // ── 16. REVISIÓN POR LA ALTA DIRECCIÓN (Separado de Política/Objetivos/RHS/RIT) ──
        if (appName.includes('alta_direccion') || appName.includes('gerencia') || appName === 'hito7_alta_direccion') {
          const AltaDirModel = modelLoader('AltaDireccionData', '~/server/routes/sgsst/altaDireccion');
          let altaDoc = await AltaDirModel.findOne(queryObj);
          if (!altaDoc) {
            altaDoc = new AltaDirModel({ user: userId, companyId: activeCompanyId, statusData: [], reviewerInfo: {} });
          }
          if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
            if (Array.isArray(newValue.statusData)) altaDoc.statusData = newValue.statusData;
            if (newValue.reviewerInfo && typeof newValue.reviewerInfo === 'object') {
              altaDoc.reviewerInfo = { ...(altaDoc.reviewerInfo || {}), ...newValue.reviewerInfo };
            }
            if (newValue.itemId || newValue.status) {
              const idx = altaDoc.statusData.findIndex((s) => s.itemId === newValue.itemId);
              if (idx >= 0) altaDoc.statusData[idx] = { ...altaDoc.statusData[idx], ...newValue };
              else altaDoc.statusData.push(newValue);
            }
          } else if (Array.isArray(newValue)) {
            altaDoc.statusData = newValue;
          } else if (fieldToEdit) {
            if (['nombre', 'cargo', 'cedula', 'fecha'].includes(fieldToEdit)) {
              altaDoc.reviewerInfo = { ...(altaDoc.reviewerInfo || {}), [fieldToEdit]: newValue };
            } else {
              altaDoc.statusData.push({ itemId: rawFilterOriginal || fieldToEdit, status: String(newValue), observation: '' });
            }
          }
          altaDoc.updatedAt = new Date();
          altaDoc.markModified('statusData');
          altaDoc.markModified('reviewerInfo');
          await altaDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Revisión por la Alta Dirección actualizada exitosamente (${altaDoc.statusData.length} elementos revisados).`,
            detalles: { aplicativo: 'Revisión por la Alta Dirección', totalItems: altaDoc.statusData.length },
          });
        }

        // ── 17. MÓDULOS DOCUMENTALES HITO 1 (Política, Objetivos, RHS, RIT, Responsable SG-SST) ──
        if (
          appName.includes('politica') ||
          appName.includes('objetivo') ||
          appName === 'rhs' ||
          appName.includes('reglamento_higiene') ||
          appName === 'hito1_rhs' ||
          appName === 'rit' ||
          appName.includes('reglamento_interno') ||
          appName === 'hito1_rit' ||
          appName.includes('responsable')
        ) {
          let docNodeId = 'hito1_politica_objetivos';
          if (appName.includes('objetivo') && !appName.includes('politica')) docNodeId = 'hito1_objetivos';
          else if (appName === 'rhs' || appName.includes('reglamento_higiene') || appName === 'hito1_rhs') docNodeId = 'hito1_rhs';
          else if (appName === 'rit' || appName.includes('reglamento_interno') || appName === 'hito1_rit') docNodeId = 'hito1_rit';
          else if (appName.includes('responsable')) docNodeId = 'hito1_responsable';

          // Si es Responsable SG-SST y llegan campos de perfil del responsable, actualizar también CompanyInfo
          if (docNodeId === 'hito1_responsable') {
            const comp = await getActiveCompanyDoc(userId);
            if (comp) {
              const objR = newValue && typeof newValue === 'object' ? newValue : { [fieldToEdit]: newValue };
              if (objR.responsibleSST || objR.nombre || objR.responsable) {
                comp.responsibleSST = objR.responsibleSST || objR.nombre || objR.responsable;
              }
              if (objR.licenseNumber || objR.licencia) comp.licenseNumber = objR.licenseNumber || objR.licencia;
              if (objR.licenseExpiry || objR.vencimiento) comp.licenseExpiry = objR.licenseExpiry || objR.vencimiento;
              if (objR.courseStatus || objR.curso50h) comp.courseStatus = objR.courseStatus || objR.curso50h;
              await comp.save();
            }
          }

          const { generateOrExtractOfficialAppReport } = require('~/server/services/hitoAppReportPipelineService');
          const customInstructions =
            typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : `${fieldToEdit ? fieldToEdit + ': ' : ''}${String(newValue ?? '')}`;

          const genRes = await generateOrExtractOfficialAppReport({
            userId,
            companyId: activeCompanyId,
            hitoNodeId: docNodeId,
            forceRegenerate: true,
            customInstructions,
            req: this.req,
          });

          return JSON.stringify({
            exito: Boolean(genRes?.found),
            mensaje: `Documento oficial de "${genRes?.reportTitle || docNodeId}" generado y actualizado en el historial corporativo.`,
            detalles: {
              aplicativo: genRes?.reportTitle || docNodeId,
              hitoNodeId: docNodeId,
              reportConversationId: genRes?.reportConversationId || null,
              charCount: genRes?.charCount || 0,
            },
          });
        }

        // ── 18. TERMÓMETRO PSICOSOCIAL / ÁNIMO (MoodTelemetry.create) ─────────
        if (appName.includes('animo') || appName.includes('psicosocial') || appName === 'hito4_psicosocial') {
          if (!activeCompanyId) {
            return JSON.stringify({ exito: false, error: 'Se requiere una empresa activa para registrar telemetría psicosocial.' });
          }
          const MoodTelemetry = mongoose.models.MoodTelemetry || require('~/models/MoodTelemetry');
          const objMood = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : {};
          const rawMoodStr = String(objMood.mood || objMood.estado || (typeof newValue === 'string' ? newValue : 'neutral')).toLowerCase();
          const validMood =
            rawMoodStr.includes('happy') || rawMoodStr.includes('feliz') || rawMoodStr.includes('bien') || rawMoodStr.includes('motivad')
              ? 'happy'
              : rawMoodStr.includes('sad') || rawMoodStr.includes('triste') || rawMoodStr.includes('estres') || rawMoodStr.includes('agotad') || rawMoodStr.includes('alto')
                ? 'sad'
                : 'neutral';

          const createdMood = await MoodTelemetry.create({
            companyId: activeCompanyId,
            mood: validMood,
            stressors: Array.isArray(objMood.stressors)
              ? objMood.stressors
              : objMood.estresor
                ? [String(objMood.estresor)]
                : [],
            details: objMood.details || objMood.observaciones || (typeof newValue === 'string' ? newValue : ''),
            department: objMood.department || objMood.area || rawFilterOriginal || 'General',
            deviceId: objMood.deviceId || 'somos_sst_agent',
            isDemo: false,
          });

          return JSON.stringify({
            exito: true,
            mensaje: `Registro de Telemetría Psicosocial / Clima Laboral creado exitosamente (mood="${validMood}").`,
            detalles: { aplicativo: 'Batería de Riesgo Psicosocial / Clima', id: createdMood._id, mood: validMood },
          });
        }

        // ── 19. INVESTIGACIÓN PROFUNDA DE ACCIDENTES (Separado de investigacion_atel) ──
        if (appName.includes('investigacion_profunda') || appName === 'hito7_investigacion_profunda') {
          const { generateOrExtractOfficialAppReport } = require('~/server/services/hitoAppReportPipelineService');
          const genRes = await generateOrExtractOfficialAppReport({
            userId,
            companyId: activeCompanyId,
            hitoNodeId: 'hito7_investigacion_profunda',
            forceRegenerate: true,
            customInstructions: typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : String(newValue || ''),
            req: this.req,
          });
          return JSON.stringify({
            exito: Boolean(genRes?.found),
            mensaje: `Informe de Investigación Profunda ATEL generado y persistido exitosamente.`,
            detalles: { hitoNodeId: 'hito7_investigacion_profunda', reportConversationId: genRes?.reportConversationId },
          });
        }

        // ── 20. INVESTIGACIÓN FORENSE ATEL RES. 1401 (Multi-documento en InvestigacionAtelData, ANTES de estadisticas/atel) ──
        if (appName.includes('investigacion') || appName === 'hito7_investigacion_atel') {
          const crypto = require('crypto');
          const InvestigacionAtelData =
            mongoose.models.InvestigacionAtelData || require('~/models/InvestigacionAtelData');
          const objInv = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : {};
          const formIn = objInv.formData && typeof objInv.formData === 'object' ? objInv.formData : objInv;

          let invDoc = null;
          const lookupKey = String(objInv.id || formIn.afectadoCedula || rawFilterOriginal || '').trim();
          if (lookupKey) {
            const rx = new RegExp(escapeRx(lookupKey), 'i');
            invDoc = await InvestigacionAtelData.findOne({
              user: userId,
              ...(activeCompanyId ? { companyId: activeCompanyId } : {}),
              $or: [
                { id: lookupKey },
                { 'formData.afectadoCedula': rx },
                { 'formData.afectadoNombre': rx },
              ],
            });
          }

          if (!invDoc) {
            invDoc = new InvestigacionAtelData({
              id: objInv.id || crypto.randomUUID(),
              user: userId,
              companyId: activeCompanyId,
              title:
                objInv.title ||
                `Investigación ATEL - ${formIn.afectadoNombre || rawFilterOriginal || new Date().toISOString().slice(0, 10)}`,
              status: objInv.status || 'en_proceso',
              formData: {
                tipoEvento: formIn.tipoEvento || input.tipo_evento || 'Accidente Leve',
                fechaEvento: formIn.fechaEvento || input.fecha_accidente || new Date().toISOString().slice(0, 10),
                lugarEvento: formIn.lugarEvento || input.lugar_accidente || 'Sede Principal',
                afectadoNombre: formIn.afectadoNombre || input.nombre_o_cargo || '',
                afectadoCedula: formIn.afectadoCedula || input.cedula_trabajador || rawFilterOriginal || '',
                afectadoCargo: formIn.afectadoCargo || input.cargo_trabajador || '',
                descripcionHechos: formIn.descripcionHechos || input.descripcion_accidente || '',
                ...formIn,
              },
              equipoList: Array.isArray(objInv.equipoList) ? objInv.equipoList : [],
              testigosList: Array.isArray(objInv.testigosList) ? objInv.testigosList : [],
            });
          } else {
            if (Object.keys(formIn).length > 0) {
              invDoc.formData = { ...(invDoc.formData || {}), ...formIn };
              invDoc.markModified('formData');
            }
            if (Array.isArray(objInv.equipoList)) {
              invDoc.equipoList = objInv.equipoList;
              invDoc.markModified('equipoList');
            }
            if (Array.isArray(objInv.testigosList)) {
              invDoc.testigosList = objInv.testigosList;
              invDoc.markModified('testigosList');
            }
            if (fieldToEdit && typeof newValue !== 'object') {
              invDoc.formData = { ...(invDoc.formData || {}), [fieldToEdit]: newValue };
              invDoc.markModified('formData');
            }
          }

          await invDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Expediente de Investigación ATEL (${invDoc.id}) guardado exitosamente.`,
            detalles: { aplicativo: 'Investigación de Incidentes y Accidentes ATEL (Res. 1401)', id: invDoc.id, title: invDoc.title },
          });
        }

        // ── 21. ESTADÍSTICAS E INDICADORES ATEL (ATELAnnualData desde ~/server/routes/sgsst/atel-data) ──
        if (appName.includes('estadistica') || appName.includes('atel')) {
          const ATELModel = modelLoader('ATELAnnualData', '~/server/routes/sgsst/atel-data');
          if (!ATELModel) {
            return JSON.stringify({ exito: false, error: 'No se pudo cargar el modelo ATELAnnualData.' });
          }
          const objAtel = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : {};
          const targetYear = Number(objAtel.year || objAtel.anio || (/^\d{4}$/.test(rawFilterOriginal) ? rawFilterOriginal : new Date().getFullYear()));
          let atelDoc = await ATELModel.findOne({
            user: userId,
            ...(activeCompanyId ? { companyId: activeCompanyId } : {}),
            year: targetYear,
          });
          if (!atelDoc) {
            atelDoc = new ATELModel({
              user: userId,
              companyId: activeCompanyId,
              year: targetYear,
              monthlyData: [],
              casesList: [],
            });
          }
          if (Array.isArray(objAtel.monthlyData)) {
            atelDoc.monthlyData = objAtel.monthlyData;
            atelDoc.markModified('monthlyData');
          }
          if (Array.isArray(objAtel.casesList)) {
            atelDoc.casesList = objAtel.casesList;
            atelDoc.markModified('casesList');
          }
          if (objAtel.caso && typeof objAtel.caso === 'object') {
            if (!Array.isArray(atelDoc.casesList)) atelDoc.casesList = [];
            atelDoc.casesList.push({ id: makeItemId('atel'), ...objAtel.caso });
            atelDoc.markModified('casesList');
          }
          if (fieldToEdit && atelDoc[fieldToEdit] !== undefined) {
            atelDoc[fieldToEdit] = newValue;
            atelDoc.markModified(fieldToEdit);
          }
          await atelDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Estadísticas Anuales ATEL (${targetYear}) actualizadas exitosamente.`,
            detalles: { aplicativo: 'Estadísticas e Indicadores ATEL (Res. 0312)', year: targetYear },
          });
        }

        // ── 22. ENTREGA DE EPP (Multi-documento en SgsstEppData por workerId/documento) ──
        if (appName.includes('epp') || appName.includes('elementos') || appName === 'hito3_epp') {
          const SgsstEppData = mongoose.models.SgsstEppData || require('~/models/SgsstEppData');
          const SgsstWorker = mongoose.models.SgsstWorker || require('~/models/SgsstWorker');
          const objEpp = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : {};
          const lookup = String(
            objEpp.workerId || objEpp.documento || input.cedula_trabajador || rawFilterOriginal || input.nombre_o_cargo || '',
          ).trim();

          let workerDoc = null;
          if (lookup) {
            const rx = new RegExp(escapeRx(lookup), 'i');
            workerDoc = await SgsstWorker.findOne({
              ...(activeCompanyId ? { companyId: activeCompanyId } : { user: userId }),
              $or: [{ documento: rx }, { nombre: rx }],
            }).lean();
          }

          const resolvedDoc = String(workerDoc?.documento || objEpp.documento || lookup || 'DOC-EPP-01').trim();
          const resolvedWorkerId = String(objEpp.workerId || resolvedDoc).trim();
          const resolvedName = String(
            workerDoc?.nombre || objEpp.nombreTrabajador || input.nombre_o_cargo || 'Trabajador Receptor EPP',
          ).trim();

          let eppDoc = await SgsstEppData.findOne({
            user: userId,
            companyId: activeCompanyId,
            $or: [{ workerId: resolvedWorkerId }, { documento: resolvedDoc }],
          });
          if (!eppDoc) {
            eppDoc = new SgsstEppData({
              user: userId,
              companyId: activeCompanyId,
              workerId: resolvedWorkerId,
              documento: resolvedDoc,
              nombreTrabajador: resolvedName,
              cargo: workerDoc?.cargo || objEpp.cargo || input.cargo_trabajador || '',
              entregas: [],
            });
          }

          const rawItems = Array.isArray(newValue)
            ? newValue
            : Array.isArray(objEpp.entregas)
              ? objEpp.entregas
              : [objEpp];
          for (const it of rawItems) {
            const eppName = String(it?.nombre || it?.epp || (typeof newValue === 'string' ? newValue : 'EPP Certificado')).trim();
            eppDoc.entregas.push({
              id: it?.id || makeItemId('epp'),
              nombre: eppName,
              tipo: it?.tipo === 'Alturas' ? 'Alturas' : 'Regular',
              fechaEntrega: it?.fechaEntrega || new Date().toISOString().slice(0, 10),
              cantidad: Number(it?.cantidad || 1),
              estado: 'Entregado',
              observaciones: it?.observaciones || '',
            });
          }
          eppDoc.markModified('entregas');
          await eppDoc.save();
          return JSON.stringify({
            exito: true,
            mensaje: `Entrega de EPP registrada para "${resolvedName}" (${eppDoc.entregas.length} entregas acumuladas).`,
            detalles: { aplicativo: 'Matriz y Control de Entrega de EPP', trabajador: resolvedName, documento: resolvedDoc },
          });
        }

        // ── 23. PLAN DE TRABAJO / KANBAN ACPM (Multi-documento en KanbanTask por _id/title o create) ──
        if (
          appName.includes('kanban') ||
          appName.includes('tarea') ||
          appName.includes('plan_trabajo') ||
          appName.includes('acpm') ||
          appName === 'hito7_acpm'
        ) {
          const KanbanTask = mongoose.models.KanbanTask || require('~/models/KanbanTask');
          const objTask = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : {};
          let taskDoc = null;
          if (rawFilterOriginal) {
            if (mongoose.Types.ObjectId.isValid(rawFilterOriginal)) {
              taskDoc = await KanbanTask.findOne({ _id: rawFilterOriginal, user: userId });
            }
            if (!taskDoc) {
              taskDoc = await KanbanTask.findOne({
                user: userId,
                ...(activeCompanyId ? { companyId: activeCompanyId } : {}),
                title: new RegExp(escapeRx(rawFilterOriginal), 'i'),
              });
            }
          }

          if (taskDoc) {
            if (Object.keys(objTask).length > 0) Object.assign(taskDoc, objTask);
            else if (fieldToEdit) taskDoc[fieldToEdit] = newValue;
            await taskDoc.save();
          } else {
            taskDoc = await KanbanTask.create({
              user: userId,
              companyId: activeCompanyId,
              title: objTask.title || objTask.titulo || input.titulo_actividad || rawFilterOriginal || String(newValue || 'Acción Preventiva/Correctiva SG-SST'),
              description: objTask.description || objTask.descripcion || input.descripcion_actividad || '',
              status: objTask.status || input.estado_actividad || 'todo',
              priority: objTask.priority || 'medium',
              dueDate: objTask.dueDate || input.fecha_vencimiento || undefined,
              sourceModule: objTask.sourceModule || 'somos_sst',
            });
          }

          return JSON.stringify({
            exito: true,
            mensaje: `Tarea ACPM "${taskDoc.title}" guardada exitosamente en KanbanTask.`,
            detalles: { aplicativo: 'Plan de Trabajo Anual y Acciones ACPM', taskId: taskDoc._id, title: taskDoc.title, status: taskDoc.status },
          });
        }

        // ── 24. COMPRAS, CONTRATISTAS, GESTIÓN DEL CAMBIO Y OPORTUNIDADES SST (Push estructurado con ID) ──
        if (appName.includes('compra') || appName.includes('adquisicion') || appName === 'hito5_compras_sst') {
          const SgsstComprasData = mongoose.models.SgsstComprasData || require('~/models/SgsstComprasData');
          let docComp = (await SgsstComprasData.findOne(queryObj)) || new SgsstComprasData({ user: userId, companyId: activeCompanyId, compras: [] });
          const items = Array.isArray(newValue) ? newValue : newValue && typeof newValue === 'object' ? (Array.isArray(newValue.compras) ? newValue.compras : [newValue]) : [{ productoServicio: String(newValue || rawFilterOriginal || 'Adquisición SST') }];
          for (const it of items) {
            const pServ = String(it.productoServicio || it.nombre || it.producto || rawFilterOriginal || 'Elemento / Servicio SST').trim();
            const idx = docComp.compras.findIndex((c) => (it.id && c.id === it.id) || String(c.productoServicio || '').toLowerCase() === pServ.toLowerCase());
            const entry = { ...(idx >= 0 ? docComp.compras[idx].toObject?.() || docComp.compras[idx] : {}), ...it, id: it.id || (idx >= 0 ? docComp.compras[idx].id : makeItemId('cmp')), productoServicio: pServ };
            if (idx >= 0) docComp.compras[idx] = entry;
            else docComp.compras.push(entry);
          }
          docComp.markModified('compras');
          await docComp.save();
          return JSON.stringify({ exito: true, mensaje: `Compras SST actualizadas (${docComp.compras.length} registros).`, detalles: { aplicativo: 'Compras y Adquisiciones SST', totalCompras: docComp.compras.length } });
        }

        if (appName.includes('contratista') || appName.includes('proveedor') || appName === 'hito5_contratistas') {
          const SgsstContratistasData = mongoose.models.SgsstContratistasData || require('~/models/SgsstContratistasData');
          let docCont = (await SgsstContratistasData.findOne(queryObj)) || new SgsstContratistasData({ user: userId, companyId: activeCompanyId, contratistas: [] });
          const items = Array.isArray(newValue) ? newValue : newValue && typeof newValue === 'object' ? (Array.isArray(newValue.contratistas) ? newValue.contratistas : [newValue]) : [{ razonSocial: String(newValue || rawFilterOriginal || 'Contratista SST') }];
          for (const it of items) {
            const rSoc = String(it.razonSocial || it.nombre || rawFilterOriginal || 'Proveedor / Contratista').trim();
            const idx = docCont.contratistas.findIndex((c) => (it.id && c.id === it.id) || (it.nit && c.nit === it.nit) || String(c.razonSocial || '').toLowerCase() === rSoc.toLowerCase());
            const entry = { ...(idx >= 0 ? docCont.contratistas[idx].toObject?.() || docCont.contratistas[idx] : {}), ...it, id: it.id || (idx >= 0 ? docCont.contratistas[idx].id : makeItemId('ctr')), razonSocial: rSoc };
            if (idx >= 0) docCont.contratistas[idx] = entry;
            else docCont.contratistas.push(entry);
          }
          docCont.markModified('contratistas');
          await docCont.save();
          return JSON.stringify({ exito: true, mensaje: `Gestión de Contratistas actualizada (${docCont.contratistas.length} contratistas).`, detalles: { aplicativo: 'Gestión de Contratistas y Proveedores', totalContratistas: docCont.contratistas.length } });
        }

        if (appName.includes('cambio') || appName.includes('moc') || appName === 'hito5_gestion_cambio') {
          const SgsstGestionCambioData = mongoose.models.SgsstGestionCambioData || require('~/models/SgsstGestionCambioData');
          let docMoc = (await SgsstGestionCambioData.findOne(queryObj)) || new SgsstGestionCambioData({ user: userId, companyId: activeCompanyId, mocList: [] });
          const items = Array.isArray(newValue) ? newValue : newValue && typeof newValue === 'object' ? (Array.isArray(newValue.mocList) ? newValue.mocList : [newValue]) : [{ titulo: String(newValue || rawFilterOriginal || 'Cambio Organizacional / Técnico') }];
          for (const it of items) {
            const tit = String(it.titulo || it.nombre || rawFilterOriginal || 'Gestión del Cambio SST').trim();
            const idx = docMoc.mocList.findIndex((m) => (it.id && m.id === it.id) || String(m.titulo || '').toLowerCase() === tit.toLowerCase());
            const entry = { ...(idx >= 0 ? docMoc.mocList[idx].toObject?.() || docMoc.mocList[idx] : {}), ...it, id: it.id || (idx >= 0 ? docMoc.mocList[idx].id : makeItemId('moc')), titulo: tit };
            if (idx >= 0) docMoc.mocList[idx] = entry;
            else docMoc.mocList.push(entry);
          }
          docMoc.markModified('mocList');
          await docMoc.save();
          return JSON.stringify({ exito: true, mensaje: `Gestión del Cambio (MOC) actualizada (${docMoc.mocList.length} cambios).`, detalles: { aplicativo: 'Gestión del Cambio (MOC)', totalCambios: docMoc.mocList.length } });
        }

        if (appName.includes('oportunidad') || appName === 'hito1_oportunidades_sst') {
          const OportunidadesData = mongoose.models.OportunidadesData || require('~/models/OportunidadesData');
          let docOp = (await OportunidadesData.findOne(queryObj)) || new OportunidadesData({ user: userId, companyId: activeCompanyId, oportunidades: [], riesgosSistema: [] });
          const isRiesgoSistema = fieldToEdit === 'riesgosSistema' || (newValue && typeof newValue === 'object' && newValue.amenaza && !newValue.titulo);
          if (isRiesgoSistema) {
            const items = Array.isArray(newValue) ? newValue : [newValue];
            for (const it of items) {
              docOp.riesgosSistema.push({ id: it.id || makeItemId('rsis'), amenaza: String(it.amenaza || rawFilterOriginal || 'Riesgo del Sistema'), ...it });
            }
            docOp.markModified('riesgosSistema');
          } else {
            const items = Array.isArray(newValue) ? newValue : newValue && typeof newValue === 'object' ? (Array.isArray(newValue.oportunidades) ? newValue.oportunidades : [newValue]) : [{ titulo: String(newValue || rawFilterOriginal || 'Oportunidad de Mejora SST') }];
            for (const it of items) {
              const tit = String(it.titulo || it.oportunidad || rawFilterOriginal || 'Oportunidad SST').trim();
              docOp.oportunidades.push({ id: it.id || makeItemId('op'), titulo: tit, ...it });
            }
            docOp.markModified('oportunidades');
          }
          await docOp.save();
          return JSON.stringify({ exito: true, mensaje: `Oportunidades SST actualizadas (${docOp.oportunidades.length} oportunidades, ${docOp.riesgosSistema.length} riesgos del sistema).`, detalles: { aplicativo: 'Oportunidades para la SST (ISO 45001 Cl. 6.1.2.3)' } });
        }

        // ── 25. COMITÉS COPASST Y COCOLAB (SgsstCopasst / SgsstConvivencia) ────
        if (appName.includes('copasst') || appName === 'comites' || appName === 'hito4_comites') {
          const { SgsstCopasstComite, SgsstCopasstActa } = require('~/models/SgsstCopasst');
          const objC = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : {};
          if (fieldToEdit === 'acta' || objC.consecutivo || objC.temasTratados) {
            const now = new Date();
            const acta = await SgsstCopasstActa.create({
              user: userId,
              companyId: activeCompanyId,
              consecutivo: objC.consecutivo || `ACTA-COPASST-${Date.now().toString().slice(-4)}`,
              mes: Number(objC.mes || now.getMonth() + 1),
              anio: Number(objC.anio || now.getFullYear()),
              fecha: objC.fecha || now.toISOString().slice(0, 10),
              ...objC,
            });
            return JSON.stringify({ exito: true, mensaje: `Acta COPASST "${acta.consecutivo}" creada exitosamente.`, detalles: { aplicativo: 'COPASST', actaId: acta._id } });
          }
          let comite = (await SgsstCopasstComite.findOne(queryObj)) || new SgsstCopasstComite({ user: userId, companyId: activeCompanyId, miembrosPrincipales: [], miembrosSuplentes: [] });
          if (Array.isArray(objC.miembrosPrincipales)) comite.miembrosPrincipales = objC.miembrosPrincipales;
          else if (objC.nombre) {
            comite.miembrosPrincipales.push({
              nombre: objC.nombre,
              cedula: objC.cedula || '000000',
              cargo: objC.cargo || 'Integrante COPASST',
              representacion: objC.representacion === 'Empleador' ? 'Empleador' : 'Trabajadores',
              rolComite: objC.rolComite || 'Vocal',
            });
          }
          comite.markModified('miembrosPrincipales');
          await comite.save();
          return JSON.stringify({ exito: true, mensaje: `Comité COPASST actualizado (${comite.miembrosPrincipales.length} miembros principales).`, detalles: { aplicativo: 'COPASST / Vigía SST' } });
        }

        if (appName.includes('cocolab') || appName.includes('convivencia') || appName === 'hito3_cocolab') {
          const { SgsstConvivenciaComite, SgsstConvivenciaActa } = require('~/models/SgsstConvivencia');
          const objCc = newValue && typeof newValue === 'object' && !Array.isArray(newValue) ? newValue : {};
          if (fieldToEdit === 'acta' || objCc.consecutivo || objCc.temasTratados) {
            const now = new Date();
            const acta = await SgsstConvivenciaActa.create({
              user: userId,
              companyId: activeCompanyId,
              consecutivo: objCc.consecutivo || `ACTA-CCL-${Date.now().toString().slice(-4)}`,
              trimestre: Number(objCc.trimestre || Math.ceil((now.getMonth() + 1) / 3)),
              anio: Number(objCc.anio || now.getFullYear()),
              fecha: objCc.fecha || now.toISOString().slice(0, 10),
              ...objCc,
            });
            return JSON.stringify({ exito: true, mensaje: `Acta Comité de Convivencia "${acta.consecutivo}" creada exitosamente.`, detalles: { aplicativo: 'Comité de Convivencia Laboral', actaId: acta._id } });
          }
          let ccl = (await SgsstConvivenciaComite.findOne(queryObj)) || new SgsstConvivenciaComite({ user: userId, companyId: activeCompanyId, miembrosPrincipales: [], miembrosSuplentes: [] });
          if (Array.isArray(objCc.miembrosPrincipales)) ccl.miembrosPrincipales = objCc.miembrosPrincipales;
          else if (objCc.nombre) {
            ccl.miembrosPrincipales.push({
              nombre: objCc.nombre,
              cedula: objCc.cedula || '000000',
              cargo: objCc.cargo || 'Integrante CCL',
              representacion: objCc.representacion === 'Empleador' ? 'Empleador' : 'Trabajadores',
              rolComite: objCc.rolComite || 'Vocal',
            });
          }
          ccl.markModified('miembrosPrincipales');
          await ccl.save();
          return JSON.stringify({ exito: true, mensaje: `Comité de Convivencia Laboral actualizado (${ccl.miembrosPrincipales.length} miembros principales).`, detalles: { aplicativo: 'Comité de Convivencia Laboral (COCOLAB)' } });
        }

        // ── 26. RESOLUCIÓN EXPLÍCITA DE MÓDULOS RESTANTES (CERO FALLBACK DESTRUCTIVO A PerfilSocioModel) ──
        let modelObj = null;
        let modelPath = '';

        if (appName.includes('altura') || appName.includes('permiso_altura') || appName === 'hito3_alturas') {
          modelObj = modelLoader('PermisoAlturasData', '~/server/routes/sgsst/permisoAlturas');
          modelPath = 'Permiso de Trabajo en Alturas';
        } else if (appName.includes('ats') || appName.includes('trabajo_seguro') || appName === 'hito3_ats') {
          modelObj = modelLoader('AnalisisTrabajoSeguroData', '~/server/routes/sgsst/analisisTrabajoSeguro');
          modelPath = 'ATS (Análisis de Trabajo Seguro)';
        } else if (appName.includes('capacitac') || appName === 'hito5_capacitaciones') {
          modelObj = modelLoader('ProgramaCapacitacionesData', '~/server/routes/sgsst/programaCapacitaciones');
          modelPath = 'Programa de Capacitaciones';
        } else if (appName.includes('owas') || appName.includes('ergonom') || appName === 'hito3_owas') {
          modelObj = modelLoader('MetodoOwasData', '~/server/routes/sgsst/metodoOwas');
          modelPath = 'Evaluación Ergonómica OWAS';
        } else if (appName.includes('acto') || appName.includes('condicion_insegura') || appName === 'actos_condiciones' || appName === 'hito4_actos_condiciones') {
          modelObj = modelLoader('ReporteActosData', '~/server/routes/sgsst/reporteActos');
          modelPath = 'Reporte de Actos y Condiciones Inseguras';
        } else if (appName.includes('legal') || appName.includes('matriz_legal') || appName === 'hito1_matriz_legal') {
          modelObj = modelLoader('MatrizLegalData', '~/server/routes/sgsst/matriz');
          modelPath = 'Matriz Legal SG-SST';
        } else if (appName.includes('contexto') || appName.includes('dofa') || appName === 'hito1_dofa') {
          modelObj = modelLoader('ContextoData', '~/models/ContextoData');
          modelPath = 'Contexto de la Organización y DOFA';
        } else if (
          appName === 'perfil_socio' ||
          appName === 'perfil_sociodemografico' ||
          appName === 'sociodemografico' ||
          appName === 'trabajadores' ||
          appName === 'condiciones_salud' ||
          appName === 'hito2_perfil_socio' ||
          appName === 'hito2_condiciones_salud'
        ) {
          modelObj = PerfilSocioModel;
          modelPath = 'Perfil Sociodemográfico y Condiciones de Salud';
        } else {
          const validModules = [
            'empresa', 'contexto', 'diagnostico', 'responsable', 'politica', 'objetivos', 'rhs', 'rit',
            'participacion_ipevar', 'oportunidades_sst', 'plan_emergencias', 'matriz_legal',
            'perfiles_cargo', 'perfil_socio', 'condiciones_salud', 'matriz_ipevar', 'bio_ipevar',
            'matriz_pesv', 'comite_pesv', 'vehiculos', 'quimicos_sga', 'registro_quimico',
            'owas', 'estudio_puesto', 'ats', 'alturas', 'equipos_alturas', 'epp',
            'copasst', 'cocolab', 'psicosocial', 'actos_condiciones',
            'compras_sst', 'contratistas', 'gestion_cambio', 'capacitaciones',
            'vulnerabilidad', 'estadisticas_atel', 'investigacion_atel', 'investigacion_profunda',
            'acpm', 'auditoria', 'alta_direccion',
          ];
          return JSON.stringify({
            exito: false,
            error: `El módulo "${rawTargetApp}" no existe o no es un aplicativo válido en editar_cualquier_aplicativo. No se modificó ningún dato.`,
            modulos_validos: validModules,
          });
        }

        if (!modelObj) {
          return JSON.stringify({ error: `No se pudo encontrar o conectar con la base de datos del aplicativo "${appName}".` });
        }

        let doc = await modelObj.findOne(queryObj);
        if (!doc && !companyId) {
          doc = await modelObj.findOne({ user: userId });
        }

        // Si no existe el documento para la empresa, inicializarlo automáticamente
        if (!doc) {
          try {
            doc = new modelObj({
              user: userId,
              companyId: activeCompanyId,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } catch (initErr) {
            return JSON.stringify({ error: `No se encontró ningún registro activo para la empresa en el aplicativo "${modelPath}".` });
          }
        }

        let modified = false;

        const updateNested = (target) => {
          if (!target || typeof target !== 'object') return false;
          let updatedHere = false;

          if (Array.isArray(target)) {
            for (const item of target) {
              if (item && typeof item === 'object') {
                const itemStr = JSON.stringify(item).toLowerCase();
                if (!filterStr || itemStr.includes(filterStr)) {
                  for (const k of Object.keys(item)) {
                    if (k.toLowerCase() === fieldToEdit.toLowerCase()) {
                      item[k] = newValue;
                      updatedHere = true;
                    }
                  }
                }
              }
            }
          } else {
            for (const key of Object.keys(target)) {
              if (key.toLowerCase() === fieldToEdit.toLowerCase()) {
                target[key] = newValue;
                updatedHere = true;
              } else if (target[key] && typeof target[key] === 'object') {
                if (updateNested(target[key])) updatedHere = true;
              }
            }
          }
          return updatedHere;
        };

        if (fieldToEdit && doc[fieldToEdit] !== undefined) {
          doc[fieldToEdit] = newValue;
          modified = true;
        } else if (fieldToEdit) {
          modified = updateNested(doc);
        } else if (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) {
          Object.assign(doc, newValue);
          modified = true;
        }

        if (modified || doc.isModified()) {
          if (fieldToEdit) doc.markModified(fieldToEdit);
          if (doc.formData) doc.markModified('formData');
          if (doc.procesos) doc.markModified('procesos');
          if (doc.sesiones) doc.markModified('sesiones');
          if (doc.perfiles) doc.markModified('perfiles');
          if (doc.perfilesList) doc.markModified('perfilesList');
          if (doc.observaciones) doc.markModified('observaciones');
          if (doc.trabajadores) doc.markModified('trabajadores');
          if (doc.statuses) doc.markModified('statuses');
          if (doc.seguimientos) doc.markModified('seguimientos');
          if (doc.dofaItems) doc.markModified('dofaItems');
          if (doc.partesInteresadas) doc.markModified('partesInteresadas');
          if (doc.contextData) doc.markModified('contextData');
          await doc.save();

          return JSON.stringify({
            exito: true,
            mensaje: `Se actualizó exitosamente "${fieldToEdit || 'datos'}" en el aplicativo "${modelPath}".`,
            detalles: {
              aplicativo: modelPath,
              campo: fieldToEdit || 'datos_json',
              nuevoValor: newValue,
              filtroAplicado: rawFilterOriginal || 'General'
            }
          });
        } else {
          if (doc.formData && typeof doc.formData === 'object' && fieldToEdit) {
            doc.formData[fieldToEdit] = newValue;
            doc.markModified('formData');
          } else if (fieldToEdit) {
            doc[fieldToEdit] = newValue;
          }
          await doc.save();

          return JSON.stringify({
            exito: true,
            mensaje: `Se asignó y guardó la información de "${fieldToEdit || 'datos'}" en el aplicativo "${modelPath}".`,
            detalles: {
              aplicativo: modelPath,
              campo: fieldToEdit || 'datos_json',
              nuevoValor: newValue
            }
          });
        }
      }

      // ── ACTION: GENERAR INFORME HTML ─────────────────────────────────────────
      if (accion === 'generar_informe_html') {
        const reportType = (input.tipo_informe || 'resumen_ejecutivo').toLowerCase();
        const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

        // Build HTML template based on system data
        let htmlTitle = input.titulo_informe || 'Informe Ejecutivo de Seguridad y Salud en el Trabajo';
        let reportContentHTML = '';

        if (input.contenido_html) {
          reportContentHTML = `<div class="bg-slate-900/80 p-6 md:p-8 rounded-2xl border border-slate-800 space-y-6 text-slate-200 leading-relaxed">${input.contenido_html}</div>`;
        } else if (reportType.includes('atel') || reportType.includes('accident')) {
          htmlTitle = 'Informe Estadístico de Accidentalidad Laboral (ATEL)';
          reportContentHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <p class="text-slate-400 text-sm font-medium">Eventos Totales</p>
                <h3 class="text-4xl font-bold text-emerald-400 mt-2">Registrados</h3>
                <p class="text-xs text-slate-500 mt-1">Monitoreo anual de incidentes y ATEL</p>
              </div>
              <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <p class="text-slate-400 text-sm font-medium">Índice de Frecuencia (IF)</p>
                <h3 class="text-4xl font-bold text-teal-400 mt-2">Bajo Control</h3>
                <p class="text-xs text-slate-500 mt-1">Conforme a Estándares Mínimos Res. 0312</p>
              </div>
              <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <p class="text-slate-400 text-sm font-medium">Días de Incapacidad</p>
                <h3 class="text-4xl font-bold text-indigo-400 mt-2">Gestionados</h3>
                <p class="text-xs text-slate-500 mt-1">Seguimiento a curación y reintegro</p>
              </div>
            </div>
            <div class="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
              <h4 class="text-lg font-semibold text-white mb-4">Detalle de Gestión Preventiva</h4>
              <p class="text-slate-300 text-sm leading-relaxed mb-4">El sistema WAPPY IA mantiene un monitoreo activo de las ausencias por causa de salud y accidentes ocupacionales. Se recomienda mantener las inspecciones planeadas y la entrega y control de EPP.</p>
            </div>
          `;
        } else {
          reportContentHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div class="bg-slate-800/90 p-5 rounded-2xl border border-slate-700">
                <span class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Hito 1</span>
                <h4 class="text-xl font-bold text-white mt-1">Huella Biocéntrica</h4>
                <p class="text-xs text-slate-400 mt-1">Perfiles sociodemográficos y exámenes de salud activos.</p>
              </div>
              <div class="bg-slate-800/90 p-5 rounded-2xl border border-slate-700">
                <span class="text-xs font-semibold uppercase tracking-wider text-teal-400">Hito 2</span>
                <h4 class="text-xl font-bold text-white mt-1">Núcleo Evaluativo</h4>
                <p class="text-xs text-slate-400 mt-1">Matriz de peligros GTC-45 e IPEVAR integrada.</p>
              </div>
              <div class="bg-slate-800/90 p-5 rounded-2xl border border-slate-700">
                <span class="text-xs font-semibold uppercase tracking-wider text-indigo-400">Hito 3</span>
                <h4 class="text-xl font-bold text-white mt-1">Dinámica Exposición</h4>
                <p class="text-xs text-slate-400 mt-1">Capacitaciones, ATS y evaluaciones OWAS al día.</p>
              </div>
              <div class="bg-slate-800/90 p-5 rounded-2xl border border-slate-700">
                <span class="text-xs font-semibold uppercase tracking-wider text-purple-400">Hito 4 & 5</span>
                <h4 class="text-xl font-bold text-white mt-1">Oráculo Predictivo</h4>
                <p class="text-xs text-slate-400 mt-1">Inteligencia artificial para prevención de riesgos.</p>
              </div>
            </div>
            <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h4 class="text-lg font-semibold text-white mb-3">Conclusiones del Sistema SG-SST</h4>
              <p class="text-slate-300 text-sm leading-relaxed">El sistema de gestión de Seguridad y Salud en el Trabajo cumple con los requerimientos normativos del Decreto 1072 de 2015. Todos los aplicativos y componentes permanecen integrados y sincronizados en tiempo real mediante la inteligencia artificial de WAPPY IA.</p>
            </div>
          `;
        }

        const fullHTML = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${htmlTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 md:p-12">
  <div class="max-w-5xl mx-auto">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-8 border-b border-slate-800 gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">WAPPY IA - SOMOS SST</span>
          <span class="text-xs text-slate-500">${dateStr}</span>
        </div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white">${htmlTitle}</h1>
      </div>
    </header>
    <main>
      ${reportContentHTML}
    </main>
    <footer class="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
      Generado automáticamente por el Agente Guía WAPPY IA • Todos los derechos reservados.
    </footer>
  </div>
</body>
</html>`;

        const conversationId = this.req.body?.conversationId;
        if (conversationId) {
          try {
            const CanvasSession = mongoose.models.CanvasSession || require('~/models/CanvasSession');
            const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
            const { syncCanvasToLiveEditor } = require('~/server/routes/sgsst/syncBridge');

            const activeCompany = await getActiveCompanyDoc(this.req.user.id);
            const companyId = activeCompany ? activeCompany._id : null;

            let canvasSession = await CanvasSession.findOne({ conversationId });
            if (canvasSession) {
              const maxHistoryVersion = (canvasSession.history || []).reduce((max, item) => Math.max(max, item.version || 0), 0);
              const nextVersion = Math.max(maxHistoryVersion, canvasSession.version || 0) + 1;
              const newHistoryItem = {
                version: nextVersion,
                content: fullHTML,
                title: htmlTitle,
                fileType: 'html',
                updatedAt: new Date()
              };

              canvasSession.content = fullHTML;
              canvasSession.title = htmlTitle;
              canvasSession.fileType = 'html';
              canvasSession.version = nextVersion;
              canvasSession.history = [...(canvasSession.history || []), newHistoryItem].slice(-20);
              await canvasSession.save();
            } else {
              canvasSession = new CanvasSession({
                user: this.req.user.id,
                companyId,
                conversationId,
                title: htmlTitle,
                fileType: 'html',
                content: fullHTML,
                version: 1,
                history: [{
                  version: 1,
                  content: fullHTML,
                  title: htmlTitle,
                  fileType: 'html',
                  updatedAt: new Date()
                }]
              });
              await canvasSession.save();
            }
            await syncCanvasToLiveEditor(conversationId, fullHTML, htmlTitle, this.req.user.id);
          } catch (err) {
            console.error('[SomosSST] Error saving report to CanvasSession:', err);
          }
        }

        return JSON.stringify({
          exito: true,
          mensaje: `Se generó exitosamente el informe en formato HTML interactivo para "${htmlTitle}". El informe está visible y disponible para descargar en tu visor de Canvas en la derecha.`,
          htmlCode: fullHTML
        });
      }

      // ── ACTION: CONSULTAR HISTORIAL INFORMES ─────────────────────────────────
      if (accion === 'consultar_historial_informes') {
        const historyLogs = [];

        // 1. ATEL Annual Events History
        if (ATELAnnualModel) {
          const atelDocs = await ATELAnnualModel.find(queryObj).lean();
          atelDocs.forEach(doc => {
            if (doc.months) {
              const monthObj = doc.months instanceof Map ? Object.fromEntries(doc.months) : doc.months;
              Object.entries(monthObj).forEach(([mKey, mVal]) => {
                if (mVal.events && Array.isArray(mVal.events)) {
                  mVal.events.forEach(ev => {
                    historyLogs.push({
                      modulo: 'Accidentalidad ATEL',
                      fecha: ev.fecha || `${doc.year}-${mKey}`,
                      evento: `[${ev.tipo || 'AT'}] Siniestro registrado: ${ev.causaInmediata || 'Accidente'}`,
                      detalles: `Incapacidad: ${ev.diasIncapacidad || 0} días. Gravedad: ${ev.consecuencia || 'Leve'}`
                    });
                  });
                }
              });
            }
          });
        }

        // 2. Reporte de Actos e Incidentes History
        if (ReporteActosModel) {
          const actosDoc = await ReporteActosModel.findOne(queryObj).lean();
          if (actosDoc && actosDoc.inboxPublico) {
            actosDoc.inboxPublico.forEach(r => {
              historyLogs.push({
                modulo: 'Reporte Actos / Condición',
                fecha: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'Reciente',
                evento: `Reporte: ${r.tipo || 'Acto Inseguro'}`,
                detalles: r.descripcion || r.detalles || 'Sin detalle'
              });
            });
          }
        }

        // 3. Capacitaciones History
        if (ProgramaCapacitacionesModel) {
          const capDoc = await ProgramaCapacitacionesModel.findOne(queryObj).lean();
          if (capDoc && capDoc.sesiones) {
            capDoc.sesiones.forEach(s => {
              historyLogs.push({
                modulo: 'Programa Capacitaciones',
                fecha: s.fecha || 'Programada',
                evento: `Capacitación: ${s.tema || 'Sesión SST'}`,
                detalles: `Estado: ${s.estado || 'Completada'}. Registrados: ${s.trabajadoresRegistrados ? s.trabajadoresRegistrados.length : 0}`
              });
            });
          }
        }

        // 4. Historial de Informes e Investigaciones Guardadas (Conversations)
        const ConversationModel = mongoose.models.Conversation;
        const MessageModel = mongoose.models.Message;
        if (ConversationModel) {
          const convoQuery = {
            user: userId,
            ...(companyId ? { tags: { $in: [`company-${companyId}`, `company:${companyId}`] } } : {}),
          };
          const convos = await ConversationModel.find(convoQuery).sort({ updatedAt: -1 }).limit(50).lean();
          for (const c of convos) {
            let lastText = '';
            if (MessageModel) {
              const msg = await MessageModel.findOne({ conversationId: c.conversationId, isCreatedByUser: false }).sort({ createdAt: -1 }).lean();
              if (msg) lastText = msg.text ? msg.text.substring(0, 300) : '';
            }
            historyLogs.push({
              modulo: 'Informes e Investigaciones Guardadas',
              fecha: c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : 'Reciente',
              evento: `[Documento] ${c.title || 'Informe SST'}`,
              detalles: lastText || `ID Hilo: ${c.conversationId}`
            });
          }
        }

        // 5. Historial de Sesiones de Trabajo (GTC45, PESV, Químicos, Canvas)
        const gtc45Model = mongoose.models.Gtc45WorkspaceSession;
        if (gtc45Model) {
          const gtcDocs = await gtc45Model.find({ user: userId, ...(companyId ? { companyId } : {}) }).sort({ updatedAt: -1 }).limit(10).lean();
          gtcDocs.forEach(g => historyLogs.push({ modulo: 'Matriz GTC-45 / IPEVAR', fecha: g.updatedAt ? new Date(g.updatedAt).toISOString().split('T')[0] : 'Reciente', evento: `Matriz IPEVAR: ${g.title || 'Evaluación de Peligros'}`, detalles: `Estado: ${g.status || 'Activa'}` }));
        }
        const pesvModel = mongoose.models.PesvWorkspaceSession;
        if (pesvModel) {
          const pesvDocs = await pesvModel.find({ user: userId, ...(companyId ? { companyId } : {}) }).sort({ updatedAt: -1 }).limit(10).lean();
          pesvDocs.forEach(p => historyLogs.push({ modulo: 'Plan Estratégico Riesgo Vial (PESV)', fecha: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : 'Reciente', evento: `PESV: ${p.title || 'Plan Vial'}`, detalles: `Estado: ${p.status || 'Activo'}` }));
        }

        return JSON.stringify({
          exito: true,
          mensaje: `Se obtuvieron ${historyLogs.length} registros reales de TODO EL SISTEMA (Informes, ATEL, GTC45, PESV, Actos y Capacitaciones).`,
          historial: historyLogs
        });
      }

      // ── ACTION: CONSULTAR PLANES Y SISTEMA ────────────────────────────────────
      if (accion === 'consultar_planes_y_sistema') {
        const PlanModel = modelLoader('Plan', '~/models/Plan');
        let planesData = [];
        if (PlanModel) {
          planesData = await PlanModel.find({}).lean();
        }

        let activeCompany = null;
        if (CompanyInfo) {
          const doc = await getActiveCompanyDoc(userId);
          activeCompany = doc ? (typeof doc.toObject === 'function' ? doc.toObject() : doc) : null;
        }

        return JSON.stringify({
          exito: true,
          mensaje: 'Se consultaron exitosamente los planes y configuraciones activas del sistema desde la base de datos.',
          empresaActiva: activeCompany ? {
            nombre: activeCompany.companyName || activeCompany.nombreEmpresa || 'Empresa Registrada',
            nit: activeCompany.nit || 'No registrado',
            planSuscripcion: activeCompany.plan || activeCompany.subscriptionPlan || 'Estándar',
            vigencia: activeCompany.planExpiration || 'Activa'
          } : 'Información general',
          planesOficialesSistema: planesData.map(p => ({
            id: p.planId,
            nombre: p.name,
            precios: p.prices,
            caracteristicas: p.featuresText,
            preciosHerramientasCustom: p.toolPrices
          }))
        });
      }

      // ── ACTION: CONSULTAR CENTRO CONTROL ACPM ──────────────────────────────────
      if (accion === 'consultar_centro_control_acpm') {
        const KanbanTask = modelLoader('KanbanTask', '../../../../models/KanbanTask');
        if (!KanbanTask) return JSON.stringify({ error: 'Modelo KanbanTask no disponible.' });
        
        const query = { user: userId };
        if (companyId) query.companyId = String(companyId);

        const tasks = await KanbanTask.find(query).sort({ dueDate: 1 }).lean();
        return JSON.stringify({
          exito: true,
          mensaje: `Se obtuvieron ${tasks.length} actividades en el Centro de Control ACPM.`,
          actividades: tasks.map(t => ({
            id: t._id,
            titulo: t.title,
            descripcion: t.description,
            estado: t.status,
            fecha_vencimiento: t.dueDate ? t.dueDate.toISOString().split('T')[0] : null,
            tipo: t.type
          }))
        });
      }

      // ── ACTION: CREAR ACTIVIDAD ACPM ───────────────────────────────────────────
      if (accion === 'crear_actividad_acpm') {
        const KanbanTask = modelLoader('KanbanTask', '../../../../models/KanbanTask');
        if (!KanbanTask) return JSON.stringify({ error: 'Modelo KanbanTask no disponible.' });

        const taskTitle = (input.titulo_actividad || input.nombre_tarea_o_hito || 'Nueva Actividad ACPM').trim();
        const targetCompIdStr = companyId ? companyId.toString() : 'default';

        // Idempotency check: prevent duplicate open ACPM tasks with the same title in the same company
        const escapedTitle = taskTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingTask = await KanbanTask.findOne({
          user: userId,
          companyId: targetCompIdStr,
          title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') },
          status: { $ne: 'done' }
        }).lean();

        if (existingTask) {
          return JSON.stringify({
            exito: true,
            yaExistia: true,
            mensaje: `La actividad "${existingTask.title}" ya se encuentra registrada en el Centro de Control ACPM de esta empresa. No se creó un duplicado.`,
            actividad: {
              id: existingTask._id,
              titulo: existingTask.title,
              descripcion: existingTask.description,
              estado: existingTask.status,
              fecha_vencimiento: existingTask.dueDate ? new Date(existingTask.dueDate).toISOString().split('T')[0] : null
            }
          });
        }

        let due = new Date();
        if (input.fecha_vencimiento) {
          const fvLower = input.fecha_vencimiento.toLowerCase();
          if (fvLower.includes('manana') || fvLower.includes('mañana')) {
            due.setDate(due.getDate() + 1);
          } else {
            const parsed = new Date(input.fecha_vencimiento);
            if (!isNaN(parsed.getTime())) due = parsed;
            else due.setDate(due.getDate() + 1);
          }
        } else {
          due.setDate(due.getDate() + 1); // Default to tomorrow
        }
        due.setHours(23, 59, 59, 999);

        const newTask = await KanbanTask.create({
          user: userId,
          companyId: targetCompIdStr,
          title: taskTitle,
          description: input.descripcion_actividad || input.descripcion || 'Actividad registrada por Tenshi',
          dueDate: due,
          status: input.estado_actividad || 'todo',
          type: input.tipo_actividad || 'manual'
        });

        return JSON.stringify({
          exito: true,
          mensaje: `Se creó exitosamente la actividad "${newTask.title}" en el Centro de Control ACPM con fecha de vencimiento ${due.toISOString().split('T')[0]}.`,
          actividad: {
            id: newTask._id,
            titulo: newTask.title,
            descripcion: newTask.description,
            estado: newTask.status,
            fecha_vencimiento: newTask.dueDate.toISOString().split('T')[0]
          }
        });
      }

      // ── ACTION: ACTUALIZAR ACTIVIDAD ACPM ──────────────────────────────────────
      if (accion === 'actualizar_actividad_acpm') {
        const KanbanTask = modelLoader('KanbanTask', '../../../../models/KanbanTask');
        if (!KanbanTask) return JSON.stringify({ error: 'Modelo KanbanTask no disponible.' });

        const taskTitle = input.titulo_actividad || input.identificador_o_filtro || input.nombre_o_cargo;
        const kanbanFilter = { user: userId, ...(companyId ? { companyId: companyId.toString() } : {}) };
        let task = null;
        if (taskTitle) {
          task = await KanbanTask.findOne({ ...kanbanFilter, title: { $regex: taskTitle, $options: 'i' } });
        }
        if (!task) {
          task = await KanbanTask.findOne(kanbanFilter).sort({ updatedAt: -1 });
        }

        if (!task) return JSON.stringify({ error: 'No se encontró la actividad para actualizar en el Centro de Control ACPM.' });

        if (input.nuevo_estado) {
          const st = input.nuevo_estado.toLowerCase();
          if (st.includes('completad') || st.includes('hecho') || st.includes('done')) {
            task.status = 'done';
            task.completedAt = new Date();
          } else {
            task.status = input.nuevo_estado;
          }
        }
        if (input.descripcion_actividad) task.description = input.descripcion_actividad;
        await task.save();

        return JSON.stringify({
          exito: true,
          mensaje: `Se actualizó exitosamente la actividad "${task.title}" en el Centro de Control ACPM a estado ${task.status}.`,
          actividad: task
        });
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
