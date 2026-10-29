const mongoose = require('mongoose');

const CompraItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    codigo: { type: String, default: 'ADQ-2026-001' },
    productoServicio: { type: String, required: true },
    categoria: {
      type: String,
      default: 'Elementos de Protección Personal (EPP)',
    },
    origenEcosistema: {
      type: String,
      default: 'Requerimiento Directo',
    },
    proveedorSugerido: { type: String, default: 'Por definir por Compras' },
    nitProveedor: { type: String, default: '' },
    cantidadUnidad: { type: String, default: '1 Unidad' },
    normaTecnica: { type: String, default: 'NTC / ANSI / OSHA aplicable' },
    especificacionesSST: { type: String, default: '' },
    criteriosVerificados: { type: String, default: '' },
    requiereFdsSga: { type: Boolean, default: false },
    requiereCertificadoCalidad: { type: Boolean, default: true },
    dictamenSST: {
      type: String,
      default: 'Aprobado para Compra',
    },
    responsableEvaluacion: { type: String, default: 'Responsable SG-SST' },
    fechaEvaluacion: { type: String, default: '' },
    sentToKanban: { type: Boolean, default: false },
  },
  { _id: false }
);

const CriterioMatrizCompraSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    familia: { type: String, required: true },
    normaExigida: { type: String, default: '' },
    requisitosObligatorios: { type: String, default: '' },
    documentosRecepcion: { type: String, default: '' },
    responsableVerificacion: { type: String, default: 'Responsable SG-SST / Almacén' },
  },
  { _id: false }
);

const SgsstComprasDataSchema = new mongoose.Schema(
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
    compras: {
      type: [CompraItemSchema],
      default: [],
    },
    criteriosMatriz: {
      type: [CriterioMatrizCompraSchema],
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

SgsstComprasDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

module.exports =
  mongoose.models.SgsstComprasData ||
  mongoose.model('SgsstComprasData', SgsstComprasDataSchema);
