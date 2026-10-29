const mongoose = require('mongoose');

const SedeEmergenciaSchema = new mongoose.Schema(
  {
    nombreSede: { type: String, default: 'Sede Principal' },
    ciudad: { type: String, default: '' },
    direccion: { type: String, default: '' },
    telefonoEmergencia: { type: String, default: '' },
    horarioOperacion: { type: String, default: 'Lunes a Sábado 7:00 a.m. - 5:30 p.m.' },
    trabajadoresFijos: { type: Number, default: 0 },
    contratistasFlotantes: { type: Number, default: 2 },
    visitantesPromedio: { type: Number, default: 5 },
    construccionTipo: {
      type: String,
      default: 'Estructura sismorresistente en concreto reforzado y mampostería confinada',
    },
    puntoEncuentroPrincipal: {
      type: String,
      default: 'Zona despejada exterior frente al acceso principal (señalizada en verde)',
    },
    puntoEncuentroAlterno: {
      type: String,
      default: 'Parqueadero externo / Plazoleta pública a más de 50 metros de líneas eléctricas',
    },
    rutasEvacuacionDesc: {
      type: String,
      default:
        'Pasillos principales despejados con señalización fotoluminiscente NTC 1461 e iluminación de emergencia autónoma hacia salidas principales.',
    },
    sistemaAlarma: {
      type: String,
      default:
        'Sirena acústica-estroboscópica codificada (1 tono intermitente: Alerta / 1 tono continuo: Evacuación inmediata) + Silbatos de brigada.',
    },
    clinicaMedevac: {
      type: String,
      default: 'Clínica / Hospital Universitario de Referencia nivel III-IV más cercano',
    },
    direccionClinica: { type: String, default: 'Centro Médico de Urgencias de la ciudad' },
    tiempoTrasladoMedevac: { type: String, default: '10 a 15 minutos en vehículo de emergencia' },
    ambulanciaContacto: { type: String, default: 'Línea 123 / Línea Médica ARL / Red de Urgencias' },
    arlNombre: { type: String, default: '' },
    arlLineaEmergencia: { type: String, default: '01 8000 / # Línea de Atención ATEL ARL' },
  },
  { _id: false }
);

const EscenarioAmenazaSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    amenaza: { type: String, required: true },
    tipo: {
      type: String,
      enum: ['Natural', 'Tecnológica', 'Social'],
      default: 'Natural',
    },
    origenSst: { type: String, default: 'Análisis de Vulnerabilidad (Diamante)' },
    calificacionDiamante: {
      type: String,
      enum: ['Inminente', 'Probable', 'Posible'],
      default: 'Probable',
    },
    nivelVulnerabilidad: {
      type: String,
      enum: ['Alta', 'Media', 'Baja'],
      default: 'Media',
    },
    riesgoGlobal: {
      type: String,
      enum: ['Alto', 'Medio', 'Bajo'],
      default: 'Medio',
    },
    areaAfectada: { type: String, default: 'Toda la instalación / Áreas operativas' },
    medidasPrevencion: { type: String, default: '' },
    medidasMitigacion: { type: String, default: '' },
    responsable: { type: String, default: 'Responsable SG-SST / Jefe de Brigada' },
    sentToKanban: { type: Boolean, default: false },
  },
  { _id: false }
);

const EstructuraSciSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    rolSci: { type: String, required: true },
    nombreAsignado: { type: String, default: '' },
    cargoEmpresa: { type: String, default: '' },
    telefonoContacto: { type: String, default: '' },
    especialidadBrigada: {
      type: String,
      default: 'Comando de Incidente (SCI)',
    },
    funcionesAntes: { type: String, default: '' },
    funcionesDurante: { type: String, default: '' },
    funcionesDespues: { type: String, default: '' },
    origenSst: { type: String, default: 'Brigada de Emergencias / Gobernanza' },
  },
  { _id: false }
);

const ProcedimientoPonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    codigo: { type: String, default: 'PON-01' },
    tituloEscenario: { type: String, required: true },
    amenazaAsociada: { type: String, default: '' },
    faseAntes: { type: String, default: '' },
    faseDurante: { type: String, default: '' },
    faseDespues: { type: String, default: '' },
    recursosNecesarios: { type: String, default: 'Botiquín, Camilla, Extintores, Megáfono, Radios' },
    responsableOperativo: { type: String, default: 'Comandante del Incidente / Brigada SST' },
    estado: {
      type: String,
      enum: ['Vigente', 'En Revisión', 'En Simulacro'],
      default: 'Vigente',
    },
    sentToKanban: { type: Boolean, default: false },
  },
  { _id: false }
);

const RecursoEquipoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    tipoRecurso: {
      type: String,
      enum: [
        'Extintor',
        'Botiquín',
        'Camilla',
        'Alarma / Detección',
        'Gabinete / Hidrante',
        'Kit Derrames SGA',
        'Señalización / Iluminación',
      ],
      default: 'Extintor',
    },
    descripcion: { type: String, required: true },
    ubicacion: { type: String, default: 'Área principal / Pasillo de evacuación' },
    cantidad: { type: Number, default: 1 },
    estado: {
      type: String,
      enum: ['Operativo', 'Por Recargar / Mantenimiento', 'Proyectado'],
      default: 'Operativo',
    },
    fechaInspeccion: { type: String, default: '' },
    responsable: { type: String, default: 'Brigada de Emergencia / SST' },
    origenSst: { type: String, default: 'Inspección de Equipos de Emergencia' },
  },
  { _id: false }
);

const DirectorioExternoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    entidad: { type: String, required: true },
    lineaTelefonica: { type: String, required: true },
    direccionDistancia: { type: String, default: 'Cobertura Municipal / Distrital' },
    tipoApoyo: { type: String, default: 'Atención prehospitalaria y rescate' },
    tiempoRespuestaEstimado: { type: String, default: '10 - 15 min' },
  },
  { _id: false }
);

const SimulacroPlanSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    tituloSimulacro: { type: String, required: true },
    escenario: { type: String, default: 'Evacuación General por Sismo / Incendio' },
    fechaProgramada: { type: String, default: '' },
    participantesEsperados: { type: Number, default: 10 },
    tiempoRespuestaMeta: { type: String, default: '< 3 minutos hasta Punto de Encuentro' },
    estado: {
      type: String,
      enum: ['Programado', 'Ejecutado', 'Evaluado'],
      default: 'Programado',
    },
    hallazgosMejora: { type: String, default: '' },
    responsable: { type: String, default: 'Responsable SG-SST / Brigada' },
    sentToKanban: { type: Boolean, default: false },
  },
  { _id: false }
);

const PlanEmergenciasDataSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: false,
    },
    sedeData: {
      type: SedeEmergenciaSchema,
      default: () => ({}),
    },
    escenariosAmenaza: {
      type: [EscenarioAmenazaSchema],
      default: [],
    },
    estructuraSci: {
      type: [EstructuraSciSchema],
      default: [],
    },
    procedimientosPon: {
      type: [ProcedimientoPonSchema],
      default: [],
    },
    recursosEquipos: {
      type: [RecursoEquipoSchema],
      default: [],
    },
    directoriosExternos: {
      type: [DirectorioExternoSchema],
      default: [],
    },
    simulacrosPlan: {
      type: [SimulacroPlanSchema],
      default: [],
    },
    lastGeneratedReport: {
      type: String,
      default: '',
    },
    conversationId: {
      type: String,
      default: null,
    },
    messageId: {
      type: String,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

PlanEmergenciasDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

module.exports =
  mongoose.models.PlanEmergenciasData ||
  mongoose.model('PlanEmergenciasData', PlanEmergenciasDataSchema);
