const mongoose = require('mongoose');

const auditoriaDataSchema = new mongoose.Schema(
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
    statusData: {
      type: Array, // Array of { itemId, status ('cumple'|'no_cumple'|'parcial'|'no_aplica'|'pendiente'), observation, code, name, description, criteria, points }
      default: [],
    },
    reviewerInfo: {
      nombre: { type: String, default: '' },
      cargo: { type: String, default: '' },
      licencia: { type: String, default: '' },
      fecha: { type: String, default: '' },
    },
    score: { type: Number, default: 0 },
    compliancePercentage: { type: Number, default: 0 },
    weightedScore: { type: Number, default: 0 },
    weightedPercentage: { type: Number, default: 0 },
    summary: { type: Object, default: {} },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

auditoriaDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

const AuditoriaData = mongoose.models.AuditoriaData || mongoose.model('AuditoriaData', auditoriaDataSchema);

module.exports = AuditoriaData;
