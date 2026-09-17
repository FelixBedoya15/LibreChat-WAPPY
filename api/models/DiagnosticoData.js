const mongoose = require('mongoose');

const diagnosticoDataSchema = new mongoose.Schema(
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
      type: Array, // Array of { itemId, status ('cumple'|'no_cumple'|'parcial'|'no_aplica'|'pendiente'), observation, code, name, description, evaluation, points }
      default: [],
    },
    companySize: {
      type: String,
      default: 'medium',
    },
    riskLevel: {
      type: Number,
      default: 3,
    },
    score: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 100,
    },
    complianceLevel: {
      type: String,
      default: '',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

diagnosticoDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

const DiagnosticoData =
  mongoose.models.DiagnosticoData || mongoose.model('DiagnosticoData', diagnosticoDataSchema);

module.exports = DiagnosticoData;
