const mongoose = require('mongoose');

const ChemicalProductSchema = new mongoose.Schema({
  id: { type: String, required: true },
  nombre: { type: String, required: true },
  fabricante: { type: String, default: '' },
  estadoFisico: { type: String, enum: ['Líquido', 'Sólido', 'Gaseoso'], default: 'Líquido' },
  pictogramasSga: { type: [String], default: [] }, // Inflamable, Corrosivo, Tóxico, etc.
  claseOnu: { type: String, default: '' }, // Clase 1-9
  ubicacion: { type: String, default: '' },
  cantidadAlmacenada: { type: String, default: '' },
  tieneFds: { type: String, enum: ['Sí', 'No'], default: 'No' },
  tieneRotuloSga: { type: String, enum: ['Sí', 'No'], default: 'No' },
  requisitosAlmacenamiento: { type: String, default: '' },
  incompatibilidades: { type: [String], default: [] },
  trabajadoresExpuestos: { type: [String], default: [] }, // array of workerIds
  observaciones: { type: String, default: '' }
}, { _id: false });

const SgsstChemicalDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: true },
  productos: [ChemicalProductSchema]
}, { timestamps: true });

SgsstChemicalDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.models.SgsstChemicalData || mongoose.model('SgsstChemicalData', SgsstChemicalDataSchema);
