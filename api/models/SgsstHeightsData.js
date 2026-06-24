const mongoose = require('mongoose');

const EquipoAlturasSchema = new mongoose.Schema({
  id: { type: String, required: true },
  nombre: { type: String, required: true }, // Arnés, Eslinga, Conector, etc.
  marca: { type: String, default: '' },
  referencia: { type: String, default: '' },
  serial: { type: String, required: true },
  fechaFabricacion: { type: String, default: '' }, // YYYY-MM-DD
  fechaCompra: { type: String, default: '' }, // YYYY-MM-DD
  fechaUltimaInspeccion: { type: String, default: '' }, // YYYY-MM-DD
  fechaProximaInspeccion: { type: String, default: '' }, // YYYY-MM-DD
  inspeccionadoPor: { type: String, default: '' },
  resultadoInspeccion: { type: String, enum: ['Aprobado', 'Rechazado', 'N/A'], default: 'N/A' },
  estado: { type: String, enum: ['Vigente', 'Vencido', 'Requiere Inspección', 'Retirado'], default: 'Vigente' },
  firmaTrabajador: { type: String, default: null }, // Base64 signature for receipt
  observaciones: { type: String, default: '' }
}, { _id: false });

const SgsstHeightsDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: true },
  workerId: { type: String, required: true }, // id de PerfilSociodemograficoData.trabajadores
  nombreTrabajador: { type: String, required: true },
  cargo: { type: String, default: '' },
  equipos: [EquipoAlturasSchema]
}, { timestamps: true });

SgsstHeightsDataSchema.index({ user: 1, companyId: 1, workerId: 1 }, { unique: true });

module.exports = mongoose.models.SgsstHeightsData || mongoose.model('SgsstHeightsData', SgsstHeightsDataSchema);
