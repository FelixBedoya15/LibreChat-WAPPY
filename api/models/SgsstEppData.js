const mongoose = require('mongoose');

const EppItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  nombre: { type: String, required: true },
  tipo: { type: String, enum: ['Regular', 'Alturas'], default: 'Regular' },
  // Especificaciones de equipos de alturas
  marca: { type: String, default: '' },
  referencia: { type: String, default: '' },
  serial: { type: String, default: '' },
  fechaUltimaInspeccion: { type: String, default: '' }, // YYYY-MM-DD
  fechaProximaInspeccion: { type: String, default: '' }, // YYYY-MM-DD
  inspeccionadoPor: { type: String, default: '' },
  resultadoInspeccion: { type: String, enum: ['Aprobado', 'Rechazado', 'N/A'], default: 'N/A' },
  // Datos de entrega
  fechaEntrega: { type: String, required: true }, // YYYY-MM-DD
  fechaVencimiento: { type: String, default: '' }, // YYYY-MM-DD (próximo cambio requerido)
  cantidad: { type: Number, default: 1 },
  estado: { type: String, enum: ['Entregado', 'Vencido', 'Inspección Requerida', 'Fuera de Servicio'], default: 'Entregado' },
  firmaTrabajador: { type: String, default: null }, // Base64 de la firma digital
  observaciones: { type: String, default: '' }
}, { _id: false });

const SgsstEppDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: true },
  workerId: { type: String, required: true }, // id de PerfilSociodemograficoData.trabajadores
  documento: { type: String, required: true },
  nombreTrabajador: { type: String, required: true },
  cargo: { type: String, default: '' },
  entregas: [EppItemSchema],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

SgsstEppDataSchema.index({ user: 1, companyId: 1, workerId: 1 }, { unique: true });

module.exports = mongoose.models.SgsstEppData || mongoose.model('SgsstEppData', SgsstEppDataSchema);
