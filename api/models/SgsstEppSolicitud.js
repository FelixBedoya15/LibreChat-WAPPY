const mongoose = require('mongoose');

const EppSolicitudItemSchema = new mongoose.Schema(
  {
    eppId: { type: String, default: '' }, // Referencia a item id en SgsstEppInventory si aplica
    nombre: { type: String, required: true },
    categoria: { type: String, default: 'Otro' },
    tipo: { type: String, enum: ['Regular', 'Alturas'], default: 'Regular' },
    talla: { type: String, default: 'Única' },
    cantidad: { type: Number, default: 1, min: 1 },
    motivo: {
      type: String,
      enum: [
        'desgaste',
        'deterioro_dano',
        'perdida_hurto',
        'dotacion_periodica',
        'cambio_talla',
        'primera_entrega',
        'otro',
      ],
      default: 'desgaste',
    },
    observaciones: { type: String, default: '' },
  },
  { _id: false }
);

const SgsstEppSolicitudSchema = new mongoose.Schema(
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
    workerId: { type: String, default: '' },
    documento: { type: String, required: true, index: true },
    nombreTrabajador: { type: String, required: true },
    cargo: { type: String, default: '' },
    items: [EppSolicitudItemSchema],
    justificacion: { type: String, default: '' },
    fotoEvidencia: { type: String, default: null }, // Base64 de EPP dañado o desgastado
    urgencia: {
      type: String,
      enum: ['normal', 'alta', 'critica'],
      default: 'normal',
    },
    estado: {
      type: String,
      enum: ['pendiente', 'aprobada', 'entregada', 'rechazada'],
      default: 'pendiente',
      index: true,
    },
    fechaSolicitud: { type: Date, default: Date.now },
    fechaRespuesta: { type: Date, default: null },
    respondidoPor: { type: String, default: '' },
    motivoRechazo: { type: String, default: '' },
    fechaEntrega: { type: Date, default: null },
    entregadoPor: { type: String, default: '' },
    observacionesEntrega: { type: String, default: '' },
  },
  { timestamps: true }
);

SgsstEppSolicitudSchema.index({ companyId: 1, documento: 1, estado: 1 });

module.exports =
  mongoose.models.SgsstEppSolicitud ||
  mongoose.model('SgsstEppSolicitud', SgsstEppSolicitudSchema);
