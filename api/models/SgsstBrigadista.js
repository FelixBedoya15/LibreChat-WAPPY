const mongoose = require('mongoose');

const SgsstBrigadistaSchema = new mongoose.Schema(
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
      required: false,
    },
    workerId: {
      type: String,
      default: '',
    },
    cedula: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    cargo: {
      type: String,
      default: '',
      trim: true,
    },
    sede: {
      type: String,
      default: 'Sede Principal',
      trim: true,
    },
    area: {
      type: String,
      default: '',
      trim: true,
    },
    // Especialidad técnica en la Brigada
    grupoEspecialidad: {
      type: String,
      enum: [
        'Primeros Auxilios',
        'Prevención y Control de Incendios',
        'Evacuación y Rescate',
        'Comando de Incidentes (SCI)',
        'Manejo de Sustancias Químicas (HAZMAT)',
        'Integral / Polivalente',
      ],
      default: 'Primeros Auxilios',
    },
    // Rol en el Sistema Comando de Incidentes (SCI)
    rolSCI: {
      type: String,
      default: 'Brigadista Operativo',
      trim: true,
    },
    estadoMembresia: {
      type: String,
      enum: ['Activo', 'Aspirante / Postulado', 'Reserva', 'Inactivo'],
      default: 'Activo',
    },
    rh: {
      type: String,
      default: 'O+',
      trim: true,
    },
    alergiasMedicas: {
      type: String,
      default: 'Ninguna conocida',
      trim: true,
    },
    condicionesMedicas: {
      type: String,
      default: '',
      trim: true,
    },
    aptitudEmergencias: {
      type: String,
      default: 'Apto sin restricciones para atención de emergencias',
    },
    contactoEmergenciaNombre: {
      type: String,
      default: '',
      trim: true,
    },
    contactoEmergenciaParentesco: {
      type: String,
      default: 'Familiar',
      trim: true,
    },
    contactoEmergenciaTelefono: {
      type: String,
      default: '',
      trim: true,
    },
    // Lista de dotación asignada
    dotacion: [
      {
        item: { type: String, required: true },
        entregado: { type: Boolean, default: false },
        fechaEntrega: { type: Date, default: null },
        observacion: { type: String, default: '' },
      },
    ],
    // Capacitaciones acreditadas
    capacitaciones: [
      {
        tema: { type: String, required: true },
        fecha: { type: Date, default: Date.now },
        horas: { type: Number, default: 8 },
        institucion: { type: String, default: 'ARL / Organismo de Socorro' },
        estado: { type: String, default: 'Certificado' },
      },
    ],
    // Simulacros participados
    simulacrosParticipados: [
      {
        nombre: { type: String, required: true },
        fecha: { type: Date, default: Date.now },
        rolDesempenado: { type: String, default: 'Brigadista Operativo' },
      },
    ],
    fechaIngresoBrigada: {
      type: Date,
      default: Date.now,
    },
    carnetEmitido: {
      type: Boolean,
      default: true,
    },
    firmaDigital: {
      type: String,
      default: null,
    },
    fechaFirma: {
      type: Date,
      default: null,
    },
    observaciones: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

SgsstBrigadistaSchema.index({ companyId: 1, cedula: 1 }, { unique: true });

const SgsstBrigadista =
  mongoose.models.SgsstBrigadista || mongoose.model('SgsstBrigadista', SgsstBrigadistaSchema);

module.exports = SgsstBrigadista;
