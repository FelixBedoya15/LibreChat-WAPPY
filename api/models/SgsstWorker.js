const mongoose = require('mongoose');

const SgsstWorkerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
  perfilId: { type: String, required: true }, // Referencia al ID dentro de perfilesList
  nombre: { type: String, required: true },
  documento: { type: String, required: true },
  fechaNacimiento: { type: Date },
  genero: { type: String },
  fechaIngreso: { type: Date },
  condicionesSalud: { type: String, default: '' },
  observaciones: { type: String, default: '' },
  riesgosIpevar: { type: Array, default: [] }, // Matriz IPEVAR del bio-individuo
  updatedAt: { type: Date, default: Date.now },
});

SgsstWorkerSchema.index({ user: 1, companyId: 1, perfilId: 1 });

const SgsstWorker = mongoose.models.SgsstWorker || mongoose.model('SgsstWorker', SgsstWorkerSchema);

module.exports = SgsstWorker;
