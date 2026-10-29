const mongoose = require('mongoose');

const MocItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    codigo: { type: String, default: 'MOC-2026-001' },
    titulo: { type: String, required: true },
    tipoCambio: {
      type: String,
      default: 'Maquinaria / Equipo',
    },
    origen: {
      type: String,
      default: 'Interno',
    },
    temporalidad: {
      type: String,
      default: 'Permanente',
    },
    fuenteEcosistema: {
      type: String,
      default: 'Solicitud Operativa',
    },
    descripcion: { type: String, default: '' },
    peligrosNuevos: { type: String, default: '' },
    nivelRiesgoCambio: {
      type: String,
      default: 'Alto',
    },
    controlesRequeridos: { type: String, default: '' },
    modulosImpactados: {
      type: [String],
      default: () => ['Matriz IPEVR (GTC 45)', 'Programa de Capacitaciones'],
    },
    requiereCapacitacion: { type: Boolean, default: true },
    socializadoCopasst: { type: Boolean, default: true },
    responsable: { type: String, default: 'Responsable SG-SST' },
    fechaPropuesta: { type: String, default: '' },
    estado: {
      type: String,
      default: 'En Evaluación',
    },
    sentToKanban: { type: Boolean, default: false },
  },
  { _id: false }
);

const SgsstGestionCambioDataSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: false,
      index: true,
    },
    mocList: {
      type: [MocItemSchema],
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

SgsstGestionCambioDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

module.exports =
  mongoose.models.SgsstGestionCambioData ||
  mongoose.model('SgsstGestionCambioData', SgsstGestionCambioDataSchema);
