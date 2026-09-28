const mongoose = require('mongoose');

// ─── 1. Modelo de Conformación del Comité Paritario (COPASST o Vigía) ───────────────
const copasstComiteSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Modalidad reglamentaria según número de trabajadores (Res. 2013/1986 Art. 1 y Dec. 1295/1994)
    // < 10 trabajadores = vigia | >= 10 = copasst
    modalidad: {
      type: String,
      enum: ['copasst', 'vigia'],
      default: 'copasst',
      required: true,
    },
    periodoInicio: {
      type: Date,
      required: true,
      default: Date.now,
    },
    periodoFin: {
      type: Date,
      required: true,
      // Período de 2 años según Art. 63 Dec. 1295 de 1994
      default: () => new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
    },
    estado: {
      type: String,
      enum: ['activo', 'renovacion', 'vencido', 'en_proceso_eleccion'],
      default: 'activo',
    },
    horasSemanalesDedicadas: {
      type: Number,
      default: 4, // 4 horas semanales mínimas obligatorias por ley para miembros del COPASST
    },
    // Representantes designados directamente por el Empleador / Gerencia
    representantesEmpleador: [
      {
        nombre: { type: String, required: true },
        cedula: { type: String, required: true },
        cargo: { type: String, default: '' },
        rol: {
          type: String,
          enum: ['Presidente', 'Principal', 'Suplente'],
          default: 'Principal',
        },
        telefono: { type: String, default: '' },
        email: { type: String, default: '' },
      },
    ],
    // Representantes elegidos democráticamente por sufragio secreto de los Trabajadores
    representantesTrabajadores: [
      {
        nombre: { type: String, required: true },
        cedula: { type: String, required: true },
        cargo: { type: String, default: '' },
        rol: {
          type: String,
          enum: ['Secretario', 'Principal', 'Suplente', 'Vigía'],
          default: 'Principal',
        },
        telefono: { type: String, default: '' },
        email: { type: String, default: '' },
        votosObtenidos: { type: Number, default: 0 },
      },
    ],
    // Para microempresas (<10 trabajadores) que solo eligen Vigía de SST
    vigia: {
      nombre: { type: String, default: '' },
      cedula: { type: String, default: '' },
      cargo: { type: String, default: '' },
      email: { type: String, default: '' },
      telefono: { type: String, default: '' },
      fechaEleccion: { type: Date, default: null },
    },
    observaciones: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// ─── 2. Modelo de Actas Mensuales Ordinarias y Extraordinarias ────────────────────
const copasstActaSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    comiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SgsstCopasstComite',
      required: false,
    },
    consecutivo: {
      type: String,
      required: true,
      trim: true,
      // Ej. "ACTA-COPASST-2025-001"
    },
    tipo: {
      type: String,
      enum: ['ordinaria_mensual', 'extraordinaria'],
      default: 'ordinaria_mensual',
      required: true,
    },
    mes: {
      type: Number,
      min: 1,
      max: 12,
      required: true,
    },
    anio: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    fecha: {
      type: Date,
      required: true,
      default: Date.now,
    },
    horaInicio: {
      type: String,
      default: '08:00',
    },
    horaFin: {
      type: String,
      default: '10:00',
    },
    lugar: {
      type: String,
      default: 'Sala Principal de Reuniones / Híbrida',
    },
    ordenDelDia: {
      type: [String],
      default: [
        '1. Verificación del quórum reglamentario',
        '2. Lectura y aprobación del acta anterior',
        '3. Revisión de accidentalidad, incidentes y ausentismo del mes (ATEL)',
        '4. Estado de inspecciones planeadas de seguridad y condiciones de trabajo',
        '5. Avance de las capacitaciones y compromisos pendientes',
        '6. Proposiciones y varios',
      ],
    },
    quorumVerificado: {
      type: Boolean,
      default: true,
    },
    asistentes: [
      {
        nombre: { type: String, required: true },
        cedula: { type: String, required: true },
        cargo: { type: String, default: '' },
        rol: { type: String, default: 'Miembro' },
        asistio: { type: Boolean, default: true },
        firma: { type: String, default: null }, // Base64 signature
        firmadoEn: { type: Date, default: null },
        firmadoDesde: { type: String, default: null }, // 'portal_trabajador' | 'admin'
      },
    ],
    // Desarrollo temático estructurado
    desarrollo: {
      lecturaActaAnterior: { type: String, default: 'Aprobada sin modificaciones.' },
      analisisAccidentalidad: { type: String, default: '' },
      inspeccionesSeguridad: { type: String, default: '' },
      capacitacionesYCampanas: { type: String, default: '' },
      proposicionesVarios: { type: String, default: '' },
      analisisIaTenshi: { type: String, default: '' }, // Sugerencias automáticas por IA
    },
    // Compromisos / Plan de acción derivado del acta
    compromisos: [
      {
        accion: { type: String, required: true },
        responsable: { type: String, required: true },
        fechaLimite: { type: String, required: true },
        estado: {
          type: String,
          enum: ['pendiente', 'en_progreso', 'cumplido'],
          default: 'pendiente',
        },
        vinculadaAcpm: { type: Boolean, default: false },
        acpmId: { type: mongoose.Schema.Types.ObjectId, ref: 'KanbanTask', default: null },
      },
    ],
    proximaReunionFecha: {
      type: String,
      default: '',
    },
    estadoActa: {
      type: String,
      enum: ['borrador', 'en_firmas', 'aprobada', 'archivada'],
      default: 'borrador',
    },
  },
  { timestamps: true }
);

// ─── 3. Modelo de Elecciones Democráticas del COPASST / Convivencia ─────────────────
const sgsstEleccionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tipoComite: {
      type: String,
      enum: ['copasst', 'cocolab'],
      required: true,
    },
    titulo: {
      type: String,
      required: true,
      // Ej: "Elección de Representantes de los Trabajadores COPASST 2025-2027"
    },
    periodo: {
      type: String,
      default: '2025-2027',
    },
    fechaApertura: {
      type: Date,
      required: true,
      default: Date.now,
    },
    fechaCierre: {
      type: Date,
      required: true,
    },
    estado: {
      type: String,
      enum: ['convocatoria', 'activa', 'cerrada', 'escrutada'],
      default: 'convocatoria',
    },
    candidatos: [
      {
        id: { type: String, required: true },
        nombre: { type: String, required: true },
        cedula: { type: String, required: true },
        cargo: { type: String, default: '' },
        propuesta: { type: String, default: '' },
        foto: { type: String, default: '' },
        votos: { type: Number, default: 0 },
      },
    ],
    votosEnBlanco: {
      type: Number,
      default: 0,
    },
    totalVotantesHabilitados: {
      type: Number,
      default: 0,
    },
    totalVotosEmitidos: {
      type: Number,
      default: 0,
    },
    juradosVotacion: [
      {
        nombre: { type: String, default: '' },
        cedula: { type: String, default: '' },
        cargo: { type: String, default: '' },
      },
    ],
    actaEscrutinioTexto: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const SgsstCopasstComite = mongoose.models.SgsstCopasstComite || mongoose.model('SgsstCopasstComite', copasstComiteSchema);
const SgsstCopasstActa = mongoose.models.SgsstCopasstActa || mongoose.model('SgsstCopasstActa', copasstActaSchema);
const SgsstEleccion = mongoose.models.SgsstEleccion || mongoose.model('SgsstEleccion', sgsstEleccionSchema);

module.exports = {
  SgsstCopasstComite,
  SgsstCopasstActa,
  SgsstEleccion,
};
