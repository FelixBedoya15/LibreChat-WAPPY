const mongoose = require('mongoose');

const tenshiPendingActionSchema = new mongoose.Schema(
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
      index: true,
    },
    toolName: {
      type: String,
      required: true,
    },
    args: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    title: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    moduleLabel: {
      type: String,
      default: 'SG-SST',
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high',
    },
    status: {
      type: String,
      enum: ['pendiente_aprobacion', 'aprobada', 'rechazada', 'error'],
      default: 'pendiente_aprobacion',
      index: true,
    },
    decidedAt: {
      type: Date,
    },
    decidedBy: {
      type: String,
    },
    executionResult: {
      type: mongoose.Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

const TenshiPendingAction =
  mongoose.models.TenshiPendingAction ||
  mongoose.model('TenshiPendingAction', tenshiPendingActionSchema);

module.exports = TenshiPendingAction;
