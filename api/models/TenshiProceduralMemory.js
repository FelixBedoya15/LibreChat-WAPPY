const mongoose = require('mongoose');

const tenshiProceduralMemorySchema = new mongoose.Schema(
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
    companyName: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'habito_empresa',
    },
    trigger: {
      type: String,
      required: true,
    },
    rule: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const TenshiProceduralMemory =
  mongoose.models.TenshiProceduralMemory ||
  mongoose.model('TenshiProceduralMemory', tenshiProceduralMemorySchema);

module.exports = TenshiProceduralMemory;
