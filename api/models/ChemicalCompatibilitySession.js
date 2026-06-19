const mongoose = require('mongoose');

const chemicalCompatibilitySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: false,
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    matrixRows: {
      type: Array,
      default: [],
    },
    /**
     * chartConclusions: conclusiones generadas por IA para cada gráfico del dashboard de compatibilidad.
     * Keys: 'clases_onu' | 'pictogramas' | 'cumplimiento' | 'riesgo_compatibilidad'
     */
    chartConclusions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const ChemicalCompatibilitySession = mongoose.model('ChemicalCompatibilitySession', chemicalCompatibilitySessionSchema);

module.exports = ChemicalCompatibilitySession;
