const mongoose = require('mongoose');

const EppInventoryItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  codigo: { type: String, default: '' }, // Código SKU / Referencia interna
  nombre: { type: String, required: true },
  categoria: { 
    type: String, 
    enum: [
      'Protección de Cabeza', 
      'Protección Ocular / Facial', 
      'Protección Auditiva', 
      'Protección Respiratoria', 
      'Protección Manual', 
      'Protección de Pies', 
      'Ropa de Trabajo', 
      'Protección contra Caídas (Alturas)', 
      'Otro'
    ], 
    default: 'Otro' 
  },
  tipo: { type: String, enum: ['Regular', 'Alturas'], default: 'Regular' },
  marca: { type: String, default: '' },
  referencia: { type: String, default: '' },
  talla: { type: String, default: 'Única' }, // Única, S, M, L, XL, 38, 39, 40, etc.
  unidad: { type: String, default: 'Unidad' }, // Unidad, Par, Kit, Caja
  stockActual: { type: Number, default: 0, min: 0 },
  stockMinimo: { type: Number, default: 5, min: 0 },
  costoUnitario: { type: Number, default: 0 },
  ubicacionBodega: { type: String, default: 'Almacén Principal' },
  observaciones: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const SgsstEppInventorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: true },
  items: [EppInventoryItemSchema],
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

SgsstEppInventorySchema.index({ user: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.models.SgsstEppInventory || mongoose.model('SgsstEppInventory', SgsstEppInventorySchema);
