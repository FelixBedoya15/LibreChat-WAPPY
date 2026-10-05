const mongoose = require('mongoose');

const InspeccionVehicularSchema = new mongoose.Schema({
  fecha: { type: String, required: true }, // YYYY-MM-DD
  hora: { type: String, default: '' },
  kilometraje: { type: Number, required: true },
  conductorCedula: { type: String, default: '' },
  conductorNombre: { type: String, default: '' },
  tipoVehiculo: { type: String, default: '' },
  luces: { type: String, default: 'Bueno' },
  frenos: { type: String, default: 'Bueno' },
  llantas: { type: String, default: 'Bueno' },
  direccion: { type: String, default: 'Bueno' },
  cinturones: { type: String, default: 'Bueno' },
  checklist: { type: Array, default: [] }, // [{ item, categoria, estado, critico, observacion }]
  resultado: { type: String, enum: ['Aprobado', 'Rechazado'], default: 'Aprobado' },
  firmaConductor: { type: String, default: null }, // Base64 signature
  fotos: { type: Array, default: [] },
  observaciones: { type: String, default: '' },
  origen: { type: String, default: 'portal_colaborador' }
}, { _id: false, strict: false });

const SgsstVehicleDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: true },
  placa: { type: String, required: true },
  marca: { type: String, required: true },
  referencia: { type: String, default: '' },
  modelo: { type: String, default: '' },
  anio: { type: Number },
  tipo: { type: String, default: 'Automóvil' }, // Automóvil, Motocicleta, Camioneta, Camión
  conductorId: { type: String, required: true }, // id de PerfilSociodemograficoData.trabajadores
  conductorNombre: { type: String, required: true },
  soatVencimiento: { type: String, required: true }, // YYYY-MM-DD
  tecnomecanicaVencimiento: { type: String, default: '' }, // YYYY-MM-DD
  ultimoMantenimiento: { type: String, default: '' }, // YYYY-MM-DD
  proximoMantenimiento: { type: String, default: '' }, // YYYY-MM-DD
  kilometrajeActual: { type: Number, default: 0 },
  inspecciones: [InspeccionVehicularSchema]
}, { timestamps: true });

SgsstVehicleDataSchema.index({ user: 1, companyId: 1, placa: 1 }, { unique: true });

module.exports = mongoose.models.SgsstVehicleData || mongoose.model('SgsstVehicleData', SgsstVehicleDataSchema);
